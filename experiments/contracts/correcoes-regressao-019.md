# Correções de regressão — versão 0.1.9

**14/10/2026 (America/Sao_Paulo).** Corrigidos os três achados prioritários da [rodada 0.1.8](regressao-desenvolvimento-018.md). Foram conferidos oito documentos afetados e os dois contratos complementares; o conjunto reservado não foi executado.

| Caso | Antes | Depois | Resultado técnico |
|---|---|---|---|
| `alu-01`, vigência | Encontrada com datas e duração nulas | Ambígua, sem valor | Datas com espaços/barras e duração em branco não fornecem uma vigência. Posse posterior não define início. |
| `edu-07`, vencimento | Encontrado | Não identificado | Valores monetários e número de parcelas não bastam para preencher vencimento remetido à matrícula. |
| `edu-09`, vencimento | Não identificado | Encontrado como regra literal | Recuperada a cláusula com matrícula, parcelas seguintes no dia 7, início em fevereiro e instrução após o vencimento; nenhuma data calculada nem dia isolado. |
| `pub-alu-02` e `pub-alu-03` | Saídas 0.1.8 | Cinco campos integralmente idênticos em cada contrato | Preservados valores, estados, regras, evidências e motivos. |

## Alterações

- Assinatura e posse precisam de vínculo explícito com o início da vigência. Menções incidentais a assinatura, posse, condição ou evento deixam de bastar. Início explicitamente condicionado à assinatura continua aceito como regra, sem data inventada.
- Lacunas de datas com barras separadas por espaços e parênteses vazios antes de “meses” provocam abstenção. URLs não são interpretadas como lacunas de data.
- O encaminhamento para pagamento por evento exige ligação local entre pagamento, prazo em dias e conector temporal. A expressão “após o vencimento”, isoladamente, não intercepta uma cláusula mensal.
- Vencimento condicional precisa de referência a dia ou data de pagamento; um número qualquer no parágrafo não basta. A seleção continua lexical e não garante compreensão de todas as obrigações de um texto longo.

## Verificação e limites

Oito testes novos, com falhas reproduzidas antes da correção. **121 testes Python e sete Node aprovados: 128 no total.** Casos cobrem lacunas, posse incidental, início por evento explícito, URLs, instrução após vencimento, números financeiros e preservação de regra condicional.

Os dez PDFs reexecutados concluíram o processamento; todos os JSONs e a localização literal das evidências passaram na validação. Valor, número de parcelas e reajuste ficaram integralmente inalterados nos dez documentos. Não foi reexecutado o lote completo de 16 nesta etapa.

Outras mudanças observadas: vencimentos de `edu-01`, `edu-04`, `fin-01` e `fin-04` passaram de ambíguos para não identificados; não foram produzidos valores substitutos. A vigência de `fin-04` passou de ambígua para não identificada. **As vigências de `edu-01`, `edu-04` e `edu-06` continuam ambíguas**; contexto incidental e lacunas em blocos extensos ainda exigem revisão. Essas saídas não equivalem a confirmação de ausência de informação nos contratos.

Não há gabarito independente, métricas formais, leitura jurídica integral, integração ao aplicativo ou deploy. Os dois PDFs sem texto do lote anterior continuam uma limitação conhecida; OCR não foi executado.

## Rastreabilidade

- Rodada final: `runs/E04-regressao-019-20261015T020041408679Z/` (nome em UTC; data local 14/10/2026).
- Referência dos oito originais: `E04-lote-018-20261014T092254285030Z`.
- Referências complementares: `E04-20261014T091641028831Z-2f79b0` e `E04-20261014T091642513760Z-f9833f`.
- Preservados rotina, catálogos, resumos, logs, resultados brutos, páginas, manifestos e comparações com hashes. Identidade dos PDFs e estabilidade do código verificadas.
- Tentativa intermediária `E04-regressao-019-20261015T015953934645Z` preservada: a verificação detectou uma URL confundida com data vazia e interrompeu o lote no nono documento. Correção e teste específico precederam a rodada final; os manifestos distinguem os hashes das duas revisões.

**Próximo passo — Alto:** restringir a seleção de vigência nos três contratos educacionais ainda ambíguos, separando prazo principal de matrícula, pagamento e obrigações incidentais. Reproduzir os casos em testes fictícios e preservar as saídas atuais. A anotação independente e a ampliação da coleta continuam pendentes.

## Acompanhamento — 14/10/2026

A revisão das três vigências educacionais foi concluída na [versão 0.1.10](vigencia-educacional-0110.md). Esta rodada 0.1.9 e seus resultados permanecem preservados.
