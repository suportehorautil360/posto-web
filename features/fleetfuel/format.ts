/** Formatação pt-BR para o Painel do Posto. */

export function formatBRL(valor: number | null | undefined): string {
  const n = Number(valor);
  return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatLitros(litros: number | null | undefined): string {
  const n = Number(litros);
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} L`;
}

export function formatKm(km: number | null | undefined): string {
  const n = Number(km);
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("pt-BR")} km`;
}

/** "1.234,56" → 1234.56 (aceita entrada com vírgula ou ponto). */
export function parseDecimal(value: string): number {
  if (!value) return NaN;
  const normalizado = value
    .trim()
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  return Number(normalizado);
}
