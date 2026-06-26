/** Client do fluxo FleetFuel — endpoints /fleetfuel da API NestJS. */
import { api } from "@/lib/api/client";

import type {
  IntencaoResult,
  StatusResult,
  VerificacaoResult,
} from "./types";

export interface VerificarInput {
  prefeituraId: string;
  postoId: string;
  placa: string;
  kmAtual: number;
  cpfMotorista: string;
}

export interface CriarIntencaoInput extends VerificarInput {
  postoNome?: string;
  tipoCombustivel: string;
  liters: number;
  pricePerLiter: number;
}

export async function verificarVeiculo(
  input: VerificarInput,
): Promise<VerificacaoResult> {
  const r = await api.post<{ data: VerificacaoResult }>(
    "/fleetfuel/verificacao",
    input,
  );
  return r.data;
}

export async function criarIntencao(
  input: CriarIntencaoInput,
): Promise<IntencaoResult> {
  const r = await api.post<{ data: IntencaoResult }>(
    "/fleetfuel/intencao",
    input,
  );
  return r.data;
}

export async function statusIntencao(id: string): Promise<StatusResult> {
  const r = await api.get<{ data: StatusResult }>(
    `/fleetfuel/intencao/${encodeURIComponent(id)}`,
  );
  return r.data;
}
