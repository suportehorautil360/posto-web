/** Tipos do fluxo FleetFuel (Painel do Posto). */

export interface VeiculoVerificado {
  equipmentId: string;
  placa: string;
  descricao: string;
  modelo: string;
  tipo: string;
  combustivel: string;
  medicaoAtual: number;
  unidadeRevisao: "km" | "h" | null;
  capacidadeTanque: number;
  status: string;
}

export interface MotoristaVerificado {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
}

export interface BloqueioVerificacao {
  codigo:
    | "veiculo_nao_encontrado"
    | "veiculo_inativo"
    | "odometro_incoerente"
    | "revisao_obrigatoria"
    | "motorista_nao_encontrado"
    | "motorista_inativo";
  titulo: string;
  detalhe: string;
}

export interface VerificacaoResult {
  liberado: boolean;
  veiculo: VeiculoVerificado | null;
  motorista: MotoristaVerificado | null;
  saldoDisponivel: number | null;
  measurementType: string | null;
  bloqueio: BloqueioVerificacao | null;
}

export interface IntencaoResumo {
  placa: string;
  motorista: string;
  combustivel: string;
  litros: number;
  precoLitro: number;
  total: number;
  posto: string | null;
}

export interface IntencaoResult {
  intencaoId: string;
  token: string;
  qrConteudo: string;
  expiresAt: string;
  resumo: IntencaoResumo;
}

export type IntencaoStatus =
  | "pendente_validacao"
  | "concluido"
  | "expirado"
  | "cancelado";

export interface StatusResult {
  id: string;
  status: IntencaoStatus;
  abastecimentoId: string | null;
  validatedAt: string | null;
  expiresAt: string;
}

/** Combustíveis oferecidos na bomba (rótulos exibidos no select). */
export const TIPOS_COMBUSTIVEL = [
  "Gasolina Comum",
  "Gasolina Aditivada",
  "Etanol",
  "Diesel S-10",
  "Diesel S-500",
  "GNV",
] as const;

export type TipoCombustivel = (typeof TIPOS_COMBUSTIVEL)[number];
