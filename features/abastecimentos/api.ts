/** Histórico de abastecimentos do posto — GET /abastecimentos/posto/:postoId */
import { api } from "@/lib/api/client";

import { addDaysIso } from "./dates";
import type { AbastecimentoHistorico } from "./types";

interface AbastecimentoApi {
  id: string;
  dateTime?: string;
  createdAt?: string;
  vehicle?: { name?: string; plate?: string; type?: string };
  motoristaNome?: string | null;
  fuelType?: string | null;
  liters?: number;
  pricePerLiter?: number | null;
  value?: number | null;
  reading?: string;
  local?: string | null;
  meterPhoto?: string | null;
}

function asStr(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

function parseValor(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const limpo = v.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

function formatDataHora(iso: string): { data: string; hora: string; dataHora: string } {
  if (!iso) return { data: "—", hora: "—", dataHora: "—" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { data: "—", hora: "—", dataHora: "—" };
  return {
    data: d.toLocaleDateString("pt-BR"),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    dataHora: d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function normalizar(raw: AbastecimentoApi): AbastecimentoHistorico {
  const createdAt = asStr(raw.createdAt);
  const dt = formatDataHora(createdAt || asStr(raw.dateTime));
  const vehicle = raw.vehicle ?? {};
  return {
    id: raw.id,
    dataHora: asStr(raw.dateTime) || dt.dataHora,
    data: dt.data,
    hora: dt.hora,
    placa: asStr(vehicle.plate) || "—",
    veiculo: asStr(vehicle.name) || "—",
    tipoVeiculo: asStr(vehicle.type) || "—",
    motorista: asStr(raw.motoristaNome) || "—",
    combustivel: asStr(raw.fuelType) || "—",
    litros: Number(raw.liters) || 0,
    precoLitro:
      raw.pricePerLiter === null || raw.pricePerLiter === undefined
        ? null
        : parseValor(raw.pricePerLiter),
    valor: parseValor(raw.value),
    leitura: asStr(raw.reading) || "—",
    local: asStr(raw.local) || "—",
    meterPhoto: asStr(raw.meterPhoto) || undefined,
    createdAt,
  };
}

/** Lista abastecimentos do posto no intervalo [inicio, fim] inclusivo. */
export async function listarHistoricoPosto(
  postoId: string,
  inicio: string,
  fimInclusive: string,
): Promise<AbastecimentoHistorico[]> {
  const endDateApi = addDaysIso(fimInclusive, 1);
  const qs = new URLSearchParams({ startDate: inicio, endDate: endDateApi });
  const r = await api.get<{ data: AbastecimentoApi[] }>(
    `/abastecimentos/posto/${encodeURIComponent(postoId)}?${qs}`,
  );
  return (r.data ?? []).map(normalizar);
}
