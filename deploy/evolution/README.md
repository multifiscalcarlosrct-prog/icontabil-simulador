# Evolution API — WhatsApp para a nutrição de leads

API não-oficial do WhatsApp (via QR Code) que o n8n usa para enviar as mensagens.
Roda na VPS ao lado do n8n e do Traefik (HTTPS automático). Subdomínio: `evo.icontabil.shop`.

## 1. DNS (Hostinger → icontabil.shop → Zona DNS)
Adicione um registro **A**: nome `evo` → valor `2.25.147.132` (IP da VPS).

## 2. Levar os arquivos pra VPS
```bash
cd /docker/simulador && git pull
cp -r /docker/simulador/deploy/evolution /docker/evolution
cd /docker/evolution
```

## 3. Criar o .env com segredos fortes
```bash
printf 'EVO_API_KEY=%s\nEVO_DB_PASS=%s\n' "$(openssl rand -hex 24)" "$(openssl rand -hex 16)" > .env
cat .env   # anote a EVO_API_KEY — você vai usar no manager e no n8n
```

## 4. Subir
```bash
docker compose up -d
docker compose logs -f evolution   # acompanhar; Ctrl+C para sair
```

## 5. Conectar o WhatsApp (precisa do número/chip dedicado em mãos)
1. Aguarde o Traefik emitir o SSL (~1 min) e acesse: **https://evo.icontabil.shop/manager**
2. Faça login com a **EVO_API_KEY** (do .env).
3. **Create instance** → dê um nome (ex.: `icontabil`).
4. Aparece um **QR Code** → abra o WhatsApp do **número dedicado** → Aparelhos conectados → Conectar → escaneie.
5. Status deve virar **connected/open**. ✅

## 6. Dados para o n8n
No workflow de nutrição, configure as variáveis de ambiente do n8n:
- `WHATSAPP_API_URL` = `https://evo.icontabil.shop/message/sendText/<NOME_DA_INSTANCIA>`
- `WHATSAPP_API_KEY` = a `EVO_API_KEY`

(O payload de envio e o header exato são ajustados ao religar o fluxo — etapa seguinte.)
