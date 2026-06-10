// Controller de CNPJ: valida o formato e devolve o preview cadastral (sem cota).
import { validaCnpj } from '../utils/validaCnpj.js';
import * as cnpjService from '../services/cnpjService.js';

export async function preview(req, res, next) {
  try {
    const cnpj = String(req.params.cnpj || '').replace(/\D/g, '');
    if (!validaCnpj(cnpj)) {
      return res.status(400).json({ erro: 'CNPJ inválido.' });
    }
    const dados = await cnpjService.buscarCadastral(cnpj);
    res.json(dados);
  } catch (err) {
    next(err);
  }
}
