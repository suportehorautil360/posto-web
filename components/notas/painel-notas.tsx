"use client";

import {
  AlertTriangle,
  FileText,
  Fuel,
  Loader2,
  Search,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { Input } from "@/components/ui/input";
import { enviarNota, listarNotas } from "@/features/notas/api";
import {
  documentoLabel,
  STATUS_LABEL,
  type NotaFiscal,
  type NotaStatus,
} from "@/features/notas/types";
import { formatBRL } from "@/features/fleetfuel/format";
import { ApiError } from "@/lib/api/client";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

type Filtro = "todas" | NotaStatus;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "aprovada", label: "Aprovadas" },
  { id: "pendente", label: "Pendentes" },
  { id: "rejeitada", label: "Rejeitadas" },
];

function noMesAtual(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const agora = new Date();
  return (
    d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth()
  );
}

function formatData(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function PainelNotas() {
  const { operador } = useSession();
  const prefeituraId = operador?.prefeituraId ?? "";
  const postoId = operador?.postoId ?? "";
  const semPosto = !postoId;

  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  // Recarrega a lista sem mexer no "carregando" global (usado após enviar).
  const recarregar = useCallback(async () => {
    if (!postoId) return;
    try {
      setNotas(await listarNotas(postoId));
    } catch (err) {
      setErro(mensagemErro(err));
    }
  }, [postoId]);

  useEffect(() => {
    let ativo = true;
    if (!postoId) {
      queueMicrotask(() => {
        if (ativo) setCarregando(false);
      });
      return () => {
        ativo = false;
      };
    }
    void (async () => {
      try {
        const data = await listarNotas(postoId);
        if (ativo) setNotas(data);
      } catch (err) {
        if (ativo) setErro(mensagemErro(err));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [postoId]);

  const enviar = useCallback(
    async (file: File) => {
      setErro("");
      const ehPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!ehPdf) {
        setErro("Envie o PDF da nota (DANFE NF-e mod. 55 ou NFC-e mod. 65).");
        return;
      }
      if (file.size > MAX_PDF_BYTES) {
        setErro("O PDF deve ter no máximo 10 MB.");
        return;
      }
      setEnviando(true);
      try {
        await enviarNota(postoId, prefeituraId, file);
        await recarregar();
      } catch (err) {
        setErro(mensagemErro(err));
      } finally {
        setEnviando(false);
      }
    },
    [postoId, prefeituraId, recarregar],
  );

  const totais = useMemo(() => {
    const doMes = notas.filter((n) => noMesAtual(n.issuedAt || n.createdAt));
    const total = doMes.reduce((s, n) => s + (n.value || 0), 0);
    const aprovadas = doMes
      .filter((n) => n.status === "aprovada")
      .reduce((s, n) => s + (n.value || 0), 0);
    const pendentes = doMes.filter((n) => n.status === "pendente").length;
    return { total, aprovadas, pendentes };
  }, [notas]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return notas.filter((n) => {
      if (filtro !== "todas" && n.status !== filtro) return false;
      if (!q) return true;
      return [n.number, n.issuerName, n.description, n.accessKey]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [notas, busca, filtro]);

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground">
          Envie o PDF das notas de combustível para conferência.
        </p>
      </div>

      {semPosto ? (
        <CartaoAviso
          titulo="Sessão sem posto vinculado"
          detalhe="O login do operador não retornou postoId. Verifique o cadastro do posto no 360."
        />
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <Kpi rotulo="Total no mês" valor={formatBRL(totais.total)} />
        <Kpi rotulo="Aprovadas" valor={formatBRL(totais.aprovadas)} tom="success" />
        <Kpi rotulo="Pendentes" valor={String(totais.pendentes)} tom="warning" />
      </div>

      <Dropzone enviando={enviando} disabled={semPosto} onArquivo={enviar} />

      {erro ? (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notas lançadas
        </h2>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nota…"
              className="pl-9"
              aria-label="Buscar nota"
            />
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            aria-label="Filtrar por status"
            className="flex h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {FILTROS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {carregando ? (
          <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
          </p>
        ) : lista.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {notas.length === 0
              ? "Nenhuma nota enviada ainda."
              : "Nenhuma nota encontrada com esse filtro."}
          </p>
        ) : (
          <ul className="space-y-2">
            {lista.map((n) => (
              <ItemNota key={n.id} nota={n} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Kpi({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: string;
  tom?: "success" | "warning";
}) {
  const cor =
    tom === "success" ? "text-success" : tom === "warning" ? "text-warning" : "";
  return (
    <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
      <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${cor}`}>{valor}</p>
    </div>
  );
}

function Dropzone({
  enviando,
  disabled,
  onArquivo,
}: {
  enviando: boolean;
  disabled: boolean;
  onArquivo: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  return (
    <div className="space-y-2 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <UploadCloud className="size-4 text-brand" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Enviar nota fiscal (PDF)
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Aceita apenas o PDF da nota emitida no site da SEFAZ — DANFE (NF-e mod. 55)
        ou Cupom (NFC-e mod. 65). Somente notas de combustível são aceitas.
      </p>

      <button
        type="button"
        disabled={disabled || enviando}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onArquivo(file);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors disabled:opacity-60 ${
          arrastando
            ? "border-brand bg-brand/5"
            : "border-border hover:border-brand/50"
        }`}
      >
        {enviando ? (
          <>
            <Loader2 className="size-7 animate-spin text-brand" aria-hidden />
            <span className="text-sm font-medium text-brand">Lendo o PDF…</span>
          </>
        ) : (
          <>
            <FileText className="size-7 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium text-brand">
              Toque para selecionar
            </span>
            <span className="text-xs text-muted-foreground">
              ou arraste o PDF aqui · NF-e / NFC-e de combustível · até 10 MB
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onArquivo(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ItemNota({ nota }: { nota: NotaFiscal }) {
  const revisar = nota.parseCompleteness === "parcial";
  return (
    <li className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 font-medium">
            <Fuel className="size-4 shrink-0 text-brand" aria-hidden />
            <span className="truncate">{nota.description || "Combustível"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {documentoLabel(nota.documentType)} nº {nota.number || "—"} ·{" "}
            {nota.issuerName || "Emitente não identificado"} ·{" "}
            {formatData(nota.issuedAt || nota.createdAt)}
          </p>
          {nota.accessKey ? (
            <p className="truncate font-mono text-[0.65rem] text-muted-foreground">
              {nota.accessKey}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Etiqueta texto="Combustível" />
            <BadgeStatus status={nota.status} />
            {revisar ? <Etiqueta texto="Revisar" tom="warning" /> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold tabular-nums">{formatBRL(nota.value)}</p>
          {nota.fileUrl ? (
            <a
              href={nota.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <FileText className="size-3.5" aria-hidden />
              {nota.fileName || "PDF"}
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function Etiqueta({ texto, tom }: { texto: string; tom?: "warning" }) {
  const cls =
    tom === "warning"
      ? "bg-warning/15 text-warning"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider ${cls}`}
    >
      {texto}
    </span>
  );
}

function BadgeStatus({ status }: { status: NotaStatus }) {
  const cls =
    status === "aprovada"
      ? "bg-success/15 text-success"
      : status === "rejeitada"
        ? "bg-destructive/15 text-destructive"
        : "bg-warning/15 text-warning";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${cls}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function CartaoAviso({ titulo, detalhe }: { titulo: string; detalhe: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-warning/10 p-4 ring-1 ring-warning/20">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-warning">{titulo}</p>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </div>
    </div>
  );
}

function mensagemErro(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Não foi possível concluir a operação.";
}
