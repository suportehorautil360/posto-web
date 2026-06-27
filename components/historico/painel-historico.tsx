"use client";

import {
  AlertTriangle,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  History,
  Loader2,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ModalDetalheAbastecimento } from "@/components/historico/modal-detalhe-abastecimento";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listarHistoricoPosto } from "@/features/abastecimentos/api";
import {
  fimMesAtual,
  inicioMesAtual,
} from "@/features/abastecimentos/dates";
import {
  exportarHistoricoExcel,
  exportarHistoricoPdf,
} from "@/features/abastecimentos/export";
import { formatBRL, formatLitros } from "@/features/fleetfuel/format";
import type { AbastecimentoHistorico } from "@/features/abastecimentos/types";
import { ApiError } from "@/lib/api/client";

function mensagemErro(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Não foi possível carregar o histórico.";
}

function Kpi({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: string;
  tom?: "default" | "brand";
}) {
  return (
    <div
      className={`rounded-xl px-3 py-3 ring-1 ${
        tom === "brand"
          ? "bg-brand/10 ring-brand/30"
          : "bg-card ring-foreground/10"
      }`}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          tom === "brand" ? "text-brand" : ""
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

export function PainelHistorico() {
  const { operador } = useSession();
  const postoId = operador?.postoId ?? "";
  const postoNome = operador?.nome ?? "";
  const semPosto = !postoId;

  const [inicio, setInicio] = useState(inicioMesAtual);
  const [fim, setFim] = useState(fimMesAtual);
  const [exportInicio, setExportInicio] = useState(inicioMesAtual);
  const [exportFim, setExportFim] = useState(fimMesAtual);
  const [lista, setLista] = useState<AbastecimentoHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<AbastecimentoHistorico | null>(
    null,
  );
  const [modalAberto, setModalAberto] = useState(false);

  const carregar = useCallback(async () => {
    if (!postoId) return;
    setCarregando(true);
    setErro("");
    try {
      setLista(await listarHistoricoPosto(postoId, inicio, fim));
    } catch (err) {
      setErro(mensagemErro(err));
      setLista([]);
    } finally {
      setCarregando(false);
    }
  }, [postoId, inicio, fim]);

  useEffect(() => {
    if (!postoId) {
      queueMicrotask(() => setCarregando(false));
      return;
    }
    void carregar();
  }, [postoId, carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((i) =>
      [i.placa, i.veiculo, i.motorista, i.combustivel, i.local]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [lista, busca]);

  const metricas = useMemo(() => {
    const litros = lista.reduce((s, i) => s + i.litros, 0);
    const valor = lista.reduce((s, i) => s + (i.valor ?? 0), 0);
    const precoMedio = litros > 0 ? valor / litros : 0;
    return {
      total: lista.length,
      litros,
      valor,
      precoMedio,
    };
  }, [lista]);

  const aplicarPeriodo = () => {
    setExportInicio(inicio);
    setExportFim(fim);
    void carregar();
  };

  const usarPeriodoTelaNaExportacao = () => {
    setExportInicio(inicio);
    setExportFim(fim);
  };

  const exportar = async (tipo: "excel" | "pdf") => {
    if (!postoId) return;
    setErro("");
    try {
      const dados =
        exportInicio === inicio && exportFim === fim
          ? lista
          : await listarHistoricoPosto(postoId, exportInicio, exportFim);
      if (!dados.length) {
        setErro("Nenhum abastecimento no período selecionado para exportar.");
        return;
      }
      const opts = {
        postoId,
        postoNome,
        inicio: exportInicio,
        fim: exportFim,
      };
      if (tipo === "excel") exportarHistoricoExcel(dados, opts);
      else exportarHistoricoPdf(dados, opts);
    } catch (err) {
      setErro(mensagemErro(err));
    }
  };

  const abrirDetalhe = (item: AbastecimentoHistorico) => {
    setSelecionado(item);
    setModalAberto(true);
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-8">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <History className="size-6 text-brand" aria-hidden />
          Histórico
        </h1>
        <p className="text-sm text-muted-foreground">
          Abastecimentos registrados neste posto. Toque em um registro para ver os detalhes.
        </p>
      </div>

      {semPosto ? (
        <div className="flex gap-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          <p>Sessão sem posto vinculado. Faça login novamente.</p>
        </div>
      ) : null}

      <section className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Período da consulta
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">De</span>
            <Input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              disabled={semPosto}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Até</span>
            <Input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              disabled={semPosto}
            />
          </label>
        </div>
        <Button
          type="button"
          variant="brand"
          className="w-full"
          disabled={semPosto || carregando}
          onClick={aplicarPeriodo}
        >
          {carregando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
            </>
          ) : (
            "Aplicar período"
          )}
        </Button>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi rotulo="Registros" valor={String(metricas.total)} />
        <Kpi rotulo="Litros" valor={formatLitros(metricas.litros)} />
        <Kpi rotulo="Faturado" valor={formatBRL(metricas.valor)} tom="brand" />
        <Kpi
          rotulo="Média R$/L"
          valor={
            metricas.precoMedio > 0
              ? metricas.precoMedio.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : "—"
          }
        />
      </div>

      <section className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Exportar
          </p>
          <button
            type="button"
            className="text-xs text-brand hover:underline"
            onClick={usarPeriodoTelaNaExportacao}
          >
            Usar período da consulta
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">De</span>
            <Input
              type="date"
              value={exportInicio}
              onChange={(e) => setExportInicio(e.target.value)}
              disabled={semPosto}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Até</span>
            <Input
              type="date"
              value={exportFim}
              onChange={(e) => setExportFim(e.target.value)}
              disabled={semPosto}
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={semPosto}
            onClick={() => void exportar("excel")}
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={semPosto}
            onClick={() => void exportar("pdf")}
          >
            <FileText className="size-4" aria-hidden />
            PDF
          </Button>
        </div>
      </section>

      {erro ? (
        <p className="text-sm text-destructive" role="alert">
          {erro}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Registros
        </h2>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar placa, motorista…"
            className="pl-9"
            aria-label="Buscar abastecimento"
          />
        </div>

        {carregando ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum abastecimento neste período.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtrados.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => abrirDetalhe(item)}
                  className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.placa}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.data} · {item.hora} · {formatLitros(item.litros)}
                      {item.valor !== null ? ` · ${formatBRL(item.valor)}` : ""}
                    </p>
                    {item.motorista !== "—" ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.motorista}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalDetalheAbastecimento
        item={selecionado}
        open={modalAberto}
        onOpenChange={setModalAberto}
      />
    </div>
  );
}
