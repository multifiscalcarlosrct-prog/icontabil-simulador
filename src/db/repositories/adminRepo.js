// Consultas agregadas para o painel de admin (lê o próprio banco do simulador).
// Usa json_extract (JSON1, embutido no better-sqlite3) p/ ler recomendacao/setor/faturamento
// de dentro do payload_resultado das consultas.
import { db } from '../index.js';

const REC = "json_extract(payload_resultado, '$.recomendacao')";
const SETOR = "json_extract(payload_resultado, '$.entrada.setor')";
const FAT = "json_extract(payload_resultado, '$.entrada.faturamentoAnual')";

export function estatisticas() {
  const um = (sql) => db.prepare(sql).get();
  return {
    contasVerificadas: um("SELECT COUNT(*) n FROM usuarios WHERE verificado = 1").n,
    contasPagas: um("SELECT COUNT(*) n FROM usuarios WHERE plano = 'pago'").n,
    simulacoes: um('SELECT COUNT(*) n FROM consultas').n,
    cnpjsUnicos: um('SELECT COUNT(DISTINCT cnpj) n FROM consultas').n,
    conversoes: um("SELECT COUNT(*) n FROM pagamentos WHERE status = 'pago'").n,
    receitaCentavos: um("SELECT COALESCE(SUM(valor_centavos),0) n FROM pagamentos WHERE status = 'pago'").n,
    porRecomendacao: db.prepare(`SELECT ${REC} chave, COUNT(*) n FROM consultas GROUP BY chave`).all(),
    porSetor: db.prepare(`SELECT ${SETOR} chave, COUNT(*) n FROM consultas GROUP BY chave ORDER BY n DESC`).all(),
  };
}

// Últimas simulações (uma linha por consulta = par conta+CNPJ).
export function ultimasSimulacoes(limite = 50) {
  return db
    .prepare(
      `SELECT c.id, c.cnpj, c.criado_em, ${REC} recomendacao, ${SETOR} setor, ${FAT} faturamento,
              u.contato, u.plano
         FROM consultas c JOIN usuarios u ON u.id = c.usuario_id
        ORDER BY c.id DESC LIMIT ?`
    )
    .all(limite);
}
