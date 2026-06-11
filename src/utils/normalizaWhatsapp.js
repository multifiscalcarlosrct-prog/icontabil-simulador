// Normaliza um WhatsApp brasileiro para o formato internacional 55 + DDD + número
// (padrão exigido pelas APIs de envio, ex.: Evolution). Retorna '' se inválido.
export function normalizaWhatsapp(input) {
  const d = String(input || '').replace(/\D/g, '');
  if (!d) return '';
  // Já veio com o 55 na frente (12–13 dígitos: 55 + DDD + 8/9 dígitos).
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d;
  // DDD + número (10 dígitos fixo, 11 celular) → prefixa o país.
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return '';
}
