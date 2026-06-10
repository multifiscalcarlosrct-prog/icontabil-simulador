// Carrega e valida as variáveis de ambiente uma única vez.
// Falha cedo (e com mensagem clara) se algo essencial faltar.
import 'dotenv/config';

function obrigatoria(nome, valor) {
  if (!valor) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${nome}. Veja .env.example.`);
  }
  return valor;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: obrigatoria('JWT_SECRET', process.env.JWT_SECRET),

  dbUrl: process.env.DB_URL || './data/icontabil.sqlite',

  apiCnpjBase: process.env.API_CNPJ_BASE || 'https://brasilapi.com.br/api/cnpj/v1',
  calculadoraUrl: process.env.CALCULADORA_URL || '',

  smtpProvider: process.env.SMTP_PROVIDER || '',
  smtpApiKey: process.env.SMTP_API_KEY || '',
  otpFrom: process.env.OTP_FROM || 'contato@icontabil.com.br',
  otpTtlMin: Number(process.env.OTP_TTL_MIN) || 10,

  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',

  freeTierLimite: Number(process.env.FREE_TIER_LIMITE) || 3,
};

export const isDev = env.nodeEnv !== 'production';

// Avisos de produção (não derrubam o boot, mas alertam configuração insegura).
if (!isDev) {
  if (env.jwtSecret === 'troque-este-segredo-em-producao') {
    console.warn('[AVISO] JWT_SECRET está no valor padrão — troque por um segredo forte em produção.');
  }
  if (!env.smtpProvider || !env.smtpApiKey) {
    console.warn('[AVISO] Sem provedor de e-mail (SMTP_PROVIDER/SMTP_API_KEY): o código OTP não será enviado aos usuários.');
  }
}
