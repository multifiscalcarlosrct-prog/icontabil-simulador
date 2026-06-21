// Busca dados cadastrais por CNPJ (preview livre) + cache simples.
// Seção 3: o CNPJ só entrega cadastro — razão social, CNAE, porte, optante Simples, UF/município.
import { env } from '../config/env.js';

// Cache em memória (MVP). Em escala, mover para tabela/Redis.
const cache = new Map();

export async function buscarCadastral(cnpj) {
  if (cache.has(cnpj)) return cache.get(cnpj);

  let dados;
  try {
    // User-Agent é obrigatório: a BrasilAPI responde 403 Forbidden sem ele.
    const resp = await fetch(`${env.apiCnpjBase}/${cnpj}`, {
      headers: {
        'User-Agent': 'iContabil-Simulador/1.0 (+https://icontabil.com.br)',
        Accept: 'application/json',
      },
    });
    if (!resp.ok) throw new Error(`API CNPJ retornou ${resp.status}`);
    const raw = await resp.json();
    dados = normalizar(raw);
  } catch {
    // Fallback: não trava o fluxo se a API externa estiver indisponível (ex.: sem internet).
    // razaoSocial fica null para o front mostrar um aviso amigável em vez de texto poluído.
    dados = {
      cnpj,
      razaoSocial: null,
      cnae: null,
      porte: null,
      optanteSimples: null,
      naoOptante: false, // indisponível → não bloqueia (deixa seguir)
      uf: null,
      municipio: null,
      indisponivel: true,
      _fonte: 'fallback',
    };
  }

  cache.set(cnpj, dados);
  return dados;
}

// "Não é optante do Simples?" — sinal robusto para a Opção A (bloqueio da comparação).
// A BrasilAPI às vezes devolve opcao_pelo_simples = null mesmo para empresas que NÃO são do
// Simples; nesses casos o PORTE resolve: "DEMAIS" não é ME nem EPP, logo não pode ser Simples.
export function ehNaoOptanteSimples(optanteSimples, porte) {
  if (optanteSimples === true) return false; // é optante → comparação se aplica
  if (optanteSimples === false) return true; // explicitamente fora do Simples
  return String(porte || '').toUpperCase() === 'DEMAIS'; // null + porte não-ME/EPP → não-Simples
}

// Mapeia o payload da BrasilAPI para o nosso formato enxuto.
function normalizar(raw) {
  const optanteSimples = raw.opcao_pelo_simples ?? null;
  const porte = raw.porte ?? null;
  return {
    cnpj: raw.cnpj,
    razaoSocial: raw.razao_social ?? null,
    cnae: raw.cnae_fiscal ?? null,
    cnaeDescricao: raw.cnae_fiscal_descricao ?? null,
    porte,
    optanteSimples,
    naoOptante: ehNaoOptanteSimples(optanteSimples, porte),
    uf: raw.uf ?? null,
    municipio: raw.municipio ?? null,
    situacao: raw.descricao_situacao_cadastral ?? null,
    _fonte: 'brasilapi',
  };
}
