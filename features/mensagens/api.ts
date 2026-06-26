/** Client do chat de suporte — endpoints /suporte/posto do back. */
import { api } from "@/lib/api/client";

import type { MensagemSuporte, SuporteChannel, SuporteResumo } from "./types";

export async function listarMensagens(
  postoId: string,
  channel: SuporteChannel,
): Promise<MensagemSuporte[]> {
  const r = await api.get<{
    data: { channel: SuporteChannel; messages: MensagemSuporte[] };
  }>(
    `/suporte/posto/${encodeURIComponent(postoId)}/mensagens?channel=${encodeURIComponent(channel)}`,
  );
  return r.data?.messages ?? [];
}

export async function enviarMensagem(
  postoId: string,
  prefeituraId: string,
  channel: SuporteChannel,
  text: string,
): Promise<MensagemSuporte[]> {
  const r = await api.post<{
    data: { message: MensagemSuporte; messages: MensagemSuporte[] };
  }>(`/suporte/posto/${encodeURIComponent(postoId)}/mensagens`, {
    postoId,
    ...(prefeituraId ? { prefeituraId } : {}),
    channel,
    text,
  });
  return r.data?.messages ?? [];
}

export async function obterResumo(postoId: string): Promise<SuporteResumo> {
  const r = await api.get<{ data: SuporteResumo }>(
    `/suporte/posto/${encodeURIComponent(postoId)}/resumo`,
  );
  return (
    r.data ?? {
      unreadCount: 0,
      channels: {
        financeiro: { unreadCount: 0, lastMessageAt: null },
        ti: { unreadCount: 0, lastMessageAt: null },
      },
      online: true,
    }
  );
}

export async function marcarLidas(
  postoId: string,
  channel: SuporteChannel,
): Promise<void> {
  await api.patch(`/suporte/posto/${encodeURIComponent(postoId)}/mensagens/lidas`, {
    channel,
  });
}
