// Utilitários de valor monetário — compartilhados entre o front e os testes (sem DOM).

// Converte texto em formato brasileiro para número.
// '.' é separador de milhar; ',' é decimal. Evita o bug de "centavos viram zeros a mais"
// (ex.: "380.000,00" → 380000, e não 38000000).
export function parseReais(str) {
  let s = String(str || '').replace(/[^\d.,]/g, '').trim();
  if (!s) return 0;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.'); // milhar fora, vírgula vira ponto decimal
  } else {
    s = s.replace(/\./g, ''); // só pontos = separador de milhar
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
