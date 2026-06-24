/** Login do operador do posto — POST /user/auth/login (NestJS). */
import { api } from "@/lib/api/client";

export interface Operador {
  usuario: string;
  nome: string;
  postoId?: string;
  prefeituraId?: string;
}

export interface LoginResult {
  token: string;
  user: Operador;
}

interface UserAuth {
  nome?: string;
  usuario?: string;
  vinculo?: string;
  prefeituraId?: string;
  postoId?: string;
}
interface LoginResponse {
  ok: boolean;
  msg?: string;
  message?: string;
  user?: UserAuth;
  accessToken?: string;
}

export async function login(usuario: string, senha: string): Promise<LoginResult> {
  const r = await api.post<LoginResponse>("/user/auth/login", {
    usuario: usuario.trim(),
    senha,
  });
  if (!r.ok || !r.accessToken || !r.user) {
    throw new Error(r.msg ?? r.message ?? "Usuário ou senha inválidos.");
  }
  if (r.user.vinculo !== "posto") {
    throw new Error("Este acesso não é de um posto.");
  }
  return {
    token: r.accessToken,
    user: {
      usuario: r.user.usuario ?? usuario.trim(),
      nome: r.user.nome ?? r.user.usuario ?? usuario.trim(),
      postoId: r.user.postoId,
      prefeituraId: r.user.prefeituraId,
    },
  };
}
