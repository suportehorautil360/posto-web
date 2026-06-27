/** Utilitários para exportação em PDF (impressão do navegador). */

export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Abre janela de impressão (PDF via "Salvar como PDF" do navegador). */
export function imprimirHtmlRelatorio(titulo: string, bodyHtml: string): void {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(titulo)}</title>
<style>
  body { font-family: "Segoe UI", sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 8px; }
  p.meta { font-size: 12px; color: #444; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
  th { background: #f1f5f9; }
  td.num { text-align: right; }
  tfoot th { background: #e2e8f0; }
</style></head><body>${bodyHtml}</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
