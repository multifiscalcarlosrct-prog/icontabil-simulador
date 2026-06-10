# Calculadora oficial IBS/CBS (Regime Geral) — integração

A iContábil Simulador usa a **Calculadora de Tributos oficial** da Receita Federal
(Reforma Tributária sobre o Consumo) como fonte confiável da carga de IBS/CBS do regime
regular. Ela é **open source, gratuita e roda localmente** (sem enviar dados à Receita).

> Seção 3 do `CLAUDE.md`: a Calculadora é um motor **por operação** (UF, município, CST,
> classificação tributária, valor → CBS/IBS/IS). Ela **não** recebe CNPJ nem recomenda
> regime — isso é papel do nosso `motorDecisao`.

## 1. Obter e rodar o componente local (offline)

1. Baixe o componente de uso local no portal do piloto:
   <https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/calculadora>
2. É uma aplicação **Java (Spring Boot)**. Com o Java instalado, na pasta da calculadora:
   ```bash
   java -jar api-regime-geral.jar --spring.profiles.active=offline
   ```
3. O serviço sobe em `http://localhost:8080/api/` (há Swagger para explorar a API).
   - Alternativa: rodar via **Docker** (imagem fornecida pela RFB).
4. Na **VPS da Hostinger** (seção 5 do `CLAUDE.md`), rode o jar como serviço (systemd)
   ou contêiner, ao lado do backend Node.

## 2. Apontar o backend para a Calculadora

No `.env`:
```
CALCULADORA_URL=http://localhost:8080/api
```
Vazio = modo **mock** (alíquota de referência ~26,5%, rotulada como estimativa).

## 3. Contrato usado pela integração

Verificado no código da lib open source `CalculadoraRTC`
(<https://github.com/andre-djsystem/CalculadoraRTC>) e na documentação oficial.

**Requisição** — `POST {CALCULADORA_URL}/calculadora/regime-geral`
```json
{
  "dataHoraEmissao": "2026-06-09T12:00:00.000Z",
  "uf": "BA",
  "municipio": 2903201,
  "itens": [
    { "numero": 1, "nbs": "101011900", "cst": "000", "cClassTrib": "000001",
      "baseCalculo": 10000, "quantidade": 1, "unidade": "UN" }
  ]
}
```

**Resposta** (totais que consumimos):
```
total.tribCalc.IBSCBSTot.gIBS.vIBS   → IBS total (UF + Município)
total.tribCalc.IBSCBSTot.gCBS.vCBS   → CBS (União)
total.tribCalc.ISTot.vIS             → Imposto Seletivo
```
A alíquota efetiva do regime regular é estimada como `(vIBS + vCBS) / valor`.

## 4. ⚠️ Pendente de validação contra o serviço real

Os códigos da **operação representativa** em `src/config/calculadora.js`
(`cst`, `cClassTrib`, `ncm`/`nbs` por setor) são **placeholders**. Antes de confiar nos
números, valide-os com:
- `GET /calculadora/dados-abertos/situacoes-tributarias/cbs-ibs`
- `GET /calculadora/dados-abertos/classificacoes-tributarias/cbs-ibs`
- `GET /calculadora/dados-abertos/ncm` e `/nbs`

Enquanto não validados (ou com o serviço fora do ar), a integração cai automaticamente na
alíquota de referência — o app continua funcionando.
