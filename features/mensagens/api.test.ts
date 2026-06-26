import { afterEach, describe, expect, it, vi } from "vitest";

import {
  enviarMensagem,
  listarMensagens,
  marcarLidas,
  obterResumo,
} from "./api";

function mockFetch(json: unknown, ok = true) {
  const fn = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 400,
    json: async () => json,
  })) as unknown as typeof fetch;
  globalThis.fetch = fn;
  return fn as unknown as ReturnType<typeof vi.fn>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listarMensagens", () => {
  it("busca mensagens do canal", async () => {
    const msgs = [{ id: "m1", sender: "support", text: "Olá" }];
    const fn = mockFetch({
      data: { channel: "financeiro", messages: msgs },
    });

    const r = await listarMensagens("p1", "financeiro");
    expect(r).toEqual(msgs);
    expect(fn.mock.calls[0][0]).toContain("/suporte/posto/p1/mensagens");
    expect(fn.mock.calls[0][0]).toContain("channel=financeiro");
  });
});

describe("enviarMensagem", () => {
  it("envia POST com postoId, channel e text", async () => {
    const novas = [
      { id: "u1", sender: "user", text: "Oi" },
      { id: "s1", sender: "support", text: "Recebemos" },
    ];
    const fn = mockFetch({ data: { message: novas[0], messages: novas } });

    const r = await enviarMensagem("p1", "pref-1", "ti", "Oi");
    expect(r).toEqual(novas);

    const [, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      postoId: "p1",
      prefeituraId: "pref-1",
      channel: "ti",
      text: "Oi",
    });
  });
});

describe("obterResumo", () => {
  it("retorna unreadCount", async () => {
    mockFetch({ data: { unreadCount: 2, channels: {}, online: true } });
    const r = await obterResumo("p1");
    expect(r.unreadCount).toBe(2);
  });
});

describe("marcarLidas", () => {
  it("chama PATCH com channel", async () => {
    const fn = mockFetch({ data: { updated: 1 } });
    await marcarLidas("p1", "financeiro");
    const [, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ channel: "financeiro" });
  });
});
