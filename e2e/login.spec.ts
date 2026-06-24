import { expect, test } from "@playwright/test";

test("mostra a tela Acesso Restrito (demo)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Acesso Restrito" })).toBeVisible();
  await expect(page.getByText("DEMO", { exact: true })).toBeVisible();
  await expect(page.getByText("Login demo:")).toBeVisible();
});

test("login demo posto01/demo1234 entra na home", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Usuário").fill("posto01");
  await page.getByLabel("Senha").fill("demo1234");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("Operador conectado")).toBeVisible();
});

test("credencial errada mostra erro", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Usuário").fill("posto01");
  await page.getByLabel("Senha").fill("errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Usuário ou senha inválidos.")).toBeVisible();
});
