# Deploy — iContábil Simulador (VPS Hostinger)

Guia para colocar o app no ar. O backend Node serve a API **e** o front (`/public`),
então é um único processo. A mesma VPS pode hospedar o N8N e a Calculadora oficial.

## 0. Pré-requisitos
- VPS Ubuntu (Hostinger) com acesso SSH.
- Um domínio/subdomínio apontando para o IP da VPS (ex.: `simulador.icontabil.com.br`).
- Node 20+ instalado na VPS (`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`).

## 1. Subir o código
```bash
# na VPS
git clone <repo> /opt/icontabil-simulador   # ou enviar via scp/SFTP
cd /opt/icontabil-simulador
npm ci --omit=dev
```

## 2. Configurar o `.env` (produção)
```bash
cp .env.example .env
nano .env
```
Preencher com atenção:
- `NODE_ENV=production`
- `JWT_SECRET=` → **segredo forte** (`openssl rand -hex 32`). Não deixar o padrão.
- `DB_URL=./data/icontabil.sqlite` (SQLite serve o MVP; migrar p/ Postgres ao escalar)
- `API_CNPJ_BASE=https://brasilapi.com.br/api/cnpj/v1`
- `SMTP_PROVIDER=brevo` (ou `resend`) e `SMTP_API_KEY=` → **obrigatório**, senão o usuário
  não recebe o código OTP. `OTP_FROM=` com um remetente/domínio verificado no provedor.
- `CALCULADORA_URL=http://localhost:8080/api` quando a Calculadora oficial estiver rodando
  (ver `calculadora/README.md`). Vazio = alíquota de referência (estimativa).
- `N8N_WEBHOOK_URL=` → URL de produção do Webhook do N8N (lead-gen, seção 8).
- `FREE_TIER_LIMITE=3`

## 3. Criar o banco
```bash
npm run db:init
```

## 4. Rodar como serviço (PM2)
```bash
sudo npm i -g pm2
pm2 start src/server.js --name icontabil
pm2 save && pm2 startup     # reinicia sozinho no boot
```
O app sobe na porta do `.env` (padrão 3000), em `127.0.0.1`.

## 5. Nginx + HTTPS (reverse proxy)
```nginx
# /etc/nginx/sites-available/icontabil
server {
  server_name simulador.icontabil.com.br;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/icontabil /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d simulador.icontabil.com.br   # emite o SSL
```
(O app já usa `trust proxy`, então funciona corretamente atrás do nginx.)

## 6. Validar
- Acesse `https://simulador.icontabil.com.br` → faça uma simulação ponta a ponta.
- Confirme que o **código OTP chega no e-mail** (provedor configurado).
- Veja o lead cair no **N8N** (Executions) e o relatório em PDF.

## 7. Atualizações futuras
```bash
cd /opt/icontabil-simulador && git pull
npm ci --omit=dev && npm test && pm2 restart icontabil
```

## Serviços auxiliares na mesma VPS
- **N8N**: template "Ubuntu 24.04 with n8n" da Hostinger (ver LEIAME do projeto CM/N8N).
- **Calculadora oficial IBS/CBS**: `java -jar api-regime-geral.jar --spring.profiles.active=offline`
  em `:8080` (ver `calculadora/README.md`); apontar `CALCULADORA_URL` para ela.
