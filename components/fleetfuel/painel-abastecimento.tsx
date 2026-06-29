"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Fuel,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "@/components/fleetfuel/qr-code";
import {
  criarIntencao,
  statusIntencao,
  verificarVeiculo,
} from "@/features/fleetfuel/api";
import { formatBRL, formatKm, formatLitros, parseDecimal } from "@/features/fleetfuel/format";
import {
  TIPOS_COMBUSTIVEL,
  type IntencaoResult,
  type IntencaoStatus,
  type VerificacaoResult,
} from "@/features/fleetfuel/types";
import { ApiError } from "@/lib/api/client";

type Etapa = "verificacao" | "registro" | "comprovante";

export function PainelAbastecimento() {
  const { operador } = useSession();
  const prefeituraId = operador?.prefeituraId ?? "";
  const postoId = operador?.postoId ?? "";
  const postoNome = operador?.nome ?? undefined;

  const [etapa, setEtapa] = useState<Etapa>("verificacao");
  const [placa, setPlaca] = useState("");
  const [kmAtual, setKmAtual] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [verificacao, setVerificacao] = useState<VerificacaoResult | null>(null);

  const [tipoCombustivel, setTipoCombustivel] = useState<string>(TIPOS_COMBUSTIVEL[3]);
  const [litros, setLitros] = useState("");
  const [precoLitro, setPrecoLitro] = useState("");

  const [intencao, setIntencao] = useState<IntencaoResult | null>(null);

  const semPosto = !prefeituraId || !postoId;

  const total = useMemo(() => {
    const l = parseDecimal(litros);
    const p = parseDecimal(precoLitro);
    if (!Number.isFinite(l) || !Number.isFinite(p)) return 0;
    return Math.round(l * p * 100) / 100;
  }, [litros, precoLitro]);

  const resetar = useCallback(() => {
    setEtapa("verificacao");
    setVerificacao(null);
    setIntencao(null);
    setPlaca("");
    setKmAtual("");
    setCpf("");
    setTipoCombustivel(TIPOS_COMBUSTIVEL[3]);
    setLitros("");
    setPrecoLitro("");
    setErro("");
  }, []);

  async function handleVerificar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const r = await verificarVeiculo({
        prefeituraId,
        postoId,
        placa: placa.trim(),
        kmAtual: Number(parseDecimal(kmAtual)),
        cpfMotorista: cpf.trim(),
      });
      setVerificacao(r);
      if (r.liberado) setEtapa("registro");
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setCarregando(false);
    }
  }

  async function handleConfirmar() {
    setErro("");
    const l = parseDecimal(litros);
    const p = parseDecimal(precoLitro);
    if (!Number.isFinite(l) || l <= 0) {
      setErro("Informe os litros abastecidos.");
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      setErro("Informe o preço por litro.");
      return;
    }
    setCarregando(true);
    try {
      const r = await criarIntencao({
        prefeituraId,
        postoId,
        postoNome,
        placa: placa.trim(),
        kmAtual: Number(parseDecimal(kmAtual)),
        cpfMotorista: cpf.trim(),
        tipoCombustivel,
        liters: l,
        pricePerLiter: p,
      });
      setIntencao(r);
      setEtapa("comprovante");
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Painel do Posto</h1>
        <p className="text-sm text-muted-foreground">
          Abastecimento, verificação de veículo e validação por QR.
        </p>
      </div>

      {semPosto ? (
        <CartaoAviso
          titulo="Sessão sem posto vinculado"
          detalhe="O login do operador não retornou postoId/prefeituraId. Verifique o cadastro do posto no 360."
        />
      ) : null}

      {etapa === "verificacao" ? (
        <EtapaVerificacao
          placa={placa}
          kmAtual={kmAtual}
          cpf={cpf}
          carregando={carregando}
          erro={erro}
          bloqueio={verificacao?.liberado === false ? verificacao.bloqueio : null}
          disabled={semPosto}
          onPlaca={setPlaca}
          onKm={setKmAtual}
          onCpf={setCpf}
          onSubmit={handleVerificar}
        />
      ) : null}

      {etapa === "registro" && verificacao?.veiculo ? (
        <EtapaRegistro
          verificacao={verificacao}
          tipoCombustivel={tipoCombustivel}
          litros={litros}
          precoLitro={precoLitro}
          total={total}
          carregando={carregando}
          erro={erro}
          onTipo={setTipoCombustivel}
          onLitros={setLitros}
          onPreco={setPrecoLitro}
          onConfirmar={handleConfirmar}
          onVoltar={resetar}
        />
      ) : null}

      {etapa === "comprovante" && intencao ? (
        <EtapaComprovante intencao={intencao} onNovo={resetar} />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Etapa 1 — verificação
// ---------------------------------------------------------------------------

function EtapaVerificacao(props: {
  placa: string;
  kmAtual: string;
  cpf: string;
  carregando: boolean;
  erro: string;
  bloqueio: VerificacaoResult["bloqueio"];
  disabled: boolean;
  onPlaca: (v: string) => void;
  onKm: (v: string) => void;
  onCpf: (v: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={props.onSubmit}
      className="space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
          1
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Verificação do veículo
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Placa" htmlFor="placa">
          <Input
            id="placa"
            value={props.placa}
            onChange={(e) => props.onPlaca(e.target.value.toUpperCase())}
            placeholder="BRA2E19"
            className="font-mono uppercase"
            required
          />
        </Campo>
        <Campo label="KM atual" htmlFor="km">
          <Input
            id="km"
            inputMode="numeric"
            value={props.kmAtual}
            onChange={(e) => props.onKm(e.target.value)}
            placeholder="130000"
            className="font-mono"
            required
          />
        </Campo>
      </div>

      <Campo label="CPF do motorista" htmlFor="cpf">
        <Input
          id="cpf"
          inputMode="numeric"
          value={props.cpf}
          onChange={(e) => props.onCpf(e.target.value)}
          placeholder="123.456.789-00"
          className="font-mono"
          required
        />
      </Campo>

      {props.bloqueio ? (
        <CartaoBloqueio
          titulo={props.bloqueio.titulo}
          detalhe={props.bloqueio.detalhe}
        />
      ) : null}

      {props.erro ? (
        <p className="text-sm text-destructive" role="alert">
          {props.erro}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="brand"
        className="h-11 w-full text-base"
        disabled={props.carregando || props.disabled}
      >
        {props.carregando ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Verificando…
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" aria-hidden /> Verificar Veículo
          </>
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Etapa 2 — registro
// ---------------------------------------------------------------------------

function EtapaRegistro(props: {
  verificacao: VerificacaoResult;
  tipoCombustivel: string;
  litros: string;
  precoLitro: string;
  total: number;
  carregando: boolean;
  erro: string;
  onTipo: (v: string) => void;
  onLitros: (v: string) => void;
  onPreco: (v: string) => void;
  onConfirmar: () => void;
  onVoltar: () => void;
}) {
  const { veiculo, motorista, saldoDisponivel } = props.verificacao;
  const saldoInsuficiente =
    saldoDisponivel != null && props.total > saldoDisponivel;

  return (
    <div className="space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-4" aria-hidden />
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Registrar abastecimento
        </h2>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-muted/40 p-4">
        <Info rotulo="Placa" valor={veiculo?.placa ?? "—"} mono />
        <Info rotulo="Modelo" valor={veiculo?.modelo || veiculo?.descricao || "—"} />
        <Info rotulo="Motorista" valor={motorista?.nome ?? "—"} />
        <Info rotulo="Combustível" valor={veiculo?.combustivel || "—"} />
        <Info rotulo="KM atual" valor={formatKm(veiculo?.medicaoAtual)} />
        <Info
          rotulo="Saldo disponível"
          valor={saldoDisponivel != null ? formatBRL(saldoDisponivel) : "—"}
          destaque
        />
      </dl>

      <div className="space-y-3">
        <Campo label="Tipo de combustível" htmlFor="tipo">
          <select
            id="tipo"
            value={props.tipoCombustivel}
            onChange={(e) => props.onTipo(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {TIPOS_COMBUSTIVEL.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Litros" htmlFor="litros">
            <Input
              id="litros"
              inputMode="decimal"
              value={props.litros}
              onChange={(e) => props.onLitros(e.target.value)}
              placeholder="0,000"
              className="font-mono"
            />
          </Campo>
          <Campo label="R$ / litro" htmlFor="preco">
            <Input
              id="preco"
              inputMode="decimal"
              value={props.precoLitro}
              onChange={(e) => props.onPreco(e.target.value)}
              placeholder="0,00"
              className="font-mono"
            />
          </Campo>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Total do abastecimento
        </span>
        <span
          className={`text-xl font-semibold tabular-nums ${
            saldoInsuficiente ? "text-destructive" : "text-success"
          }`}
        >
          {formatBRL(props.total)}
        </span>
      </div>

      {saldoInsuficiente ? (
        <CartaoBloqueio
          titulo="Saldo insuficiente"
          detalhe="O total excede o saldo disponível da empresa para este veículo."
        />
      ) : null}

      {props.erro ? (
        <p className="text-sm text-destructive" role="alert">
          {props.erro}
        </p>
      ) : null}

      <div className="space-y-2">
        <Button
          type="button"
          variant="brand"
          className="h-11 w-full text-base"
          onClick={props.onConfirmar}
          disabled={props.carregando || saldoInsuficiente}
        >
          {props.carregando ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Gerando QR…
            </>
          ) : (
            <>
              <Fuel className="size-4" aria-hidden /> Confirmar Abastecimento
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          onClick={props.onVoltar}
        >
          <RotateCcw className="size-4" aria-hidden /> Nova verificação
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Etapa 3 — comprovante + QR + polling
// ---------------------------------------------------------------------------

function EtapaComprovante(props: { intencao: IntencaoResult; onNovo: () => void }) {
  const { intencao } = props;
  const [status, setStatus] = useState<IntencaoStatus>("pendente_validacao");

  useEffect(() => {
    if (status !== "pendente_validacao") return;
    let ativo = true;
    const tick = async () => {
      try {
        const r = await statusIntencao(intencao.intencaoId);
        if (ativo) setStatus(r.status);
      } catch {
        /* tenta de novo no próximo tick */
      }
    };
    const id = setInterval(tick, 3000);
    void tick();
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, [intencao.intencaoId, status]);

  const concluido = status === "concluido";
  const expirado = status === "expirado" || status === "cancelado";

  return (
    <div className="space-y-4 rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10">
      <h2 className="text-lg font-semibold tracking-tight">Comprovante</h2>

      {concluido ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-success/10 p-6">
          <CheckCircle2 className="size-10 text-success" aria-hidden />
          <p className="font-medium text-success">Abastecimento validado!</p>
          <p className="text-xs text-muted-foreground">
            O motorista confirmou pelo app. Saldo debitado.
          </p>
        </div>
      ) : expirado ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-destructive/10 p-6">
          <AlertTriangle className="size-10 text-destructive" aria-hidden />
          <p className="font-medium text-destructive">QR expirado</p>
          <p className="text-xs text-muted-foreground">
            Gere um novo abastecimento para continuar.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Motorista escaneia para validar
          </p>
          <div className="flex justify-center">
            <QrCode value={intencao.qrConteudo} />
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Aguardando validação do
            motorista…
          </p>
        </>
      )}

      <dl className="divide-y divide-border rounded-xl bg-muted/40 px-4 text-left">
        <Linha rotulo="Placa" valor={intencao.resumo.placa} mono />
        <Linha rotulo="Motorista" valor={intencao.resumo.motorista} />
        <Linha rotulo="Combustível" valor={intencao.resumo.combustivel} />
        <Linha rotulo="Litros" valor={formatLitros(intencao.resumo.litros)} />
        {intencao.resumo.posto ? (
          <Linha rotulo="Posto" valor={intencao.resumo.posto} />
        ) : null}
        <Linha rotulo="Total" valor={formatBRL(intencao.resumo.total)} destaque />
      </dl>

      <Button
        type="button"
        variant={concluido ? "brand" : "outline"}
        className="h-11 w-full text-base"
        onClick={props.onNovo}
      >
        <RotateCcw className="size-4" aria-hidden /> Novo Abastecimento
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UI auxiliares
// ---------------------------------------------------------------------------

function Campo({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-xs uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function Info({
  rotulo,
  valor,
  mono,
  destaque,
}: {
  rotulo: string;
  valor: string;
  mono?: boolean;
  destaque?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd
        className={`text-sm font-medium ${mono ? "font-mono" : ""} ${
          destaque ? "text-success" : ""
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  mono,
  destaque,
}: {
  rotulo: string;
  valor: string;
  mono?: boolean;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd
        className={`text-right text-sm font-medium ${mono ? "font-mono" : ""} ${
          destaque ? "text-success" : ""
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

function CartaoBloqueio({ titulo, detalhe }: { titulo: string; detalhe: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-4 ring-1 ring-destructive/20">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-destructive">{titulo}</p>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </div>
    </div>
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
