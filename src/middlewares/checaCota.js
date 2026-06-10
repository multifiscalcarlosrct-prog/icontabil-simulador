// Bloqueia/avisa paywall quando os créditos acabaram (seção 6).
// Roda DEPOIS de exigeVerificado (precisa de req.usuario). Não debita CNPJ em cache.
import * as cotaService from '../services/cotaService.js';
import { validaCnpj } from '../utils/validaCnpj.js';

export function checaCota(req, res, next) {
  const cnpj = String(req.body?.cnpj || '').replace(/\D/g, '');
  if (!validaCnpj(cnpj)) return res.status(400).json({ erro: 'CNPJ inválido.' });

  if (!cotaService.temCreditoParaCnpj(req.usuario.id, cnpj)) {
    return res.status(402).json({
      erro: 'Você usou seus 3 relatórios gratuitos.',
      paywall: true,
      creditosRestantes: 0,
    });
  }
  next();
}
