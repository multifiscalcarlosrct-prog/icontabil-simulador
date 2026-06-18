# Calibração — carga de IBS/CBS no DAS do Simples Nacional

> ✅ **HOMOLOGADO** por **Carlos A. Silva — CRC BA 024.174/O-3** em **18/06/2026**.
> Todos os valores e premissas abaixo foram conferidos e aprovados para uso em produção.
> Alimentam o cenário **"Simples puro"** do simulador (`src/config/simplesNacional.js`).

## Como o número é calculado

No cenário **puro**, a empresa do Simples recolhe IBS/CBS **dentro do DAS**. A fatia do DAS
que corresponde a IBS/CBS é a soma do que hoje é **PIS + COFINS** (→ CBS) e **ICMS ou ISS**
(→ IBS). O IPI (Anexo II) **não** entra, pois não é substituído por IBS/CBS.

```
alíquota efetiva do Simples = (RBT12 × alíquota nominal − parcela a deduzir) / RBT12
parcela IBS/CBS sobre a receita = alíquota efetiva × (fatia IBS/CBS do DAS)
```

A "fatia IBS/CBS do DAS" (`shareIbsCbs` em `src/config/simplesNacional.js`) vem da
tabela de partilha de cada Anexo:

| Anexo | Faixas 1–5: PIS+COFINS | + ICMS/ISS | = fatia IBS/CBS | Faixa 6 (sublimite) |
|---|---|---|---|---|
| I — Comércio | 15,50% | 34,00% (ICMS) | **49,5%** | 34,4% (ICMS fora do DAS) |
| II — Indústria | 14,00% | 32,00% (ICMS) | **46,0%** | 25,5% |
| III — Serviços | ~15,6% | ~33,5% (ISS) | **49,1%** | 19,5% |
| V — Serv. intelectuais | ~17,2–19,2% | 14–23,5% (ISS) | **31,15% → 40,65%** (cresce por faixa) | 20,0% |

## Faixas usadas (alíquota nominal / parcela a deduzir)

Faixas vigentes da **LC 123/2006** (RBT12) — Anexos I, II, III e V. Conferidas contra as
tabelas oficiais. Ver `src/config/simplesNacional.js`.

## Fator R (serviços)

Serviços com **folha/receita (12m) < 28%** são tributados pelo **Anexo V**; **≥ 28%** pelo
**Anexo III**. O formulário **pergunta a folha de pagamento** e calcula o Fator R ao vivo
(`LIMIAR_FATOR_R = 0.28`).

## Exemplos validados

| Cenário | Faixa | Efetiva Simples | Fatia IBS/CBS | Parcela s/ receita |
|---|---|---|---|---|
| Comércio, R$ 120 mil | 1ª | 4,00% | 49,5% | **1,98%** |
| Comércio, R$ 380 mil | 3ª | 5,85% | 49,5% | **2,90%** |
| Serviço, R$ 1 mi | 4ª | ~12,4% | 49,1% | **~6,11%** |

## Simplificações homologadas

1. **Setor → Anexo:** comércio→I, indústria→II, serviço→**III** (ou **V** via Fator R),
   **rural→I (comércio)**. ✅ Confirmado.
2. **6ª faixa** (RBT12 > 3,6 mi): ICMS/ISS recolhido **fora** do DAS (sublimite) → a fatia
   considera só a parte de CBS (~20–34%). ✅ Confirmado.
3. **Teto de 5% de ISS** (Anexo III, faixas altas): não modelado (usa-se 49,1% cheio).
   ✅ Simplificação aceita.
4. **Transição 2026–2033:** usa-se a fatia IBS/CBS **cheia** (estado final); a soma que vira
   IBS/CBS é constante ao longo da transição. ✅ Confirmado.

**Fonte das tabelas:** partilha do Simples Nacional (Anexos I, II, III, V) — LC 123/2006.
