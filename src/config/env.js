// Carrega e valida as variáveis de ambiente uma única vez.
// Falha cedo (e com mensagem clara) se algo essencial faltar.
import 'dotenv/config';

function obrigatoria(nome, valor) {
  if (!valor) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${nome}. Veja .env.example.`);
  }
  return valor;
}

// Inteiro de env que ACEITA 0 (ao contrário de `Number(x) || default`, onde 0 cairia no default).
function inteiroEnv(valor, padrao) {
  if (valor === undefined || valor === '') return padrao;
  const n = Number(valor);
  return Number.isFinite(n) ? n : padrao;
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

  freeTierLimite: inteiroEnv(process.env.FREE_TIER_LIMITE, 3), // aceita 0 (forçar pagamento)

  // --- Pagamento (plano ilimitado, Pix) ---
  pixProvider: process.env.PIX_PROVIDER || (process.env.NODE_ENV === 'production' ? '' : 'mock'),
  planoPrecoCentavos: Number(process.env.PLANO_PRECO_CENTAVOS) || 999, // R$ 9,99
  appBaseUrl: (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  mpAccessToken: process.env.MP_ACCESS_TOKEN || '',
  mockPixDelayMs: Number(process.env.MOCK_PIX_DELAY_MS) || 5000, // mock auto-confirma após isso
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
  if (!env.pixProvider) {
    console.warn('[AVISO] PIX_PROVIDER não definido: o pagamento do plano ilimitado ficará indisponível.');
  } else if (env.pixProvider === 'mock') {
    console.warn('[AVISO] PIX_PROVIDER=mock em produção: cobranças são FICTÍCIAS e auto-confirmam. Use mercadopago.');
  } else if (env.pixProvider === 'mercadopago' && !env.mpAccessToken) {
    console.warn('[AVISO] PIX_PROVIDER=mercadopago sem MP_ACCESS_TOKEN: as cobranças vão falhar.');
  }
}
