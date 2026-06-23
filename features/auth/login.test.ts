import { describe, expect, it } from "vitest";

import { validarLoginDemo } from "./login";

describe("validarLoginDemo", () => {
  it("aceita a credencial demo", () => {
    expect(validarLoginDemo("posto01", "demo1234")).toBe(true);
  });
  it("ignora espaços ao redor do usuário", () => {
    expect(validarLoginDemo("  posto01 ", "demo1234")).toBe(true);
  });
  it("rejeita credencial errada", () => {
    expect(validarLoginDemo("posto01", "errada")).toBe(false);
    expect(validarLoginDemo("outro", "demo1234")).toBe(false);
    expect(validarLoginDemo("", "")).toBe(false);
  });
});
