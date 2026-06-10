// Relatório PDF na identidade visual iContábil IA.
// Documento que o cliente recebe → layout CLARO e profissional, com as cores da marca
// (verde #22C55E, roxo #A855F7, vermelho #E8202A, preto #1A1A1A) como acento.
import PDFDocument from 'pdfkit';

// Paleta da marca.
const COR = {
  preto: '#1A1A1A',
  verde: '#16A34A',
  verdeClaro: '#22C55E',
  roxo: '#9333EA',
  vermelho: '#E8202A',
  cinza: '#52525B',
  cinzaClaro: '#E4E4E7',
  fundoSuave: '#F4F4F5',
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (f) => `${Math.round((Number(f) || 0) * 100)}%`;

function formataCnpj(c) {
  const d = String(c || '').replace(/\D/g, '').padStart(14, '0');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function dataHoraBR() {
  return new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const SETOR_LABEL = { comercio: 'Comércio', servico: 'Serviço', industria: 'Indústria', rural: 'Rural / Agro' };

// Gera o PDF a partir do resultado da simulação. Retorna um Buffer.
export async function gerar(resultado) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: 'Relatório iContábil IA', Author: 'iContábil IA' } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const pronto = new Promise((res) => doc.on('end', () => res(Buffer.concat(chunks))));

  const M = 50; // margem de conteúdo
  const L = doc.page.width - M * 2; // largura útil
  const r = resultado || {};
  const ent = r.entrada || {};
  const prem = r.premissas || {};
  const puro = r.cenarios?.simplesPuro || {};
  const hib = r.cenarios?.simplesHibrido || {};
  const vencedorHibrido = r.recomendacao === 'hibrido';
  const vencedorNome = vencedorHibrido ? 'Simples Híbrido' : 'Simples Puro';
  const corRec = r.forca === 'forte' ? COR.verde : COR.roxo;

  // ---------- Cabeçalho ----------
  doc.rect(0, 0, doc.page.width, 90).fill(COR.preto);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('iContábil ', M, 30, { continued: true });
  doc.fillColor(COR.verdeClaro).text('IA');
  doc.fillColor('#C9C9D2').font('Helvetica').fontSize(10)
    .text('Simulador de Regime Tributário · Reforma (IBS/CBS)', M, 58);
  // faixa de acento verde→roxo
  doc.rect(0, 90, doc.page.width, 4).fill(COR.verde);
  doc.rect(doc.page.width / 2, 90, doc.page.width / 2, 4).fill(COR.roxo);

  let y = 112;

  // ---------- Título + metadados ----------
  doc.fillColor(COR.preto).font('Helvetica-Bold').fontSize(17)
    .text('Relatório Comparativo de Regime Tributário', M, y);
  y += 24;
  doc.font('Helvetica').fontSize(10).fillColor(COR.cinza);
  doc.text(`CNPJ: ${formataCnpj(ent.cnpj)}`, M, y);
  doc.text(`Emitido em: ${dataHoraBR()}`, M, y, { width: L, align: 'right' });
  y += 22;

  // ---------- Banner de recomendação ----------
  const bannerH = 70;
  doc.roundedRect(M, y, L, bannerH, 8).fillAndStroke('#FFFFFF', corRec).lineWidth(1.5);
  doc.roundedRect(M, y, 6, bannerH, 3).fill(corRec); // barra lateral
  doc.fillColor(COR.cinza).font('Helvetica').fontSize(8)
    .text(`RECOMENDAÇÃO${r.forca === 'forte' ? '' : ' (margem estreita)'}`, M + 18, y + 10);
  doc.fillColor(corRec).font('Helvetica-Bold').fontSize(18).text(vencedorNome, M + 18, y + 21);
  doc.fillColor(COR.cinza).font('Helvetica').fontSize(9).text(r.justificativa || '', M + 18, y + 45, { width: L - 36 });
  y += bannerH + 16;

  // ---------- Perfil informado ----------
  doc.fillColor(COR.preto).font('Helvetica-Bold').fontSize(12).text('Perfil informado', M, y);
  y += 16;
  const perfil = [
    ['Faturamento anual', brl.format(ent.faturamentoAnual)],
    ['Vendas para PJ (aproveita crédito)', pct(ent.pctPJ)],
    ['Vendas para consumidor final / PF', pct(ent.pctConsumidorFinal)],
    ['Peso de insumos creditáveis', pct(ent.pesoInsumos)],
    ['Setor', SETOR_LABEL[ent.setor] || ent.setor || '—'],
  ];
  doc.font('Helvetica').fontSize(10);
  perfil.forEach(([k, v]) => {
    doc.fillColor(COR.cinza).text(k, M + 6, y, { width: L * 0.6, continued: false });
    doc.fillColor(COR.preto).font('Helvetica-Bold').text(v, M + L * 0.6, y, { width: L * 0.4 - 6, align: 'right' });
    doc.font('Helvetica');
    y += 15;
  });
  y += 10;

  // ---------- Cards comparativos ----------
  const cardW = (L - 16) / 2;
  const cardH = 152;
  const cardY = y;
  desenhaCard(doc, M, cardY, cardW, cardH, {
    titulo: 'Simples Puro',
    destaque: !vencedorHibrido,
    cor: corRec,
    valor: brl.format(puro.ibsCbsAnualEstimado),
    valorLabel: puro.rotuloValor || 'IBS/CBS por ano (estimativa)',
    linhas: [['Crédito gerado ao seu cliente', brl.format(puro.creditoGeradoAoCliente || 0)]],
    nota: puro.observacao,
  });
  desenhaCard(doc, M + cardW + 16, cardY, cardW, cardH, {
    titulo: 'Simples Híbrido',
    destaque: vencedorHibrido,
    cor: corRec,
    valor: brl.format(hib.ibsCbsLiquidoAnualEstimado),
    valorLabel: hib.rotuloValor || 'IBS/CBS líquido por ano (estimativa)',
    linhas: [
      ['Crédito gerado ao cliente empresa', brl.format(hib.creditoGeradoAoClientePJ || 0)],
      ['Você recupera das suas compras', brl.format(hib.creditoInsumosAnualEstimado || 0)],
    ],
    nota: hib.observacao,
  });
  y = cardY + cardH + 16;

  // ---------- Como interpretar (linguagem simples) ----------
  const bullets = r.comoInterpretar || [];
  if (bullets.length) {
    const innerW = L - 28;
    doc.font('Helvetica').fontSize(8.5);
    let txtH = 0;
    bullets.forEach((b) => { txtH += doc.heightOfString(`•  ${b}`, { width: innerW }) + 4; });
    const boxH = txtH + 28;
    y = garantirEspaco(doc, y, boxH + 10);
    doc.lineWidth(1).roundedRect(M, y, L, boxH, 8).fillAndStroke('#FFFFFF', COR.cinzaClaro);
    doc.fillColor(COR.preto).font('Helvetica-Bold').fontSize(10.5)
      .text('Como interpretar este relatório', M + 14, y + 10);
    let by = y + 29;
    doc.font('Helvetica').fontSize(8.5).fillColor(COR.cinza);
    bullets.forEach((b) => {
      doc.text(`•  ${b}`, M + 14, by, { width: innerW });
      by = doc.y + 4;
    });
    y += boxH + 12;
  }

  // ---------- Premissas (nota técnica) ----------
  const sn = prem.simples || {};
  const pPremissas =
    `Regime regular: alíquota ${(Number(prem.aliquotaRegimeRegular || 0) * 100).toFixed(1)}% ` +
    `(fonte: ${prem.fonteAliquota || '—'}). ` +
    (sn.anexo
      ? `Simples: Anexo ${sn.anexo}, ${sn.faixa}ª faixa, alíquota efetiva ` +
        `${(Number(sn.aliquotaEfetiva || 0) * 100).toFixed(2)}% ` +
        `(IBS/CBS = ${(Number(sn.shareIbsCbsNoDAS || 0) * 100).toFixed(1)}% do DAS` +
        `${sn.fatorR != null ? `; Fator R ${(Number(sn.fatorR) * 100).toFixed(1)}%` : ''}). `
      : '') +
    (prem.observacao || '');
  doc.font('Helvetica').fontSize(8.5);
  const premissasH = doc.heightOfString(pPremissas, { width: L - 24 }) + 20;
  y = garantirEspaco(doc, y, premissasH + 8);
  doc.roundedRect(M, y, L, premissasH, 6).fill(COR.fundoSuave);
  doc.fillColor(COR.cinza).font('Helvetica').fontSize(8.5)
    .text(pPremissas, M + 12, y + 10, { width: L - 24 });
  y += premissasH + 12;

  // ---------- CTA (lead) ----------
  const ctaH = 56;
  y = garantirEspaco(doc, y, ctaH + 10);
  doc.roundedRect(M, y, L, ctaH, 8).fill(COR.preto);
  doc.fillColor(COR.verdeClaro).font('Helvetica-Bold').fontSize(12)
    .text('Quer que a iContábil IA formalize essa opção para você?', M + 16, y + 12, { width: L - 32 });
  doc.fillColor('#C9C9D2').font('Helvetica').fontSize(9.5)
    .text('Fale com nosso time — cuidamos da opção pelo regime e de toda a rotina contábil.', M + 16, y + 32, { width: L - 32 });

  // ---------- Rodapé / disclaimer (rodapé da página atual) ----------
  const footY = doc.page.height - 70;
  doc.moveTo(M, footY).lineTo(M + L, footY).strokeColor(COR.cinzaClaro).lineWidth(1).stroke();
  doc.fillColor(COR.cinza).font('Helvetica').fontSize(7.5)
    .text(
      (r.disclaimer ||
        'Simulação/orientação preliminar; alíquotas da Reforma ainda provisórias. Não substitui análise individualizada.') +
        ' · iContábil IA · Responsável técnico: Carlos A. Silva — CRC BA 024.174/O-3.',
      M, footY + 8, { width: L, align: 'center' },
    );

  doc.end();
  return pronto;
}

// Desenha um card de cenário comparativo (conteúdo flui de cima para baixo).
function desenhaCard(doc, x, yTop, w, h, opts) {
  const borda = opts.destaque ? opts.cor : COR.cinzaClaro;
  const innerW = w - 28;
  doc.lineWidth(opts.destaque ? 2 : 1).roundedRect(x, yTop, w, h, 8).fillAndStroke('#FFFFFF', borda);

  let y = yTop + 13;
  doc.fillColor(COR.preto).font('Helvetica-Bold').fontSize(12).text(opts.titulo, x + 14, y);
  if (opts.destaque) {
    doc.fillColor(opts.cor).font('Helvetica-Bold').fontSize(8)
      .text('• RECOMENDADO', x + 14, y, { width: innerW, align: 'right' });
  }
  y += 20;
  doc.fillColor(COR.preto).font('Helvetica-Bold').fontSize(18).text(opts.valor, x + 14, y);
  y = doc.y + 2;
  doc.fillColor(COR.cinza).font('Helvetica').fontSize(7.5).text(opts.valorLabel, x + 14, y, { width: innerW });
  y = doc.y + 7;
  opts.linhas.forEach(([k, v]) => {
    doc.fillColor(COR.cinza).font('Helvetica').fontSize(8.5).text(`${k}: `, x + 14, y, { width: innerW, continued: true });
    doc.fillColor(COR.verde).font('Helvetica-Bold').text(v);
    y = doc.y + 3;
  });
  y += 3;
  doc.fillColor(COR.cinza).font('Helvetica').fontSize(7.5).text(opts.nota || '', x + 14, y, { width: innerW });
}

// Quebra para nova página se não couber 'needed' pt; retorna o novo y.
function garantirEspaco(doc, y, needed) {
  if (y + needed > doc.page.height - 80) {
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 6).fill(COR.verde);
    doc.rect(doc.page.width / 2, 0, doc.page.width / 2, 6).fill(COR.roxo);
    return 50;
  }
  return y;
}
