/** Login e recuperação de senha do operador do posto — NestJS /user/auth/*. */
import { api } from "@/lib/api/client";

export interface Operador {
  usuario: string;
  nome: string;
  email?: string;
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
  email?: string;
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

interface AuthMessageResponse {
  ok: boolean;
  message?: string;
  msg?: string;
}

function loginPayload(
  identificador: string,
  senha: string,
): { email?: string; usuario?: string; senha: string } {
  const trimmed = identificador.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed.toLowerCase(), senha };
  }
  return { usuario: trimmed, senha };
}

export async function login(identificador: string, senha: string): Promise<LoginResult> {
  const r = await api.post<LoginResponse>("/user/auth/login", loginPayload(identificador, senha));
  if (!r.ok || !r.accessToken || !r.user) {
    throw new Error(r.msg ?? r.message ?? "E-mail/usuário ou senha inválidos.");
  }
  if (r.user.vinculo !== "posto") {
    throw new Error("Este acesso não é de um posto.");
  }
  const loginId = r.user.usuario ?? identificador.trim();
  return {
    token: r.accessToken,
    user: {
      usuario: loginId,
      nome: r.user.nome ?? loginId,
      email: r.user.email,
      postoId: r.user.postoId,
      prefeituraId: r.user.prefeituraId,
    },
  };
}

export async function esqueciSenha(email: string): Promise<string> {
  const r = await api.post<AuthMessageResponse>("/user/auth/esqueci-senha", {
    email: email.trim().toLowerCase(),
  });
  if (!r.ok) {
    throw new Error(r.message ?? r.msg ?? "Não foi possível enviar o e-mail.");
  }
  return r.message ?? "Se o e-mail estiver cadastrado, você receberá instruções em instantes.";
}

export async function redefinirSenha(token: string, novaSenha: string): Promise<string> {
  const r = await api.post<AuthMessageResponse>("/user/auth/redefinir-senha", {
    token: token.trim(),
    novaSenha,
  });
  if (!r.ok) {
    throw new Error(r.message ?? r.msg ?? "Não foi possível redefinir a senha.");
  }
  return r.message ?? "Senha redefinida com sucesso.";
}
