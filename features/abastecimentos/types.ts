/** Abastecimento registrado no posto (FleetFuel ou legado). */

export interface AbastecimentoHistorico {
  id: string;
  dataHora: string;
  data: string;
  hora: string;
  placa: string;
  veiculo: string;
  tipoVeiculo: string;
  motorista: string;
  combustivel: string;
  litros: number;
  precoLitro: number | null;
  valor: number | null;
  leitura: string;
  local: string;
  meterPhoto?: string;
  createdAt: string;
}
