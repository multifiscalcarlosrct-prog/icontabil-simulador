# iContábil IA — Scripts de WhatsApp por Segmento de Lead
> Para uso no N8N. As variáveis entre `{{}}` são preenchidas automaticamente
> com os dados do payload enviado pelo `leadService.js`.

---

## Variáveis disponíveis no payload

| Variável            | Exemplo                        |
|---------------------|-------------------------------|
| `{{nome}}`          | Fazenda São João Ltda          |
| `{{regime_atual}}`  | Simples Nacional               |
| `{{recomendacao}}`  | híbrido                        |
| `{{faturamento}}`   | R$ 480.000,00/ano              |
| `{{pct_pj}}`        | 75%                            |
| `{{setor}}`         | rural                          |
| `{{cnpj}}`          | 00.000.000/0001-00             |
| `{{creditos}}`      | 2                              |
| `{{carlos_fone}}`   | (77) 9 9999-9999               |

---

## SEGMENTO 1 — Produtor Rural / Alto Faturamento
> **Critério N8N:** `setor = "rural"` OU `faturamento > 360000`
> **Prioridade:** MÁXIMA — Carlos aborda pessoalmente em até 1h.

---

### T+0 — Automático (dispara assim que o OTP é verificado)

```
Olá! 👋 Aqui é o Carlos, da *iContábil IA*.

Vi que você acabou de simular o regime tributário de *{{nome}}* na nossa ferramenta.

Sua análise ficou pronta e a recomendação foi o *regime {{recomendacao}}* — o que faz sentido dado que {{pct_pj}}% das suas vendas são para outras empresas.

Fiz uma anotação aqui e quero conversar um pouco mais sobre o seu caso antes de setembro, porque dependendo do seu volume de compras com crédito, a economia pode ser maior do que o simulador mostra.

Posso te ligar agora ou você prefere agendar um horário? 📅
```

---

### T+1 dia — Follow-up (se não respondeu)

```
Bom dia! Carlos da *iContábil IA* novamente. 🌱

Só passando pra reforçar: a janela para definir o regime de IBS/CBS fecha em *30 de setembro*. Quem não decide fica no Simples puro por padrão — e para quem vende bastante pra pessoa jurídica, isso pode significar perder competitividade.

No caso de *{{nome}}*, o regime {{recomendacao}} parece o mais vantajoso. Mas isso precisa de uma análise um pouco mais fina antes de formalizar.

Me chama aqui quando puder — 10 minutinhos bastam. 👇
```

---

### T+4 dias — Urgência (se ainda não respondeu)

```
Olá! Setembro chega rápido e a decisão do regime tributário não pode ficar pra última hora.

Para *{{nome}}*, uma escolha errada agora pode custar caro em 2027 — seja em carga tributária maior, seja perdendo crédito pra seus clientes PJ.

Se quiser, faço uma análise personalizada *sem custo* antes de você decidir. Só me chama. 👇

_Carlos Silva — CRC BA 024.174/O-3_
_iContábil IA — Contabilidade Rural do Oeste da Bahia_
```

---

## SEGMENTO 2 — Pequeno Comércio / Serviço
> **Critério N8N:** `setor = "comercio"` OU `setor = "servico"` E `faturamento < 360000`
> **Prioridade:** MÉDIA — sequência automática, Carlos só entra se responder.

---

### T+0 — Automático

```
Olá! 👋 Sou o Carlos, da *iContábil IA*.

Você simulou o regime de *{{nome}}* agora mesmo e o resultado apontou para o *{{recomendacao}}*.

Esse resultado leva em conta que {{pct_pj}}% das suas vendas são para pessoas jurídicas. Se esse número mudar — ou se você tiver dúvida sobre como isso foi calculado — me chama aqui que a gente revisa.

A decisão precisa ser tomada até *30/setembro*. 📅

_Carlos Silva — CRC BA 024.174/O-3_
```

---

### T+2 dias — Follow-up automático

```
Oi, tudo bem? 😊

Só lembrando que a opção pelo regime de IBS/CBS vence em *30 de setembro* — e muita gente está deixando pra última hora sem saber o impacto que isso tem.

Para *{{nome}}*, a análise já está pronta. Se quiser entender melhor o que muda na prática pra você, é só me chamar.

Nenhum custo, sem compromisso. 👇
```

---

### T+5 dias — Último contato automático

```
Olá! Última mensagem sobre isso, prometo. 😄

Setembro está chegando e a janela tributária fecha. Se *{{nome}}* ainda não definiu o regime, vale uma conversa rápida antes de decidir no escuro.

Tô à disposição aqui. 👇

_iContábil IA — contabilidade especializada em rural e agronegócio_
_Barreiras/BA | 100% digital_
```

---

## SEGMENTO 3 — Lead que bateu no Paywall
> **Critério N8N:** `creditos = 0` (usou as 3 consultas grátis e tentou uma 4ª)
> **Prioridade:** ALTÍSSIMA — esse é o lead mais quente. Carlos aborda em até 30 min.

---

### T+0 — Automático (dispara no momento do bloqueio)

```
Olá! 👋 Carlos da *iContábil IA*.

Vi que você usou as 3 consultas gratuitas da ferramenta — o que me diz que você tem mais de uma empresa pra analisar antes de setembro.

Posso fazer isso por você. Se me passar os CNPJs que faltam, rodo as análises pessoalmente e te entrego um relatório completo de cada uma — *sem cobrar por consulta agora*.

Me chama aqui. 👇
```

---

### T+1 dia — Follow-up (se não respondeu)

```
Oi! Carlos da iContábil IA novamente.

Quem consulta mais de 3 empresas geralmente é contador ou empresário com mais de um CNPJ — e é exatamente pra esse perfil que faço questão de atender direto.

Temos uma solução de *acesso ilimitado* que pode fazer sentido pro seu caso, mas antes de falar em plano, quero entender o que você precisa.

Me conta: quantas empresas você está analisando? 👇
```

---

## SEGMENTO 4 — Contador / Escritório Contábil
> **Critério N8N:** `setor = "contabilidade"` OU CNAE do CNPJ for de serviços contábeis
> **Prioridade:** ALTA — abordagem diferente: parceria, não venda de serviço.

---

### T+0 — Automático

```
Olá! 👋 Carlos da *iContábil IA* — contabilidade rural do Oeste da Bahia.

Vi que você usou nossa ferramenta para analisar *{{nome}}*. Se você é contador, provavelmente tem uma carteira de clientes pra analisar antes de setembro.

Tenho uma proposta diferente pra você: em vez de você fazer isso um por um, posso te oferecer *acesso ilimitado* ou até uma parceria pra você oferecer a ferramenta com a sua marca.

Faz sentido conversarmos? 👇
```

---

### T+2 dias — Follow-up

```
Oi! Passando rapidinho.

A janela de setembro é uma oportunidade de ouro pra você se posicionar como especialista em reforma tributária com os seus clientes — e a ferramenta pode ajudar nisso.

Se quiser, posso mostrar como outros contadores estão usando isso pra captar cliente agora. Sem compromisso. 👇

_Carlos Silva — CRC BA 024.174/O-3_
_iContábil IA_
```

---

## Regras de ouro para todos os scripts

1. **Nunca mandar dois segmentos ao mesmo lead.** O N8N define o segmento uma vez e não muda.
2. **Se o lead responde, sai da automação.** Carlos assume o contato pessoalmente.
3. **Nunca citar preço nos scripts automáticos.** Preço só em conversa direta.
4. **Máximo 3 tentativas automáticas por lead.** Depois silêncio — não virar spam.
5. **Sempre assinar com CRC.** Passa autoridade e diferencia de robô de venda.

---

## Configuração no N8N

```
Trigger: Webhook POST (leadService.js)
↓
Switch node: classifica segmento pelo payload
↓
├── Produtor Rural → Espera 0min → WhatsApp T+0 → Notifica Carlos no Telegram
├── Pequeno Comércio → Espera 0min → WhatsApp T+0 → Wait 2d → T+2 → Wait 3d → T+5
├── Paywall → Espera 0min → WhatsApp T+0 → Notifica Carlos → Wait 1d → T+1
└── Contador → Espera 0min → WhatsApp T+0 → Wait 2d → T+2
↓
IF respondeu → Para automação → Tag "Em atendimento"
IF não respondeu após último → Tag "Frio" → Entra em lista de retargeting
```

---

_iContábil IA — Carlos A. Silva, CRC BA 024.174/O-3_
_Barreiras/São Desidério — Oeste da Bahia_
