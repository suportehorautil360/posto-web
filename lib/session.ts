/** Sessão simples do operador do posto (localStorage). Sem token/offline. */

export interface Sessao {
  usuario: string;
  nome: string;
}

const KEY = "fleetfuel_posto_sessao";

export function salvarSessao(s: Sessao): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignora */
  }
}

export function getSessao(): Sessao | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sessao) : null;
  } catch {
    return null;
  }
}

export function limparSessao(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
