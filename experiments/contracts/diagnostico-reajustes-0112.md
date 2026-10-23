# Diagnóstico dos reajustes ambíguos — 0.1.12

**15/10/2026.** Foram inspecionados os quatro documentos de desenvolvimento com reajuste ambíguo. Há regras aplicáveis a componentes distintos e limitações de segmentação/classificação. Não foi comprovada contradição documental. A versão continua **0.1.12**; nenhuma regra ou resposta foi modificada nesta etapa.

## Achados por documento

| Documento | Evidência no texto extraído (página física) | Diagnóstico | Decisão técnica |
|---|---|---|---|
| `fin-01` | P. 5: saldo devedor e cota de amortização com atualização mensal vinculada à poupança. P. 6: seguro mensal e administração em julho. P. 8: atualização em liquidação/amortização extraordinária. | Objetos e eventos diferentes entram no mesmo campo. Há ainda referências genéricas, como a garantia da p. 10, sem regra autônoma de reajuste da prestação. | Manter abstenção. Separar o objeto reajustado antes de consolidar periodicidade; não converter atualização da poupança em uma sigla presumida. |
| `sau-01` | P. 19: reajuste anual da mensalidade, limite autorizado pela ANS, alternativas e obrigações acessórias. P. 20: mudança de faixa etária. P. 30: referência ao índice da ANS e tabela de faixas. | A construção do reajuste anual não é capturada pela regra de periodicidade atual; o título e os itens não são agrupados como na cláusula “DO REAJUSTE” suportada. Anual e faixa etária não são mecanismos equivalentes. A tabela aparece com lacunas no mesmo trecho. | Não escolher um percentual da tabela nem interpretar ANS como IPCA. Preservar modalidade anual e mudança por idade separadamente; exigir revisão da tabela e dos anexos. |
| `sau-07` | P. 36–38: periodicidade de 12 meses, IGPM somado a IRT condicionado à sinistralidade, apuração e agrupamento por quantidade de beneficiários. P. 39: faixa etária. P. 3: texto extraído desordenado. | Fórmulas e condições ficam fragmentadas. O candidato literal “Reajuste = IGPM + IRT” é classificado como `indice: IGP-M`, embora a regra textual mantenha a soma. Títulos isolados e orientações gerais também viram candidatos. | Prioridade: impedir classificação incompleta de regra composta. Não remover os outros candidatos para forçar um resultado “encontrado”. |
| `sau-09` | P. 38: limites corrigidos por IPCA em janeiro e bases de contribuição com critérios diferentes. P. 39: declaração de ausência de mecanismo de reajuste por vínculo salarial. P. 40: ausência de reajuste por idade. | O bloco da p. 38 vira candidato IPCA/12 meses apesar de reunir várias bases. As declarações negativas se referem a mecanismos específicos. | Não transformar o documento inteiro em “sem reajuste” nem aplicar IPCA a todas as contribuições. Separar limites, bases e mecanismo antes de consolidar. |

Esses achados descrevem o funcionamento do código e o texto extraído dos PDFs. Não são interpretação jurídica, confirmação de validade atual das cláusulas ou anotação humana independente. Não foi realizada nova revisão visual integral; tabelas e texto mal ordenado exigem conferência própria.

## Como a ambiguidade é produzida

O extrator reúne candidatos e compara o objeto completo, incluindo o texto literal da regra. Portanto, dois textos diferentes podem gerar `ambiguo` mesmo que se complementem. O estado é uma abstenção do programa e não uma prova de conflito entre cláusulas.

O reconhecimento de títulos agrupa somente a forma específica “CLÁUSULA … DO REAJUSTE”. As formas “– REAJUSTE”, capítulos e artigos dos casos examinados seguem a segmentação genérica. Um cabeçalho isolado contendo a palavra reajuste também pode virar candidato, apesar de não informar índice ou regra aplicável.

Na classificação por índice, a presença de uma sigla reconhecida e a ausência de percentual numérico bastam para `tipo: indice`. Isso deixa passar a fórmula IGPM + IRT como IGP-M. O trecho literal não é apagado, e a saída final do documento continua ambígua; o problema está na simplificação do candidato interno. Escolher o primeiro índice ou descartar evidências concorrentes exporia essa falha.

## Rastreio reproduzido

| Documento | Candidatos adicionados | Pendências registradas | Saída final |
|---|---:|---:|---|
| `fin-01` | 11 | 0 | Ambíguo |
| `sau-01` | 4 | 1 | Ambíguo |
| `sau-07` | 27 | 0 | Ambíguo |
| `sau-09` | 3 | 0 | Ambíguo |

Contagens de chamadas internas, não de regras únicas, erros ou acertos. A instrumentação observou `add` e `pendente` sem alterar o extrator. Os cinco objetos de campo de cada documento permaneceram idênticos à referência: **20 objetos conferidos**. Evidências capturadas foram localizadas literalmente nas páginas de origem. Os quatro JSONs preservados também passaram no validador de esquema e localização literal das evidências.

## Próximas correções, em ordem

1. **Proteger regras compostas — Alto.** Reproduzir IGPM + componente técnico em testes fictícios e preservar a composição como regra literal, sem reduzi-la ao índice reconhecido. Cobrir soma, condicionantes, limites percentuais que não são taxa de reajuste e substituição de índice. A abstenção dos documentos complexos deve permanecer quando faltarem condições consolidadas.
2. **Separar candidatos de meras referências — Alto.** Títulos isolados, garantias e remissões não devem estabelecer uma regra preenchida. Testar antes de mudar segmentação, preservando evidências e contratos anteriores.
3. **Distinguir objeto e modalidade — Alto.** Mensalidade, saldo devedor, seguro, taxa administrativa, contribuição e limites não podem compartilhar um índice automaticamente. Anual, técnico e faixa etária também exigem distinção. Qualquer ampliação do esquema/protocolo precisa ser versionada explicitamente; o esquema congelado permanece intacto nesta etapa.
4. **Reavaliar os quatro casos — Médio após correções.** Reexecutar somente desenvolvimento, registrar mudanças e manter abstenção quando a regra inteira não estiver suportada. Só avaliar precisão com gabarito independente e versões congeladas.

## Rastreabilidade

- Diagnóstico: `runs/E04-diagnostico-reajustes-0112-20261016T000759942405Z/` (nome em UTC; data local 15/10/2026).
- Fonte: `runs/E04-lote-0112-20261015T235840698277Z/`, usando as páginas e resultados já preservados. Não houve nova extração dos PDFs nesta etapa.
- Regras SHA-256: `35dcddfd183beaa9adf339f24e90e79abd46dc9e2316f684143113474e13c6bf`, conferido antes/depois e contra os manifestos da referência.
- Hash de cada PDF conferido contra catálogo e resultado. Divisão de desenvolvimento verificada para os quatro IDs. Preservados script de diagnóstico, código, catálogo, páginas, resultados, manifestos, candidatos e resumo.
- Nenhum documento reservado executado, nenhuma ficha de gabarito alterada e nenhuma chamada de IA. Sem integração ou deploy. Os 150 testes aprovados são da implementação 0.1.12 anterior; não foram repetidos sem mudança de código.
