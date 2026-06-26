"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import {
  enviarMensagem,
  listarMensagens,
  marcarLidas,
  obterResumo,
} from "@/features/mensagens/api";
import {
  CANAL_INFO,
  type MensagemSuporte,
  type SuporteChannel,
  type SuporteResumo,
} from "@/features/mensagens/types";
import { ApiError } from "@/lib/api/client";
import { Loader2, Send } from "lucide-react";

const POLL_MS = 15_000;

function formatHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function ehHoje(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const hoje = new Date();
  return (
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  );
}

export function useSuporteResumo(postoId: string | undefined) {
  const [resumo, setResumo] = useState<SuporteResumo | null>(null);

  const recarregar = useCallback(async () => {
    if (!postoId) {
      setResumo(null);
      return;
    }
    try {
      setResumo(await obterResumo(postoId));
    } catch {
      /* badge opcional — falha silenciosa */
    }
  }, [postoId]);

  useEffect(() => {
    let ativo = true;
    if (!postoId) return;
    void (async () => {
      try {
        const r = await obterResumo(postoId);
        if (ativo) setResumo(r);
      } catch {
        /* ignora */
      }
    })();
    return () => {
      ativo = false;
    };
  }, [postoId]);

  return { resumo, recarregar };
}

export function PainelMensagens({
  onResumoChange,
}: {
  onResumoChange?: () => void;
}) {
  const { operador } = useSession();
  const postoId = operador?.postoId ?? "";
  const prefeituraId = operador?.prefeituraId ?? "";
  const semPosto = !postoId;

  const [canal, setCanal] = useState<SuporteChannel>("financeiro");
  const [mensagens, setMensagens] = useState<MensagemSuporte[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    if (!postoId) return;
    try {
      setMensagens(await listarMensagens(postoId, canal));
      setErro("");
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }, [postoId, canal]);

  useEffect(() => {
    if (!postoId) {
      queueMicrotask(() => setCarregando(false));
      return;
    }
    let ativo = true;
    queueMicrotask(() => {
      if (ativo) setCarregando(true);
    });
    void (async () => {
      try {
        const msgs = await listarMensagens(postoId, canal);
        if (!ativo) return;
        setMensagens(msgs);
        await marcarLidas(postoId, canal);
        onResumoChange?.();
      } catch (err) {
        if (ativo) setErro(mensagemErro(err));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [postoId, canal, onResumoChange]);

  useEffect(() => {
    if (!postoId || carregando) return;
    const id = setInterval(() => void carregar(), POLL_MS);
    return () => clearInterval(id);
  }, [postoId, carregando, carregar]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    const msg = texto.trim();
    if (!msg || !postoId) return;
    setEnviando(true);
    setErro("");
    try {
      const novas = await enviarMensagem(postoId, prefeituraId, canal, msg);
      setMensagens((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const extra = novas.filter((m) => !ids.has(m.id));
        return [...prev, ...extra];
      });
      setTexto("");
      await marcarLidas(postoId, canal);
      onResumoChange?.();
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  }

  const info = CANAL_INFO[canal];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mensagens</h1>
        <p className="text-sm text-muted-foreground">
          Tire dúvidas sobre notas e gastos com o Financeiro, ou problemas no
          sistema com a TI.
        </p>
      </div>

      {semPosto ? (
        <p className="text-sm text-warning" role="alert">
          Sessão sem posto vinculado. Verifique o cadastro no 360.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(CANAL_INFO) as SuporteChannel[]).map((id) => {
          const c = CANAL_INFO[id];
          const ativo = canal === id;
          return (
            <button
              key={id}
              type="button"
              disabled={semPosto}
              onClick={() => setCanal(id)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-colors disabled:opacity-60 ${
                ativo
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-border text-muted-foreground hover:border-brand/40"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {c.emoji}
              </span>
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {info.emoji}
            </span>
            <div>
              <p className="text-sm font-semibold">{info.label}</p>
              <p className="text-xs text-muted-foreground">{info.subtitulo}</p>
            </div>
          </div>
          <span
            className="size-2.5 rounded-full bg-success"
            title="Online"
            aria-label="Equipe online"
          />
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {carregando ? (
            <p className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
            </p>
          ) : (
            <>
              {mensagens.some((m) => ehHoje(m.createdAt)) ? (
                <p className="text-center text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Hoje
                </p>
              ) : null}
              {mensagens.map((m) => (
                <Bolha key={m.id} mensagem={m} canal={canal} />
              ))}
              <div ref={fimRef} />
            </>
          )}
        </div>

        <form
          onSubmit={handleEnviar}
          className="flex gap-2 border-t border-border p-3"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva sua mensagem…"
            disabled={semPosto || enviando}
            maxLength={2000}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
            aria-label="Mensagem"
          />
          <button
            type="submit"
            disabled={semPosto || enviando || !texto.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground transition-opacity disabled:opacity-50"
            aria-label="Enviar"
          >
            {enviando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
          </button>
        </form>
      </div>

      {erro ? (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

function Bolha({
  mensagem,
  canal,
}: {
  mensagem: MensagemSuporte;
  canal: SuporteChannel;
}) {
  const ehUsuario = mensagem.sender === "user";
  const info = CANAL_INFO[canal];

  if (ehUsuario) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand/15 px-3 py-2">
          <p className="text-sm">{mensagem.text}</p>
          <p className="mt-1 text-right text-[0.65rem] text-muted-foreground">
            {formatHora(mensagem.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-1">
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
          {info.remetente}
        </p>
        <div className="rounded-2xl rounded-bl-md bg-muted/60 px-3 py-2">
          <p className="text-sm">{mensagem.text}</p>
          <p className="mt-1 text-right text-[0.65rem] text-muted-foreground">
            {formatHora(mensagem.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function mensagemErro(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Não foi possível concluir a operação.";
}
