import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montaOperacao, extraiTotais, aliquotaEfetiva } from '../src/services/calculadoraService.js';

test('montaOperacao monta o IOperacaoInput conforme contrato oficial', () => {
  const op = montaOperacao({ uf: 'BA', valor: 10000, setor: 'servico' });
  assert.equal(op.uf, 'BA');
  assert.ok(op.municipio > 0);
  assert.equal(op.itens.length, 1);
  assert.equal(op.itens[0].baseCalculo, 10000);
  assert.equal(op.itens[0].nbs, '101011900'); // serviço usa NBS
  assert.ok(!('ncm' in op.itens[0]));
  assert.match(op.dataHoraEmissao, /T/);

  const opCom = montaOperacao({ uf: 'SP', municipioIBGE: 3550308, valor: 500, setor: 'comercio' });
  assert.equal(opCom.municipio, 3550308);
  assert.equal(opCom.itens[0].ncm, '22021000'); // comércio usa NCM
});

test('extraiTotais lê vIBS + vCBS dos totais oficiais', () => {
  const resposta = {
    total: {
      tribCalc: {
        ISTot: { vIS: 0 },
        IBSCBSTot: {
          vBCIBSCBS: 10000,
          gIBS: { gIBSUF: { vIBSUF: 1100 }, gIBSMun: { vIBSMun: 670 }, vIBS: 1770 },
          gCBS: { vCBS: 880 },
        },
      },
    },
  };
  const t = extraiTotais(resposta, 10000);
  assert.equal(t.ibs, 1770);
  assert.equal(t.cbs, 880);
  assert.equal(t.total, 2650);
  assert.equal(t.base, 10000);
  assert.equal(t._fonte, 'calculadora');
});

test('aliquotaEfetiva é resiliente (fallback sem serviço configurado)', async () => {
  const ef = await aliquotaEfetiva({ uf: 'BA', setor: 'servico' });
  assert.ok(ef.aliquota > 0 && ef.aliquota < 1);
  assert.ok(['mock', 'referencia', 'calculadora'].includes(ef.fonte));
});
