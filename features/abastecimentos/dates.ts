/** Utilitários de período para histórico de abastecimentos. */

export function isoHoje(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function inicioMesAtual(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function fimMesAtual(): string {
  const d = new Date();
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const y = ultimo.getFullYear();
  const m = String(ultimo.getMonth() + 1).padStart(2, "0");
  const day = String(ultimo.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Soma dias em YYYY-MM-DD (calendário local). */
export function addDaysIso(iso: string, days: number): string {
  const [y, mo, da] = iso.split("-").map(Number);
  const dt = new Date(y, mo - 1, da);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
