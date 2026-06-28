import { afterEach, describe, expect, it, vi } from "vitest";

import { enviarNota, listarNotas } from "./api";

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

describe("enviarNota", () => {
  it("envia multipart com o PDF + prefeituraId e devolve a nota criada", async () => {
    const nota = { id: "nf-1", postoId: "p1", value: 1250, status: "pendente" };
    const fn = mockFetch({ data: nota, message: "ok" });

    const file = new File([new Uint8Array([1, 2, 3])], "nota.pdf", {
      type: "application/pdf",
    });
    const r = await enviarNota("p1", "pref-1", file, 1250);

    expect(r).toEqual(nota);

    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/notas-fiscais/posto/p1");
    expect(init.method).toBe("POST");
    const form = init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect((form.get("file") as File).name).toBe("nota.pdf");
    expect(form.get("prefeituraId")).toBe("pref-1");
    expect(form.get("value")).toBe("1250");
    // multipart: o client não deve fixar Content-Type (o browser põe o boundary).
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("propaga a mensagem de erro do back (ex.: nota duplicada)", async () => {
    mockFetch({ message: "Esta nota fiscal já foi enviada." }, false, 409);
    const file = new File([new Uint8Array([1])], "n.pdf", {
      type: "application/pdf",
    });
    await expect(enviarNota("p1", "pref-1", file, 100)).rejects.toThrow(
      "Esta nota fiscal já foi enviada.",
    );
  });
});

describe("listarNotas", () => {
  it("busca as notas do posto e devolve o array", async () => {
    const notas = [{ id: "a" }, { id: "b" }];
    const fn = mockFetch({ data: notas, message: "ok" });

    const r = await listarNotas("p1");
    expect(r).toEqual(notas);

    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/notas-fiscais/posto/p1");
    expect(init.method).toBe("GET");
  });

  it("retorna [] quando a resposta não traz data", async () => {
    mockFetch({ message: "ok" });
    expect(await listarNotas("p1")).toEqual([]);
  });
});
