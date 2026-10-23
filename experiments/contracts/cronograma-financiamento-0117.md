# Condições do cronograma de financiamento — 0.1.17

**17/10/2026. E04, nível Alto.** A revisão encontrou condições que ainda não acompanhavam o campo de vencimento. A correção amplia as evidências pendentes; não gera um calendário de pagamentos nem escolhe a modalidade contratada.

## Revisão e correção

| Condição | Tratamento |
|---|---|
| Primeira prestação de juros paga após a liberação do crédito, havendo carência | Preserva o prazo e o evento como evidência pendente, inclusive na forma textual fragmentada “pr imeira”. Não calcula data. |
| Cobrança trimestral durante carência e mensal durante amortização | Mantém as frequências e as fases no mesmo trecho literal; não escolhe uma frequência para todo o contrato. |
| Dia expresso junto às frequências por fase | Não transforma esse dia em vencimento mensal único. |
| Exceção sem carência e deslocamento para dia útil | Continuam associados às pendências anteriores; nenhum trecho é removido para permitir uma resposta parcial. |
| Frequência de cálculo de juros, cobertura de seguro ou cobrança de multa | Não vira vencimento regular nas formas testadas. |

O reconhecimento exige expressões de cobrança/pagamento e contexto financeiro de carência/amortização. Não basta encontrar a palavra “carência” ou uma frequência de cálculo. Lacunas e prazos inválidos ficam preservados para revisão, sem gerar datas ou números de parcelas.

Com um candidato parcial e condições não consolidadas, o resultado permanece `ambiguo`. Sem candidato principal, continua `nao_identificado`, agora com justificativa específica de cronograma incompleto. Esquema e protocolo continuam 1.0.0.

## O que ainda impede o calendário

As condições gerais examinadas remetem a quadros contratuais. A extração ainda não associa automaticamente a opção contratada, os prazos desses quadros, os eventos de emissão/liberação, o término da carência e as regras de dia útil. Também não reconstrói cronogramas ou tabelas de prestações. Por isso, identificar as cláusulas não significa ter informação suficiente para gerar pagamentos.

Esta revisão usa o texto extraído de desenvolvimento e sua rastreabilidade; não é gabarito independente, parecer jurídico ou nova conferência visual integral dos PDFs.

## Validação

Sete testes fictícios novos reproduziram as omissões antes da correção. Cobrem prazo relativo, frequência por fase, dia explícito, páginas distintas, lacunas, prazo zero, ausência de cálculo de data e exclusão de condições incidentais. **184 testes Python e sete Node passaram: 191 no total.**

Reexecutados os **18 documentos de desenvolvimento**. Todos os JSONs passaram na validação de esquema e de localização literal das evidências.

| Documento | Antes → depois | Estado final |
|---|---|---|
| `fin-04` | Uma → duas evidências de vencimento. Acrescentada a primeira cobrança de juros após liberação, na página física 2, e esclarecido o motivo. | Não identificado, valor nulo. |
| `fin-05` | Quatro → seis evidências. Acrescentadas as frequências por fase das páginas físicas 5 e 6. | Ambíguo, valor nulo. |

**Os outros 88 objetos de campo ficaram idênticos à 0.1.16.** Nenhum estado ou valor final mudou. Continuam 16 processamentos concluídos e duas falhas de leitura. Nos vencimentos: três encontrados, 12 não identificados, um ambíguo e dois erros de leitura. São contagens de saída, não métricas de acerto.

## Rastreabilidade

Base local na C:, fora do Git:

`C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/`

- Lote: `E04-lote-0117-20261018T022523177683Z/`.
- Referência: `E04-lote-0116-20261018T021909837616Z/`.
- Hash das regras e versões: `resumo-desenvolvimento.json` e manifestos individuais do lote; conferidos com o código atual.
- Preservados código, catálogos, esquema, protocolo, páginas, saídas, erros e comparações. Os nomes das pastas usam UTC; a data local é 17/10/2026.

Testes executados com o Python local do runtime contendo `pypdf==6.10.0` e Node. Nenhum documento reservado, gabarito ou dado da aplicação foi alterado. Sem chamada de IA, integração ou deploy.

## Próximo passo

**Preparar o comparador de avaliação com os casos fictícios do protocolo, com Alto.** Implementar e testar contagens, comparação exata/tolerante, omissões e erros de alta confiança. É preparação técnica para E06, não execução da avaliação final: as métricas de contratos reais continuam dependendo de E03 (gabarito independente) e E05 (lote congelado). Não usar saídas do extrator como gabarito.

**Esta entrega: 100% (3/3 blocos — revisão/correção, validação e documentação). Experimento: 29% (2/7 etapas formais).**
