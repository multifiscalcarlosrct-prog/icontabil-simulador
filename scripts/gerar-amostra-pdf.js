// Gera um PDF de amostra (via motor real) para inspeção visual. Uso: node scripts/gerar-amostra-pdf.js
import fs from 'node:fs';
import * as motorDecisao from '../src/services/motorDecisao.js';
import * as pdfService from '../src/services/pdfService.js';

const resultado = await motorDecisao.comparar({
  cnpj: '40125462000150',
  faturamento: 380000,
  pctPJ: 70,
  pesoInsumos: 20,
  setor: 'comercio',
  uf: 'BA',
});

const buf = await pdfService.gerar(resultado);
fs.writeFileSync('scripts/amostra.pdf', buf);
console.log(`PDF gerado: scripts/amostra.pdf (${buf.length} bytes) — recomendacao: ${resultado.recomendacao}`);
