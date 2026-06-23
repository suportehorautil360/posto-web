import { describe, expect, it } from "vitest";

import { environmentLabel } from "./env";

describe("environmentLabel", () => {
  it("mapeia ambientes conhecidos", () => {
    expect(environmentLabel("demo")).toBe("Modo demonstração");
    expect(environmentLabel("homologacao")).toBe("Homologação");
    expect(environmentLabel("producao")).toBe("Produção");
  });
  it("desconhecido cai em Produção", () => {
    expect(environmentLabel("x")).toBe("Produção");
  });
});
