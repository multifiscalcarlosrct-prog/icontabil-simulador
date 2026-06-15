// Contagem de créditos do free tier — 100% no servidor (seção 6).
// Crédito disponível = FREE_TIER_LIMITE − (nº de CNPJs DISTINTOS simulados por conta verificada).
// Plano 'pago' (R$ 9,99, pagamento único) = relatórios ILIMITADOS.
import { env } from '../config/env.js';
import * as consultaRepo from '../db/repositories/consultaRepo.js';
import * as usuarioRepo from '../db/repositories/usuarioRepo.js';

// Conta com plano pago tem acesso ilimitado.
export function planoIlimitado(usuarioId) {
  return usuarioRepo.acharPorId(usuarioId)?.plano === 'pago';
}

export function cnpjsDistintosUsados(usuarioId) {
  return consultaRepo.contarCnpjsDistintos(usuarioId);
}

// Retorna null quando ilimitado (o front mostra "ilimitado" em vez de um número).
export function creditosRestantes(usuarioId) {
  if (planoIlimitado(usuarioId)) return null;
  return Math.max(0, env.freeTierLimite - cnpjsDistintosUsados(usuarioId));
}

// Cobra crédito apenas se for um CNPJ novo para a conta (cache não debita).
export function temCreditoParaCnpj(usuarioId, cnpj) {
  if (planoIlimitado(usuarioId)) return true; // pago = sem limite
  if (consultaRepo.acharPorUsuarioECnpj(usuarioId, cnpj)) return true; // já consultado antes
  return creditosRestantes(usuarioId) > 0;
}
