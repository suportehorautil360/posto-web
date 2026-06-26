/** Tipos da feature Notas Fiscais (espelha o contrato /notas-fiscais do back). */

export const NOTA_STATUS = ["pendente", "aprovada", "rejeitada"] as const;
export type NotaStatus = (typeof NOTA_STATUS)[number];

export type NotaCategory = "servico" | "peca" | "combustivel" | "outros";
export type NotaDocumentType = "nfe-55" | "nfce-65";

export interface NotaFiscal {
  id: string;
  postoId?: string;
  prefeituraId?: string;
  description: string;
  category: NotaCategory;
  documentType: NotaDocumentType;
  number: string;
  issuerName: string;
  issuedAt: string;
  accessKey: string;
  value: number;
  status: NotaStatus;
  fileName: string;
  fileUrl: string;
  createdAt: string;
  /** "parcial" = PDF salvo, mas a leitura automática não extraiu tudo. */
  parseCompleteness?: "completo" | "parcial";
}

export const STATUS_LABEL: Record<NotaStatus, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

/** Rótulo legível do tipo de documento. */
export function documentoLabel(t: NotaDocumentType): string {
  return t === "nfce-65" ? "NFC-e" : "NF-e";
}
