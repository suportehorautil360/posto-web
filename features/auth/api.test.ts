import { afterEach, describe, expect, it, vi } from "vitest";

import { login } from "./api";

afterEach(() => vi.restoreAllMocks());

function mockFetch(json: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status, json: async () => json })) as unknown as typeof fetch,
  );
}

describe("login", () => {
  it("mapeia a resposta de um operador de posto", async () => {
    mockFetch({
      ok: true,
      accessToken: "jwt-1",
      user: {
        nome: "Posto Centro",
        usuario: "posto01",
        perfil: "gestor",
        vinculo: "posto",
        prefeituraId: "pref-1",
        postoId: "posto-1",
      },
    });
    const r = await login("posto01", "1234");
    expect(r.token).toBe("jwt-1");
    expect(r.user).toEqual({
      usuario: "posto01",
      nome: "Posto Centro",
      postoId: "posto-1",
      prefeituraId: "pref-1",
    });
  });

  it("rejeita usuário que não é de posto", async () => {
    mockFetch({
      ok: true,
      accessToken: "jwt-2",
      user: { nome: "Admin", usuario: "admin", vinculo: "admin", prefeituraId: "p" },
    });
    await expect(login("admin", "1234")).rejects.toThrow("não é de um posto");
  });

  it("propaga a msg do back quando ok=false", async () => {
    mockFetch({ ok: false, msg: "Login ou senha invalidos." });
    await expect(login("x", "y")).rejects.toThrow("Login ou senha invalidos.");
  });
});
