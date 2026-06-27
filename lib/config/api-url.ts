/** Normaliza a base da API NestJS (NEXT_PUBLIC_API_URL). */
export function resolveApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();

  // Deploy Vercel: same-origin /api → rewrite no next.config (evita URL errada no bundle).
  if (process.env.VERCEL === "1") return "/api";

  if (!raw) {
    return process.env.NODE_ENV === "production"
      ? "/api"
      : "http://localhost:3000";
  }

  const url = raw.replace(/\/$/, "");
  if (url.startsWith("/")) return url;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}
