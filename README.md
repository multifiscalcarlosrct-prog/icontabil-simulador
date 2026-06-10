# iContábil IA — Simulador de Regime Tributário

MVP (v1) do simulador que compara **Simples Nacional puro vs. híbrido** diante da Reforma
Tributária (IBS/CBS) e gera um relatório com recomendação. Contexto completo do produto,
decisões e restrições em [`CLAUDE.md`](CLAUDE.md).

> ⚠️ **Estado atual:** arquitetura + **motor de decisão implementado** (`motorDecisao.js` —
> regra de ouro da seção 4). A **Calculadora oficial** (`calculadoraService.js`) ainda é
> **mock** como fonte de alíquota, o **PDF** (`pdfService.js`) é stub, e os parâmetros
> fiscais em `src/config/tributos.js` são **provisórios** (alíquotas 2027+ não definitivas).
> Os números são estimativas indicativas; a recomendação qualitativa é a saída robusta.

## Stack

- **Backend:** Node 20+ · Express (ESM) · SQLite (better-sqlite3)
- **Auth:** OTP por e-mail → token de sessão (JWT)
- **Front:** HTML/CSS/JS estático servido pelo próprio backend (`/public`)

## Como rodar

```bash
cp .env.example .env      # ajuste JWT_SECRET e, se quiser, as integrações
npm install
npm run db:init           # cria o schema no SQLite
npm run dev               # sobe em http://localhost:3000
```

Sem provedor de e-mail configurado, o código OTP é **impresso no console** (modo dev).
Sem `CALCULADORA_URL`/`N8N_WEBHOOK_URL`, esses serviços operam mockados/best-effort.

## Endpoints (fluxo da seção 6 / 12 do CLAUDE.md)

| Método | Rota | Cota | Observação |
|---|---|---|---|
| `GET`  | `/api/cnpj/:cnpj` | livre | preview cadastral |
| `POST` | `/api/auth/solicitar-otp` | — | `{ contato }` |
| `POST` | `/api/auth/verificar-otp` | — | `{ contato, codigo }` → token + lead N8N |
| `POST` | `/api/simulacao` | consome | `exigeVerificado` + `checaCota`; cache por CNPJ não debita |
| `GET`  | `/api/simulacao/:id/pdf` | — | relatório PDF (stub) |
| `GET`  | `/api/cota` | — | créditos restantes |
| `POST` | `/api/pagamento/*` | — | **v2** (retorna 501) |

## Estrutura

```
src/
  server.js            entry: Express + rotas + /public
  config/env.js        carrega/valida .env
  routes/              cnpj · auth · simulacao · pagamento(v2)
  controllers/         finos, delegam aos services
  services/            cnpj · otp · calculadora(mock) · motorDecisao(mock) · pdf(stub) · cota · lead
  db/                  index(SQLite) · schema.sql · repositories/
  middlewares/         exigeVerificado · checaCota
  utils/               normalizaEmail · validaCnpj
public/                front MVP
calculadora/           Calculadora oficial IBS/CBS (integração futura)
```

## Próximas etapas

1. ~~Motor de decisão~~ ✅ implementado (`motorDecisao.js`). **Calibrar `src/config/tributos.js`**
   (parcela de IBS/CBS no DAS por setor) com o contador responsável.
2. Embarcar a **Calculadora oficial** IBS/CBS local e tirar o mock de `calculadoraService.js`.
3. Layout real do PDF na identidade iContábil (`pdfService.js`).
4. Front dos passos 2–4 (5 perguntas → OTP → resultado).
5. **v2:** pagamento Pix, OTP por WhatsApp, Lucro Presumido/Real, plano contador.
