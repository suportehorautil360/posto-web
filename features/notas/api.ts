/** Client das notas fiscais de combustível — endpoints /notas-fiscais do back. */
import { api } from "@/lib/api/client";

import type { NotaFiscal } from "./types";

/** Envia o PDF da DANFE/NFC-e. O back extrai os campos e devolve a nota criada. */
export async function enviarNota(
  postoId: string,
  prefeituraId: string,
  file: File,
): Promise<NotaFiscal> {
  const form = new FormData();
  form.append("file", file);
  if (prefeituraId) form.append("prefeituraId", prefeituraId);
  const r = await api.upload<{ data: NotaFiscal }>(
    `/notas-fiscais/posto/${encodeURIComponent(postoId)}`,
    form,
  );
  return r.data;
}

/** Lista as notas enviadas pelo posto (mais recentes primeiro). */
export async function listarNotas(postoId: string): Promise<NotaFiscal[]> {
  const r = await api.get<{ data: NotaFiscal[] }>(
    `/notas-fiscais/posto/${encodeURIComponent(postoId)}`,
  );
  return r.data ?? [];
}
