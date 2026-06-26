import { expect, test, type Page } from "@playwright/test";

/** Loga como operador de posto (mock do /user/auth/login) e cai na /home. */
async function entrarComoPosto(page: Page) {
  await page.route("**/user/auth/login", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        accessToken: "jwt-e2e",
        user: {
          nome: "Posto Boa Viagem",
          usuario: "posto01",
          vinculo: "posto",
          prefeituraId: "pref-1",
          postoId: "posto-1",
        },
      }),
    }),
  );
  await page.goto("/");
  await page.getByLabel("Usuário").fill("posto01");
  await page.getByLabel("Senha").fill("1234");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/home$/);
}

const VEICULO = {
  equipmentId: "equip-1",
  placa: "BRA2E19",
  descricao: "Caminhão de carga",
  modelo: "Volvo FH 500",
  tipo: "Caminhões",
  combustivel: "Diesel",
  medicaoAtual: 125200,
  unidadeRevisao: "km",
  capacidadeTanque: 300,
  status: "ativo",
};

const MOTORISTA = {
  id: "func-1",
  nome: "Carlos Eduardo Souza",
  cpf: "12345678900",
  cargo: "Motorista",
};

function mockVerificacao(page: Page, data: Record<string, unknown>) {
  return page.route("**/fleetfuel/verificacao", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data, message: "ok" }),
    }),
  );
}

async function preencherVerificacao(page: Page) {
  await page.getByLabel("Placa").fill("BRA2E19");
  await page.getByLabel("KM atual").fill("130000");
  await page.getByLabel("CPF do motorista").fill("123.456.789-00");
  await page.getByRole("button", { name: "Verificar Veículo" }).click();
}

test("verificação bloqueada mostra o motivo (revisão obrigatória)", async ({ page }) => {
  await entrarComoPosto(page);
  await mockVerificacao(page, {
    liberado: false,
    veiculo: VEICULO,
    motorista: null,
    saldoDisponivel: null,
    measurementType: null,
    bloqueio: {
      codigo: "revisao_obrigatoria",
      titulo: "Revisão Obrigatória",
      detalhe: "Veículo atingiu o limite de KM para revisão.",
    },
  });

  await preencherVerificacao(page);

  await expect(page.getByText("Revisão Obrigatória")).toBeVisible();
  await expect(
    page.getByText("Veículo atingiu o limite de KM para revisão."),
  ).toBeVisible();
  // Continua na etapa de verificação (não avança).
  await expect(page.getByRole("button", { name: "Verificar Veículo" })).toBeVisible();
});

test("fluxo feliz: verifica → registra → gera QR → motorista valida", async ({ page }) => {
  await entrarComoPosto(page);

  await mockVerificacao(page, {
    liberado: true,
    veiculo: VEICULO,
    motorista: MOTORISTA,
    saldoDisponivel: 15000,
    measurementType: "hodometro",
    bloqueio: null,
  });

  await page.route("**/fleetfuel/intencao", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          intencaoId: "intencao-1",
          token: "token-jwt-e2e",
          qrConteudo: "token-jwt-e2e",
          expiresAt: new Date(Date.now() + 600000).toISOString(),
          resumo: {
            placa: "BRA2E19",
            motorista: "Carlos Eduardo Souza",
            combustivel: "Diesel S-10",
            litros: 100,
            precoLitro: 6,
            total: 600,
            posto: "Posto Boa Viagem",
          },
        },
        message: "ok",
      }),
    }),
  );

  // Status: pendente nas 1ªs chamadas, depois concluído.
  let chamadasStatus = 0;
  await page.route("**/fleetfuel/intencao/*", (route) => {
    chamadasStatus += 1;
    const status = chamadasStatus >= 2 ? "concluido" : "pendente_validacao";
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: "intencao-1",
          status,
          abastecimentoId: status === "concluido" ? "abast-1" : null,
          validatedAt: status === "concluido" ? new Date().toISOString() : null,
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        },
        message: "ok",
      }),
    });
  });

  await preencherVerificacao(page);

  // Etapa de registro com os dados do veículo/motorista/saldo.
  await expect(page.getByText("Registrar abastecimento")).toBeVisible();
  await expect(page.getByText("Volvo FH 500")).toBeVisible();
  await expect(page.getByText("Carlos Eduardo Souza")).toBeVisible();
  await expect(page.getByText("R$ 15.000,00")).toBeVisible();

  await page.getByLabel("Tipo de combustível").selectOption("Diesel S-10");
  await page.getByLabel("Litros").fill("100");
  await page.getByLabel("R$ / litro").fill("6,00");

  // Total calculado.
  await expect(page.getByText("R$ 600,00")).toBeVisible();

  await page.getByRole("button", { name: "Confirmar Abastecimento" }).click();

  // Comprovante com QR + aguardando validação.
  await expect(page.getByText("Comprovante")).toBeVisible();
  await expect(page.getByRole("img", { name: "QR Code do abastecimento" })).toBeVisible();

  // Polling conclui quando o motorista valida.
  await expect(page.getByText("Abastecimento validado!")).toBeVisible();
});

test("saldo insuficiente bloqueia a confirmação", async ({ page }) => {
  await entrarComoPosto(page);
  await mockVerificacao(page, {
    liberado: true,
    veiculo: VEICULO,
    motorista: MOTORISTA,
    saldoDisponivel: 100,
    measurementType: "hodometro",
    bloqueio: null,
  });

  await preencherVerificacao(page);
  await expect(page.getByText("Registrar abastecimento")).toBeVisible();

  await page.getByLabel("Litros").fill("100");
  await page.getByLabel("R$ / litro").fill("6,00");

  await expect(page.getByText("Saldo insuficiente")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar Abastecimento" })).toBeDisabled();
});
