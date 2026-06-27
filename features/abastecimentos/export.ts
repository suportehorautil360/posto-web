import { formatBRL } from "@/features/fleetfuel/format";
import {
  downloadPlanilhaEstilizada,
  esc,
  imprimirHtmlRelatorio,
  type ColunaPlanilha,
} from "@/lib/export/spreadsheet";

import type { AbastecimentoHistorico } from "./types";

const COLUNAS: ColunaPlanilha[] = [
  { titulo: "Data", largura: 100 },
  { titulo: "Hora", largura: 70, alinhamento: "center" },
  { titulo: "Placa", largura: 100 },
  { titulo: "Veículo", largura: 180 },
  { titulo: "Motorista", largura: 160 },
  { titulo: "Combustível", largura: 110 },
  { titulo: "Litros", largura: 80, alinhamento: "right" },
  { titulo: "R$/L", largura: 80, alinhamento: "right" },
  { titulo: "Total", largura: 100, alinhamento: "right" },
  { titulo: "Leitura", largura: 100 },
  { titulo: "Local", largura: 160 },
];

function formatPreco(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function linha(item: AbastecimentoHistorico): string[] {
  return [
    item.data,
    item.hora,
    item.placa,
    item.veiculo,
    item.motorista,
    item.combustivel,
    item.litros.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    formatPreco(item.precoLitro),
    item.valor === null ? "—" : formatBRL(item.valor),
    item.leitura,
    item.local,
  ];
}

export function nomeArquivoHistorico(
  postoId: string,
  inicio: string,
  fim: string,
  ext: "xls" | "pdf",
): string {
  return `historico-abastecimentos_${postoId}_${inicio}_${fim}.${ext}`;
}

export function exportarHistoricoExcel(
  itens: AbastecimentoHistorico[],
  opts: { postoId: string; postoNome: string; inicio: string; fim: string },
): void {
  downloadPlanilhaEstilizada(
    nomeArquivoHistorico(opts.postoId, opts.inicio, opts.fim, "xls"),
    COLUNAS,
    itens.map(linha),
    "Abastecimentos",
  );
}

export function exportarHistoricoPdf(
  itens: AbastecimentoHistorico[],
  opts: { postoId: string; postoNome: string; inicio: string; fim: string },
): void {
  const totalLitros = itens.reduce((s, i) => s + i.litros, 0);
  const totalValor = itens.reduce((s, i) => s + (i.valor ?? 0), 0);

  const rowsHtml = itens
    .map(
      (i) =>
        `<tr>
          <td>${esc(i.data)} ${esc(i.hora)}</td>
          <td>${esc(i.placa)}</td>
          <td>${esc(i.veiculo)}</td>
          <td>${esc(i.motorista)}</td>
          <td>${esc(i.combustivel)}</td>
          <td class="num">${i.litros.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
          <td class="num">${esc(formatPreco(i.precoLitro))}</td>
          <td class="num">${esc(i.valor === null ? "—" : formatBRL(i.valor))}</td>
        </tr>`,
    )
    .join("");

  const body = `
    <h1>Histórico de abastecimentos</h1>
    <p class="meta">
      <strong>Posto:</strong> ${esc(opts.postoNome || opts.postoId)}<br>
      <strong>Período:</strong> ${esc(formatPeriodo(opts.inicio, opts.fim))}<br>
      <strong>Registros:</strong> ${itens.length}<br>
      <strong>Gerado em:</strong> ${esc(new Date().toLocaleString("pt-BR"))}
    </p>
    <table>
      <thead>
        <tr>
          <th>Data/Hora</th>
          <th>Placa</th>
          <th>Veículo</th>
          <th>Motorista</th>
          <th>Combust.</th>
          <th>Litros</th>
          <th>R$/L</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          <th colspan="5">Totais</th>
          <th class="num">${totalLitros.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} L</th>
          <th></th>
          <th class="num">${esc(formatBRL(totalValor))}</th>
        </tr>
      </tfoot>
    </table>`;

  imprimirHtmlRelatorio("Histórico de abastecimentos", body);
}

function formatPeriodo(inicio: string, fim: string): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  return `${fmt(inicio)} a ${fmt(fim)}`;
}
