# Calibração — carga de IBS/CBS no DAS do Simples Nacional

> ⚠️ **Para homologação do contador responsável (CRC).** As tabelas abaixo alimentam o
> cenário "Simples puro" do simulador. Confira os números antes de uso em produção.

## Como o número é calculado

No cenário **puro**, a empresa do Simples recolhe IBS/CBS **dentro do DAS**. A fatia do DAS
que corresponde a IBS/CBS é a soma do que hoje é **PIS + COFINS** (→ CBS) e **ICMS ou ISS**
(→ IBS). O IPI (Anexo II) **não** entra, pois não é substituído por IBS/CBS.

```
alíquota efetiva do Simples = (RBT12 × alíquota nominal − parcela a deduzir) / RBT12
parcela IBS/CBS sobre a receita = alíquota efetiva × (fatia IBS/CBS do DAS)
```

A "fatia IBS/CBS do DAS" (coluna `shareIbsCbs` em `src/config/simplesNacional.js`) vem da
tabela de partilha de cada Anexo:

| Anexo | Faixas 1–5: PIS+COFINS | + ICMS/ISS | = fatia IBS/CBS | Faixa 6 |
|---|---|---|---|---|
| I — Comércio | 15,50% | 34,00% (ICMS) | **49,5%** | 34,4% (ICMS fora do DAS) |
| II — Indústria | 14,00% | 32,00% (ICMS) | **46,0%** | 25,5% |
| III — Serviços | ~15,6–17,1% | ~32–33,5% (ISS) | **~49,1%** | 19,5% |
| V — Serv. intelectuais | ~17,2–19,2% | 14–23,5% (ISS) | **~31–41%** | 20,0% |

## Faixas usadas (alíquota nominal / parcela a deduzir)

São as faixas vigentes da LC 123/2006 (RBT12). Conferir em `src/config/simplesNacional.js`.

## Exemplos (conferir)

| Cenário | Faixa | Efetiva Simples | Fatia IBS/CBS | Parcela s/ receita |
|---|---|---|---|---|
| Comércio, R$ 120 mil | 1ª | 4,00% | 49,5% | **1,98%** |
| Comércio, R$ 380 mil | 3ª | 5,85% | 49,5% | **2,90%** |
| Serviço, R$ 1 mi | 4ª | ~12,4% | 49,1% | **~6,11%** |

## Pontos a validar / simplificações assumidas

1. **Setor → Anexo:** comércio→I, indústria→II, serviço→**III**, rural→I.
   - Serviços **intelectuais** com **Fator R < 28%** deveriam usar o **Anexo V** — hoje o
     formulário não pergunta o Fator R. Decidir se adicionamos essa pergunta.
   - "Rural/Agro" foi mapeado como comércio (Anexo I) — confirmar.
2. **6ª faixa** (RBT12 > 3,6 mi): ICMS/ISS é recolhido **fora** do DAS (sublimite), então a
   fatia considera só a parte de CBS. Conferir o tratamento.
3. **Teto de 5% de ISS** (Anexo III, faixas altas): não modelado (simplificação).
4. **Transição 2026–2033:** usamos a fatia IBS/CBS **cheia** (estado final). Durante a
   transição os percentuais migram gradualmente, mas a soma que vira IBS/CBS é constante.

**Fonte das tabelas:** partilha do Simples Nacional (Anexos I, II, III, V).
