// Normaliza e-mail para que a cota grude na PESSOA, não em variações do endereço (seção 6).
// Minúsculas, trim e, no Gmail, remove pontos do local-part e o sufixo +tag.
export function normalizaEmail(input) {
  const email = String(input || '').trim().toLowerCase();
  const at = email.indexOf('@');
  if (at <= 0) return ''; // inválido

  let local = email.slice(0, at);
  const dominio = email.slice(at + 1);

  const ehGmail = dominio === 'gmail.com' || dominio === 'googlemail.com';
  if (ehGmail) {
    local = local.split('+')[0].replace(/\./g, '');
    return `${local}@gmail.com`;
  }

  // Demais provedores: remove só o +tag (comportamento conservador).
  local = local.split('+')[0];
  return `${local}@${dominio}`;
}
