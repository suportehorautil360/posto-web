import { expect, test, type Page } from "@playwright/test";

/** Resposta do back (POST /user/auth/login) — mockada nos testes. */
function mockLogin(
  page: Page,
  body: Record<string, unknown>,
  { status = 200 }: { status?: number } = {},
) {
  return page.route("**/user/auth/login", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );
}

test("mostra a tela Acesso Restrito", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Acesso Restrito" })).toBeVisible();
  await expect(page.getByText("HOMOLOGAÇÃO", { exact: true })).toBeVisible();
});

test("operador de posto entra na home", async ({ page }) => {
  await mockLogin(page, {
    ok: true,
    accessToken: "jwt-e2e",
    user: {
      nome: "Posto Centro",
      usuario: "posto01",
      perfil: "gestor",
      vinculo: "posto",
      prefeituraId: "pref-1",
      postoId: "posto-1",
    },
  });

  await page.goto("/");
  await page.getByLabel("Usuário").fill("posto01");
  await page.getByLabel("Senha").fill("1234");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("Posto Centro")).toBeVisible();
});

test("usuário que não é de posto é recusado", async ({ page }) => {
  await mockLogin(page, {
    ok: true,
    accessToken: "jwt-e2e",
    user: { nome: "Admin", usuario: "admin", vinculo: "prefeitura", prefeituraId: "pref-1" },
  });

  await page.goto("/");
  await page.getByLabel("Usuário").fill("admin");
  await page.getByLabel("Senha").fill("1234");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("Este acesso não é de um posto.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("credencial inválida mostra a mensagem do back", async ({ page }) => {
  await mockLogin(page, { ok: false, msg: "Login ou senha invalidos." });

  await page.goto("/");
  await page.getByLabel("Usuário").fill("posto01");
  await page.getByLabel("Senha").fill("errada");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("Login ou senha invalidos.")).toBeVisible();
});
