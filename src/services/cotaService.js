// Contagem de créditos do free tier — 100% no servidor (seção 6).
// Crédito disponível = FREE_TIER_LIMITE − (nº de CNPJs DISTINTOS simulados por conta verificada).
import { env } from '../config/env.js';
import * as consultaRepo from '../db/repositories/consultaRepo.js';

export function cnpjsDistintosUsados(usuarioId) {
  return consultaRepo.contarCnpjsDistintos(usuarioId);
}

export function creditosRestantes(usuarioId) {
  return Math.max(0, env.freeTierLimite - cnpjsDistintosUsados(usuarioId));
}

// Cobra crédito apenas se for um CNPJ novo para a conta (cache não debita).
export function temCreditoParaCnpj(usuarioId, cnpj) {
  if (consultaRepo.acharPorUsuarioECnpj(usuarioId, cnpj)) return true; // já pago antes
  return creditosRestantes(usuarioId) > 0;
}
