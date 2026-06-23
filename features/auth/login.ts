import { DEMO_OPERADOR } from "./demo";

/** Valida a credencial demo (puro). */
export function validarLoginDemo(usuario: string, senha: string): boolean {
  return usuario.trim() === DEMO_OPERADOR.usuario && senha === DEMO_OPERADOR.senha;
}
