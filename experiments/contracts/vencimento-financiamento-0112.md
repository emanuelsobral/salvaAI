# Vencimento de financiamento — 0.1.12

**15/10/2026.** A inspeção de `fin-05` confirmou que a saída anterior preservava somente a primeira prestação sem carência. A versão 0.1.12 sinaliza a insuficiência dessa resposta: o vencimento passa de `encontrado` para `ambiguo`, com valor nulo e evidências para revisão. Não foi implementado um cronograma completo nem calculada qualquer data.

## Diagnóstico

O documento contém condições gerais que remetem ao Quadro “Prazos” da cédula. A leitura técnica do texto extraído identificou:

| Página física / item | Condição relevante | Problema na saída anterior |
|---|---|---|
| 3 / 7.1 | Primeira prestação de juros no dia 15 do terceiro mês subsequente à emissão; carência definida no quadro | A exclusão genérica de trechos com juros descartava essa condição. |
| 3 / 7.2 | Primeira amortização no dia 15 do mês subsequente ao término da carência; demais no mesmo dia dos meses seguintes | A forma “vencendo-se a primeira” não era reconhecida como informação pendente. |
| 3 / 7.2.1 | Sem carência, primeira amortização no dia 15 subsequente à liberação | Era a única regra retornada como encontrada. |
| 3 / 8.1 | Deslocamento de vencimentos em sábados, domingos e feriados para o primeiro dia útil subsequente | A condição não acompanhava a resposta parcial. |
| 5 / 9.5 e 6 / sistemática SELIC | Periodicidades de exigibilidade durante carência e amortização | Reforçam a existência de condições distintas; não foram consolidadas automaticamente. |

A presença desses trechos não informa qual modalidade foi contratada nem preenche o quadro referido. A inspeção não é parecer jurídico, gabarito humano independente ou revisão visual integral do PDF.

## Correção e limites

O extrator registra como pendentes construções explícitas de carência/amortização com “vencendo-se a primeira” e regras de deslocamento de prestação/parcela de amortização para dia útil. Havendo uma resposta candidata, essas condições impedem que ela seja entregue isoladamente como suficiente. Sem candidato principal, o campo continua não identificado e mantém as evidências.

Isso é uma proteção contra resposta parcial, não compreensão geral de cronogramas. As regras são lexicais e não cobrem todas as redações; não conciliam condições entre modalidades, quadros e anexos. O esquema permanece congelado. A consolidação completa do vencimento de financiamento continua pendente, assim como a avaliação com gabarito independente.

## Validação

Sete testes sintéticos novos cobrem carência, juros, dia útil em cláusula separada, condição isolada, dias inválidos/lacunas, preservação dos outros campos e exclusão de seguro/multa/carência de cobertura. As falhas foram reproduzidas antes da correção. **143 testes Python e sete Node passaram: 150 no total.**

Reexecutados os 18 documentos de desenvolvimento, comparando os objetos completos dos cinco campos contra a versão 0.1.11:

| Documento/campo | Resultado |
|---|---|
| `fin-05` / vencimento | Encontrado → ambíguo; valor nulo, motivo específico e quatro evidências literais na página 3. |
| `fin-04` / vencimento | Permanece não identificado; acrescentada evidência da regra de dia útil na página 2. |
| Outros 88 objetos de campo | Integralmente idênticos, inclusive os dois contratos complementares. |

Os 18 JSONs passaram no esquema e na localização literal das evidências. Foram 16 processamentos concluídos e duas falhas de leitura preservadas (`sau-04` e `sau-05`). O vencimento ficou com três encontrados, 12 não identificados, um ambíguo e dois erros de leitura. São estados do extrator, não métricas de acerto; reduzir “encontrados” neste caso evita esconder uma omissão.

## Rastreabilidade e próximo passo

- Rodada: `runs/E04-lote-0112-20261015T235840698277Z/`.
- Referência: `runs/E04-lote-0111-20261015T021701944241Z/`.
- Regras SHA-256: `35dcddfd183beaa9adf339f24e90e79abd46dc9e2316f684143113474e13c6bf`.
- PDFs conferidos contra catálogos e referência; versão e hash das regras conferidos em todos os manifestos e ao final do lote. Resultados brutos, páginas, erros, comparações, catálogos e rotina preservados.
- Nenhum documento reservado executado; nenhum gabarito alterado. Sem chamadas de IA, integração ao aplicativo ou deploy.

**Próximo passo: diagnosticar os quatro reajustes ambíguos (`fin-01`, `sau-01`, `sau-07` e `sau-09`), com nível Alto.** Distinguir conflitos reais de limitações das regras antes de decidir ajustes. Permanecem pendentes a consolidação do cronograma de financiamento, OCR e ampliação/anotação independente da amostra.
