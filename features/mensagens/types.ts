/** Tipos do chat de suporte — espelha /suporte do back. */

export const CANAIS = ["financeiro", "ti"] as const;
export type SuporteChannel = (typeof CANAIS)[number];

export type SuporteSender = "user" | "support";

export interface MensagemSuporte {
  id: string;
  postoId?: string;
  channel: SuporteChannel;
  sender: SuporteSender;
  text: string;
  createdAt: string;
  readAt?: string | null;
}

export interface SuporteResumo {
  unreadCount: number;
  channels: Record<
    SuporteChannel,
    { unreadCount: number; lastMessageAt: string | null }
  >;
  online: boolean;
}

export const CANAL_INFO: Record<
  SuporteChannel,
  { label: string; subtitulo: string; remetente: string; emoji: string }
> = {
  financeiro: {
    label: "Financeiro",
    subtitulo: "Dúvidas sobre notas e reembolsos",
    remetente: "FINANCEIRO",
    emoji: "💰",
  },
  ti: {
    label: "TI / Suporte",
    subtitulo: "Problemas no sistema e acessos",
    remetente: "TI",
    emoji: "🔧",
  },
};
