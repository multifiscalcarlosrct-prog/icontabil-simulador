// Controller de pagamento — v2 (placeholder). Fora do escopo do MVP (seção 10).
export async function criar(_req, res) {
  res.status(501).json({ erro: 'Pagamento disponível na v2.' });
}

export async function webhook(_req, res) {
  // v2: validar assinatura do gateway e setar usuario.plano = 'pago'. Nunca confiar no front.
  res.status(501).json({ erro: 'Pagamento disponível na v2.' });
}
