// Front MVP — wizard de 4 passos do fluxo da seção 6:
//   1) CNPJ → preview (livre)  2) 5 perguntas  3) OTP  4) resultado + PDF.
// Vanilla JS, sem framework. O token de sessão (pós-OTP) fica no localStorage;
// a CONTAGEM de cota é sempre no servidor (seção 6) — aqui só guardamos a sessão.
import { parseReais } from './valor.js';

const $ = (s) => document.querySelector(s);
const TOKEN_KEY = 'icontabil_token';

const estado = {
  cnpj: null,
  cadastro: null,
  respostas: null, // { faturamento, pctPJ, pesoInsumos, setor }
  contato: null,
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);

// --- Navegação entre passos ---
const PASSOS = ['cnpj', 'perguntas', 'otp', 'resultado'];
function irPara(passo) {
  PASSOS.forEach((p) => {
    $(`#passo-${p}`).hidden = p !== passo;
    $(`#stepper li[data-step="${p}"]`)?.classList.toggle('ativo', p === passo);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Helper de fetch JSON com tratamento de erro ---
async function api(url, opts = {}) {
  const resp = await fetch(url, opts);
  const dados = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, dados };
}
function authHeaders(extra = {}) {
  return { ...extra, Authorization: `Bearer ${getToken()}` };
}

// ======================= PASSO 1 — CNPJ =======================
$('#btn-preview').addEventListener('click', async () => {
  const cnpj = ($('#cnpj').value || '').replace(/\D/g, '');
  const erro = $('#cnpj-erro');
  erro.hidden = true;
  if (cnpj.length !== 14) {
    erro.textContent = 'Digite os 14 dígitos do CNPJ.';
    erro.hidden = false;
    return;
  }
  $('#btn-preview').disabled = true;
  $('#btn-preview').textContent = 'Consultando…';
  const { ok, dados } = await api(`/api/cnpj/${cnpj}`);
  $('#btn-preview').disabled = false;
  $('#btn-preview').textContent = 'Consultar';

  if (!ok) {
    erro.textContent = dados.erro || 'Não foi possível consultar o CNPJ.';
    erro.hidden = false;
    return;
  }
  estado.cnpj = cnpj;
  estado.cadastro = dados;
  renderPreview(dados);
});

function renderPreview(d) {
  const box = $('#preview');
  if (d.indisponivel || d._fonte === 'fallback') {
    // Consulta cadastral indisponível (ex.: servidor sem internet). Não bloqueia o fluxo.
    box.innerHTML =
      '<h3>Cadastro indisponível no momento</h3>' +
      '<p class="obs">Não foi possível consultar os dados deste CNPJ agora (a consulta cadastral ' +
      'depende de conexão). Você pode continuar normalmente — isso não afeta a simulação.</p>';
    box.hidden = false;
    $('#btn-ir-perguntas').hidden = false;
    return;
  }
  const linhas = [
    ['Razão social', d.razaoSocial],
    ['CNAE', d.cnaeDescricao || d.cnae],
    ['Porte', d.porte],
    ['Optante Simples', d.optanteSimples === true ? 'Sim' : d.optanteSimples === false ? 'Não' : '—'],
    ['UF / Município', [d.uf, d.municipio].filter(Boolean).join(' / ')],
  ];
  box.innerHTML =
    `<h3>${d.razaoSocial || 'Empresa'}</h3>` +
    '<dl>' +
    linhas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v || '—'}</dd></div>`).join('') +
    '</dl>';
  box.hidden = false;
  $('#btn-ir-perguntas').hidden = false;
}

$('#btn-ir-perguntas').addEventListener('click', () => irPara('perguntas'));

// ======================= PASSO 2 — Perguntas =======================
// (parseReais vem de ./valor.js — compartilhado com os testes.)

// Percentual digitado (0–100). Vazio/ inválido → null.
function lePct(id) {
  const v = $(`#${id}`).value;
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

// Atualiza o "consumidor final / PF" derivado a partir do % PJ.
function atualizaCF() {
  const pj = lePct('pctPJ');
  $('#pctCF-out').textContent = pj == null ? '—' : `${Math.round(100 - pj)}%`;
}
$('#pctPJ').addEventListener('input', atualizaCF);

// Formata o faturamento ao sair do campo (ex.: 380000 → 380.000) e recalcula o Fator R.
$('#faturamento').addEventListener('blur', () => {
  const v = parseReais($('#faturamento').value);
  $('#faturamento').value = v ? v.toLocaleString('pt-BR') : '';
  atualizaFatorR();
});

// Fator R só vale para serviço (define Anexo III ≥28% vs V <28%). Mostra/esconde o bloco.
const ehServico = () => $('#setor').value === 'servico';
function toggleFatorR() {
  $('#bloco-fatorr').hidden = !ehServico();
  atualizaFatorR();
}
function atualizaFatorR() {
  if (!ehServico()) return;
  const fat = parseReais($('#faturamento').value);
  const folha = parseReais($('#folha').value);
  const out = $('#fatorr-out');
  const anexoEl = $('#fatorr-anexo');
  if (!fat || !folha) {
    out.textContent = '—';
    anexoEl.textContent = '';
    return;
  }
  const fr = folha / fat;
  out.textContent = `${(fr * 100).toFixed(1)}%`;
  anexoEl.textContent = fr >= 0.28 ? '→ Anexo III' : '→ Anexo V';
}
$('#setor').addEventListener('change', toggleFatorR);
$('#folha').addEventListener('input', atualizaFatorR);
toggleFatorR(); // estado inicial

$('[data-voltar="cnpj"]').addEventListener('click', () => irPara('cnpj'));

$('#btn-gerar').addEventListener('click', () => {
  const faturamento = parseReais($('#faturamento').value);
  const pctPJ = lePct('pctPJ');
  const pesoInsumos = lePct('pesoInsumos');
  const setor = $('#setor').value;

  if (!faturamento) return alert('Informe o faturamento anual.');
  if (pctPJ == null) return alert('Informe o % de vendas para empresas (PJ).');
  if (pesoInsumos == null) return alert('Informe o peso de insumos creditáveis.');

  // Folha só é enviada para serviço (base do Fator R).
  const folhaPagamento = setor === 'servico' ? parseReais($('#folha').value) : 0;
  estado.respostas = { faturamento, pctPJ, pesoInsumos, setor, folhaPagamento };
  // Já verificado? pula direto para a simulação. Senão, OTP.
  if (getToken()) {
    rodarSimulacao();
  } else {
    irPara('otp');
  }
});

// ======================= PASSO 3 — OTP =======================
$('#btn-enviar-otp').addEventListener('click', async () => {
  const contato = ($('#contato').value || '').trim();
  const erro = $('#otp-erro');
  erro.hidden = true;
  if (!contato.includes('@')) {
    erro.textContent = 'Digite um e-mail válido.';
    erro.hidden = false;
    return;
  }
  estado.contato = contato;
  $('#btn-enviar-otp').disabled = true;
  const { ok, dados } = await api('/api/auth/solicitar-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contato }),
  });
  $('#btn-enviar-otp').disabled = false;
  if (!ok) {
    erro.textContent = dados.erro || 'Falha ao enviar o código.';
    erro.hidden = false;
    return;
  }
  $('#otp-pedir').hidden = true;
  $('#otp-confirmar').hidden = false;
  // Dica para ambiente de desenvolvimento (código sai no console do servidor).
  const dev = $('#otp-dev');
  dev.textContent = 'Em desenvolvimento, o código aparece no console do servidor.';
  dev.hidden = false;
});

$('#btn-reenviar').addEventListener('click', () => {
  $('#otp-confirmar').hidden = true;
  $('#otp-pedir').hidden = false;
});

$('#btn-verificar-otp').addEventListener('click', async () => {
  const codigo = ($('#codigo').value || '').trim();
  const erro = $('#otp-erro');
  erro.hidden = true;
  $('#btn-verificar-otp').disabled = true;
  const { ok, dados } = await api('/api/auth/verificar-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contato: estado.contato, codigo }),
  });
  $('#btn-verificar-otp').disabled = false;
  if (!ok || !dados.token) {
    erro.textContent = dados.erro || 'Código inválido ou expirado.';
    erro.hidden = false;
    return;
  }
  setToken(dados.token);
  rodarSimulacao();
});

// ======================= PASSO 4 — Simulação / Resultado =======================
async function rodarSimulacao() {
  irPara('resultado');
  const box = $('#resultado-conteudo');
  box.innerHTML = '<p class="lead">Gerando seu relatório…</p>';

  const { ok, status, dados } = await api('/api/simulacao', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ cnpj: estado.cnpj, ...estado.respostas }),
  });

  if (status === 401 || status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    irPara('otp');
    return;
  }
  if (status === 402) {
    renderPaywall(dados);
    return;
  }
  if (!ok) {
    box.innerHTML = `<p class="erro">${dados.erro || 'Erro ao gerar o relatório.'}</p>`;
    return;
  }
  renderResultado(dados);
}

function renderResultado({ id, resultado, creditosRestantes, reaproveitado }) {
  const r = resultado;
  const vencedor = r.recomendacao === 'hibrido' ? 'Simples Híbrido' : 'Simples Puro';
  const hib = r.cenarios.simplesHibrido;
  const puro = r.cenarios.simplesPuro;
  const sn = r.premissas.simples || {};
  const simplesTxt = sn.anexo
    ? ` Simples: Anexo ${sn.anexo}, ${sn.faixa}ª faixa, efetiva ${(sn.aliquotaEfetiva * 100).toFixed(2)}%` +
      `${sn.fatorR != null ? ` (Fator R ${(sn.fatorR * 100).toFixed(1)}%)` : ''}.`
    : '';

  $('#resultado-conteudo').innerHTML = `
    <div class="banner-rec ${r.forca}">
      <span class="rec-tag">Recomendação ${r.forca === 'forte' ? '' : '(margem estreita)'}</span>
      <strong>${vencedor}</strong>
      <p>${r.justificativa}</p>
    </div>

    <div class="grade-cenarios">
      <div class="card-cenario ${r.recomendacao === 'puro' ? 'destaque' : ''}">
        <h3>Simples Puro</h3>
        <p class="num">${brl.format(puro.ibsCbsAnualEstimado)}<small>${puro.rotuloValor}</small></p>
        <p class="obs">Crédito gerado ao seu cliente: <b>${brl.format(puro.creditoGeradoAoCliente)}</b></p>
        <p class="obs">${puro.observacao}</p>
      </div>
      <div class="card-cenario ${r.recomendacao === 'hibrido' ? 'destaque' : ''}">
        <h3>Simples Híbrido</h3>
        <p class="num">${brl.format(hib.ibsCbsLiquidoAnualEstimado)}<small>${hib.rotuloValor}</small></p>
        <p class="obs">Crédito que seus clientes empresa ganham por ano: <b>${brl.format(hib.creditoGeradoAoClientePJ)}</b></p>
        <p class="obs">O que você recupera dos impostos das suas compras: <b>${brl.format(hib.creditoInsumosAnualEstimado)}</b> por ano</p>
        <p class="obs">${hib.observacao}</p>
      </div>
    </div>

    <div class="como-ler">
      <h4>Como interpretar este resultado</h4>
      <ul>${(r.comoInterpretar || []).map((t) => `<li>${t}</li>`).join('')}</ul>
    </div>

    <p class="premissas">Alíquota do regime regular usada: ${(r.premissas.aliquotaRegimeRegular * 100).toFixed(1)}%
      (fonte: ${r.premissas.fonteAliquota}).${simplesTxt}
      ${reaproveitado ? 'CNPJ já consultado — recalculado sem consumir novo crédito.' : ''}
      Créditos restantes: <b>${creditosRestantes}</b>.</p>

    <div class="acoes">
      <button class="btn primario" id="btn-pdf" data-id="${id}">Baixar relatório (PDF)</button>
      <button class="btn" id="btn-nova">Nova simulação</button>
    </div>

    <div class="cta-lead">
      <b>Quer que a iContábil IA formalize essa opção para você?</b>
      <p>Fale com nosso time — cuidamos da opção pelo regime e de toda a rotina contábil.</p>
    </div>

    <p class="disclaimer">${r.disclaimer}</p>
  `;

  $('#btn-pdf').addEventListener('click', baixarPdf);
  $('#btn-nova').addEventListener('click', reiniciar);
}

function renderPaywall(dados) {
  $('#resultado-conteudo').innerHTML = `
    <div class="banner-rec paywall">
      <strong>Você usou seus 3 relatórios gratuitos 🎉</strong>
      <p>${dados.erro || ''} Para simulações ilimitadas, fale com a iContábil IA.</p>
    </div>
    <div class="cta-lead">
      <b>Plano ilimitado</b>
      <p>Libere relatórios sem limite e o acompanhamento da sua opção pelo regime.</p>
    </div>
    <button class="btn" id="btn-nova">Voltar</button>`;
  $('#btn-nova').addEventListener('click', reiniciar);
}

async function baixarPdf() {
  const id = $('#btn-pdf').dataset.id;
  const resp = await fetch(`/api/simulacao/${id}/pdf`, { headers: authHeaders() });
  if (!resp.ok) {
    alert('Não foi possível gerar o PDF.');
    return;
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-icontabil-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function reiniciar() {
  estado.respostas = null;
  $('#cnpj').value = '';
  $('#preview').hidden = true;
  $('#btn-ir-perguntas').hidden = true;
  irPara('cnpj');
}
