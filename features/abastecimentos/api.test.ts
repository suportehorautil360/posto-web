import { afterEach, describe, expect, it, vi } from "vitest";

import { listarHistoricoPosto } from "./api";

function mockFetch(json: unknown, ok = true, status = 200) {
  const fn = vi.fn(async () => ({
    ok,
    status,
    json: async () => json,
  })) as unknown as typeof fetch;
  globalThis.fetch = fn;
  return fn as unknown as ReturnType<typeof vi.fn>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listarHistoricoPosto", () => {
  it("busca abastecimentos do posto com intervalo de datas", async () => {
    const fn = mockFetch({
      data: [
        {
          id: "a1",
          createdAt: "2026-06-15T14:30:00.000Z",
          vehicle: { plate: "ABC1D23", name: "Caminhão" },
          liters: 120,
          value: 856.8,
          motoristaNome: "João",
          fuelType: "Diesel S10",
        },
      ],
    });

    const r = await listarHistoricoPosto("posto-1", "2026-06-01", "2026-06-30");
    expect(r).toHaveLength(1);
    expect(r[0]?.placa).toBe("ABC1D23");
    expect(r[0]?.motorista).toBe("João");

    const [url] = fn.mock.calls[0] as unknown as [string];
    expect(url).toContain("/abastecimentos/posto/posto-1");
    expect(url).toContain("startDate=2026-06-01");
    expect(url).toContain("endDate=2026-07-01");
  });

  it("retorna [] quando a resposta não traz data", async () => {
    mockFetch({ message: "ok" });
    expect(await listarHistoricoPosto("p1", "2026-06-01", "2026-06-30")).toEqual(
      [],
    );
  });
});
