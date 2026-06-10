# iContábil IA — Simulador de Regime Tributário (Reforma Tributária)

> Documento de contexto do projeto. Carregar no Claude Code (salvar como `CLAUDE.md`
> na raiz do repositório) para que a sessão entenda o produto, as decisões técnicas
> e as restrições antes de escrever código.

---

## 1. O que é

Web app que ajuda **empresários, contadores e interessados** a descobrir a forma de
apuração tributária mais vantajosa diante da Reforma Tributária (IBS/CBS), comparando:

- **Simples Nacional "puro"** (IBS/CBS dentro do DAS)
- **Simples Nacional "híbrido"** (IBS/CBS recolhidos "por fora", pelo regime regular)
- **Lucro Presumido** (e menção a Lucro Real quando o porte indicar)

O usuário informa o CNPJ (auto-preenchimento cadastral) + responde poucas perguntas
financeiras, e o app gera um **relatório comparativo com recomendação**, em PDF, na
identidade visual da iContábil IA.

Marca: iContábil IA — contabilidade rural/agro do Oeste da Bahia (Barreiras/São Desidério).
Responsável: Carlos A. Silva, CRC BA 024.174/O-3.

## 2. Por que agora (a oportunidade)

Resolução **CGSN nº 186/2026** abriu janela de **1º a 30 de setembro de 2026** para a
empresa do Simples optar entre "puro" e "híbrido", com efeitos a partir de **1º/01/2027**.
Desistência irretratável até **30/11/2026**. Quem não opta fica no puro por padrão.

Pelo art. 47, §9º da LC 214/2025, optante do Simples **não pode se creditar de IBS/CBS**
se não optar pelo regime regular — e seus clientes PJ também não tomam crédito sobre o
que compram dele. Isso pode tornar a empresa um fornecedor menos competitivo no B2B.
**Essa é a dor que o produto resolve.**

## 3. Realidade técnica — LEIA ANTES DE CODAR

Três pontos que mudam o desenho (não ignorar):

1. **O CNPJ só entrega dados cadastrais.** Via APIs públicas/pagas (BrasilAPI, OpenCNPJ
   grátis; CNPJá/SintegraAPI pagas) dá pra obter: razão social, CNAE(s), porte, situação
   cadastral, UF/município, optante Simples/SIMEI + histórico. **NÃO existe** faturamento,
   margem, custo de insumos nem perfil de clientes via CNPJ — são dados fiscais privados
   (só com certificado digital/procuração). Esses dados o **usuário informa**.

2. **A Calculadora oficial é um motor POR OPERAÇÃO, não por empresa.** Em
   `consumo.tributos.gov.br` / piloto-cbs, ela recebe UF, município, CST, classificação
   tributária e valor da operação e devolve CBS/IBS/IS. É **open source, com API REST e
   execução local**. Use-a como motor de cálculo confiável embarcado — ela NÃO recebe CNPJ
   nem recomenda regime.

3. **Alíquotas de 2027+ ainda são provisórias.** Em 2026 vigoram as de teste (CBS 0,9%,
   IBS 0,1%); referência projetada ~26,5%. Os números do relatório são **estimativas** —
   deixar isso claro no disclaimer. A recomendação *qualitativa* (puro vs. híbrido) é
   robusta porque depende mais do perfil de cliente do que da alíquota exata.

## 4. Motor de decisão (núcleo do produto)

**Auto-preenchido pelo CNPJ:** CNAE, porte, optante Simples (s/n), UF/município.

**Perguntas ao usuário (5):**
- Faturamento médio (mensal/anual)
- **% de vendas para PJ (que aproveita crédito) vs. consumidor final/PF** ← a mais decisiva
- Peso de insumos/mercadorias creditáveis vs. mão de obra
- Setor (comércio/serviço/indústria/rural)

**Regra de ouro:**
- Cliente majoritariamente **B2B → híbrido tende a vencer** (gera crédito ao cliente +
  se credita dos insumos).
- Cliente majoritariamente **consumidor final → puro tende a vencer** (cliente não usa
  crédito; híbrido só adiciona carga/complexidade).

## 5. Arquitetura sugerida

- **NÃO é site estático.** Precisa de backend (API de CNPJ, motor de cálculo, contagem de
  cota, pagamento, geração de PDF, persistência de leads).
- **Hospedagem: VPS da Hostinger** (recomendado) para rodar a Calculadora oficial localmente
  + backend. Hospedagem PHP compartilhada serve apenas a um MVP muito básico.
- Stack enxuta: front HTML/Tailwind (ou Next) · backend Node · motor = Calculadora oficial
  local + API de CNPJ · banco leve (SQLite/Postgres).
- Identidade visual: verde `#22C55E`, vermelho `#E8202A`, preto `#1A1A1A`.

## 6. Controle do free tier (decisão já tomada)

Modelo: **3 relatórios completos grátis → plano ilimitado pago.**

Princípio: a cota gruda **na pessoa (conta verificada)**, nunca no CNPJ nem no IP.

- **Identidade = conta com contato verificado por OTP.** MVP: e-mail OTP. v2: WhatsApp/
  celular OTP (anchor mais forte + lead direto pro N8N).
- **Contagem 100% no servidor** (nunca cookie/localStorage).
- **Normalizar e-mail** (minúsculas, remover pontos e `+tag` do Gmail) para evitar contas
  infinitas.
- **Soltar o barato, trancar o valioso:** preview cadastral do CNPJ é livre/sem cota; o que
  consome crédito é a **simulação completa + PDF**.
- **Cache por CNPJ:** re-rodar o mesmo CNPJ na mesma conta não debita crédito novo.
- **Vazamento = lead.** Não implementar fingerprint/captcha pesado no MVP — cada conta
  verificada (mesmo de "abusador") é um lead qualificado. O objetivo é captação + conversão,
  não proteger margem de SaaS.

### Modelo de dados (enxuto)

- `usuarios`: id, contato (e-mail/celular normalizado), verificado (s/n), plano (free/pago), data.
- `consultas`: id, usuario_id, cnpj, data, payload_resultado (cache).
- Crédito disponível = 3 − (nº de CNPJs **distintos** simulados com `verificado = sim`).

### Fluxo

1. Digita CNPJ → preview cadastral grátis
2. Preenche as 5 perguntas
3. Clica "Gerar relatório" → pede contato + OTP → verifica
4. Servidor checa cota → se há crédito: gera/grava/entrega PDF; se zerou: paywall

## 7. Monetização

- Grátis: 3 relatórios. Pago: ilimitado.
- Pagamento BR: **Pix via Mercado Pago/Pagar.me/Asaas** (principal) + cartão (secundário).
- Escada futura: avulso (1 PDF) · mensal ilimitado · **plano contador white-label**
  (consulta a carteira inteira) — maior potencial de receita recorrente.

## 8. Lead-gen (o tesouro)

Todo relatório termina com CTA: "Quer que a iContábil IA formalize essa opção?" Captura
contato e joga no **fluxo N8N** existente. Cada CNPJ simulado = lead qualificado com regime
e faturamento já informados.

## 9. Conformidade

- Posicionar como **simulador/orientação preliminar**, não parecer técnico definitivo
  (protege o CRC e reforça o CTA para o serviço humano).
- Disclaimer: simulação com base em dados informados, alíquotas provisórias, não substitui
  análise individualizada.
- LGPD: política de privacidade + base legal (consentimento) para tratar CNPJ + faturamento
  + contato. Validar redação com apoio jurídico.

## 10. Escopo

**MVP / v1 (antes de setembro):** landing + preview por CNPJ + 5 perguntas + comparativo
**Simples puro vs. híbrido** + PDF na identidade iContábil + conta com e-mail OTP + cota de
3 no servidor + cache por CNPJ + captura de lead. Sem pagamento ainda (ou paywall simples).

**v2:** OTP por WhatsApp + N8N · pagamento Pix/ilimitado · Lucro Presumido/Real no comparativo
· plano contador white-label.

## 11. Estrutura de pastas

Backend Node (Express) + frontend estático servido pelo mesmo app no MVP. Split MVC enxuto —
sem over-engineering.

```
icontabil-simulador/
├── CLAUDE.md
├── README.md
├── .env.example              # chaves: API_CNPJ, SMTP/Brevo, N8N_WEBHOOK, DB_URL...
├── .gitignore
├── package.json
├── src/
│   ├── server.js             # entry: sobe Express, registra rotas, serve /public
│   ├── config/
│   │   └── env.js            # carrega e valida variáveis de ambiente
│   ├── routes/
│   │   ├── cnpj.routes.js
│   │   ├── auth.routes.js
│   │   ├── simulacao.routes.js
│   │   └── pagamento.routes.js   # v2
│   ├── controllers/
│   │   ├── cnpj.controller.js
│   │   ├── auth.controller.js
│   │   ├── simulacao.controller.js
│   │   └── pagamento.controller.js
│   ├── services/
│   │   ├── cnpjService.js        # chama API de CNPJ + cache cadastral
│   │   ├── otpService.js         # gera/valida código, envia (Brevo/Resend)
│   │   ├── calculadoraService.js # integra a Calculadora oficial (REST local)
│   │   ├── motorDecisao.js       # NÚCLEO: puro vs híbrido vs presumido
│   │   ├── pdfService.js         # relatório PDF na identidade iContábil
│   │   ├── cotaService.js        # contagem de créditos no servidor
│   │   └── leadService.js        # webhook para o N8N
│   ├── db/
│   │   ├── index.js              # conexão SQLite (MVP) → Postgres (escala)
│   │   ├── schema.sql            # tabelas: usuarios, consultas, otp
│   │   └── repositories/
│   │       ├── usuarioRepo.js
│   │       └── consultaRepo.js
│   ├── middlewares/
│   │   ├── exigeVerificado.js    # bloqueia se conta não verificada
│   │   └── checaCota.js          # bloqueia/avisa paywall se créditos = 0
│   └── utils/
│       ├── normalizaEmail.js     # minúsculas, remove pontos e +tag do Gmail
│       └── validaCnpj.js         # valida dígitos verificadores
├── public/                       # frontend MVP
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/                   # logo + cores #22C55E #E8202A #1A1A1A
└── calculadora/                  # motor oficial em execução local (REST)
```

Tabela `otp` (complemento ao modelo da seção 6): id, contato, codigo, expira_em, usado.

## 12. Endpoints do backend

Mapeados ao fluxo da seção 6. **(v2)** = só na segunda versão.

**CNPJ (livre, sem cota)**
- `GET /api/cnpj/:cnpj` — preview cadastral (razão social, CNAE, porte, optante Simples,
  UF/município). Usa cache; valida dígitos antes de chamar a API externa.

**Autenticação por OTP**
- `POST /api/auth/solicitar-otp` — body `{ contato }`. Normaliza o contato, cria/acha usuário
  não verificado, gera código, envia por e-mail. Não revela se o contato já existia.
- `POST /api/auth/verificar-otp` — body `{ contato, codigo }`. Marca `verificado = sim`,
  abre sessão/token, dispara lead para o N8N (`leadService`).

**Simulação (núcleo, consome crédito)**
- `POST /api/simulacao` — body `{ cnpj, faturamento, pctPJ, pesoInsumos, setor }`.
  Middlewares: `exigeVerificado` + `checaCota`. Roda `motorDecisao` + `calculadoraService`,
  grava em `consultas`, devolve JSON comparativo + créditos restantes.
  **Regra de cota:** se o mesmo CNPJ já foi simulado por essa conta, usa o cache e **não
  debita** crédito novo.
- `GET /api/simulacao/:id/pdf` — gera/baixa o relatório PDF (identidade iContábil).
- `GET /api/cota` — créditos restantes da conta logada.

**Pagamento (v2)**
- `POST /api/pagamento/criar` — cria cobrança Pix (Mercado Pago/Asaas) → retorna QR + copia-e-cola.
- `POST /api/pagamento/webhook` — recebe confirmação do gateway → seta `usuario.plano = pago`.
  (Validar assinatura do webhook; nunca confiar no front para liberar o plano.)

Ordem de implementação sugerida: `GET /api/cnpj` → fluxo OTP → `POST /api/simulacao` (com
`motorDecisao` mockado a princípio) → `pdfService` → cota/paywall → pagamento (v2).

---

## Como começar no Claude Code

Sugestão de primeiro prompt na sessão:

> "Leia o CLAUDE.md. Vamos construir o MVP (v1) descrito na seção 10. Comece propondo a
> estrutura de pastas do repositório e o esqueleto do backend Node com os endpoints do
> fluxo da seção 6. Ainda não escreva o motor de cálculo — primeiro vamos validar a
> arquitetura."
