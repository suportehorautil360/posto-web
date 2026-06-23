/** Configuração de ambiente do posto-web. */

export type AppEnv = "demo" | "homologacao" | "producao";

const RAW = (process.env.NEXT_PUBLIC_APP_ENV ?? "producao").toLowerCase();

export const APP_ENV: AppEnv =
  RAW === "demo" || RAW === "homologacao" ? RAW : "producao";

export const isDemo = APP_ENV === "demo";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function environmentLabel(env: string = APP_ENV): string {
  switch (env) {
    case "demo":
      return "Modo demonstração";
    case "homologacao":
      return "Homologação";
    default:
      return "Produção";
  }
}
