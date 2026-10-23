# Alternativas e tabelas escolares — 0.1.24

**20/10/2026.** O protótipo identifica alternativas de pagamento e preços por perfil escolar, preservando os trechos e impedindo que uma opção seja apresentada como plano confirmado. Também confere um formato restrito de tabela de mensalidades.

## Resultado

| Caso | Comportamento |
|---|---|
| edu-04 | Reconhecida a alternativa à vista ou parcelada. A tabela com cinco mensalidades posteriores à matrícula passou na conferência do formato suportado. |
| edu-07 | Reconhecidos preços por perfil e opções complementares de pagamento/desconto, com matrícula preservada nas evidências. |

Nos dois documentos, `valor_parcela`, `numero_parcelas` e `data_vencimento` passam de não identificados para ambíguos, com motivo específico e evidências. Não se escolhe um preço, quantidade ou data. Os outros dois campos de cada contrato mantêm o comportamento anterior.

A mudança não significa contradição entre as opções: o protótipo ainda não vincula as condições a um plano confirmado. Mesmo uma marcação de opção escolhida não é resolvida nesta versão. Também não usa o tipo `variavel` para disfarçar a ausência dessa escolha.

## Conferência da tabela

O formato suportado contém cabeçalho de mensalidades, valor, referência opcional e vencimento; cada linha possui ordem da parcela, quantia em reais e data. A conferência verifica:

- Sequência das parcelas de 2 até a quantidade declarada, sem repetição ou lacuna, limitada a 120 parcelas.
- Primeira parcela vinculada ao ato da matrícula, sem gerar sua data.
- Valores positivos, datas válidas e em ordem crescente.
- Compatibilidade entre referência mensal e vencimento, quando a referência aparece.
- Concordância dos valores com o da primeira parcela quando o texto declara parcelas iguais.

Linhas fora do formato, datas inválidas, quantias ausentes, sequência incompleta ou valores incompatíveis impedem o estado auxiliar `formato_conferido`. Linhas quebradas não são reconstruídas por suposição. Continuação entre páginas é preservada em fragmentos literais separados.

`formato_conferido` significa somente que essas verificações passaram. Não confirma autenticidade, escolha do plano, completude contratual, extenso da quantidade, soma da semestralidade ou regularidade jurídica. Essa conferência nunca promove, sozinha, os três campos de pagamento a encontrados.

## Associação e proteção de contexto

As alternativas são reconhecidas por formas explícitas: à vista ou em parcelas; preços para estudantes/profissionais; opções complementares com parcelamento e desconto. O contexto precisa apresentar referências escolares suportadas. Menção isolada à matrícula de um imóvel ou ao curso de uma execução não basta.

Opções claramente vinculadas apenas à taxa de adesão/matrícula, material didático ou segunda via são excluídas dessa triagem quando não há referência principal no prefixo. Isso não representa classificação geral de todos os encargos. Os demais filtros de valor do extrator continuam em vigor.

A evidência da opção é recortada por item/parágrafo, incluindo continuação entre páginas. A saída oficial também pode conservar candidatos e pendências anteriores com contexto mais amplo; eles não são descartados para fazer a evidência parecer resolvida. Divergências de extenso e extensos não suportados mantêm prioridade no motivo do campo de valor.

## Diagnóstico auxiliar

O módulo local `pagamentos_escolares.py` fornece os grupos de opções, evidências e linhas conferidas, sem rede. Na rodada de validação, cada documento recebeu um arquivo `opcoes-pagamento.json`, identificado como diagnóstico auxiliar e vinculado ao hash do PDF.

Esse arquivo não substitui `resultado.json`, não altera o esquema 1.0.0 e não é gabarito. As páginas e os trechos das linhas foram conferidos literalmente. A produção desse arquivo auxiliar pertence à rotina da rodada; o comando normal do extrator continua entregando o registro oficial dos cinco campos.

## Validação

**276 testes Python + 27 Node = 303 aprovados.** As 18 saídas passaram na validação do esquema e localização literal das evidências. Dezesseis PDFs concluíram o processamento; as duas falhas anteriores de leitura continuam registradas.

**84/90 objetos de campo ficaram idênticos à 0.1.23.** Apenas valor, quantidade e vencimento de edu-04/edu-07 passaram de não identificados para ambíguos. O lote tem 15 campos encontrados, 52 não identificados, 13 ambíguos e dez com erro de leitura. Esses estados não medem taxa de acerto.

Os hashes dos 18 PDFs foram conferidos com os catálogos. Evidências dos diagnósticos auxiliares, inclusive cada linha de tabela, também foram localizadas na página física informada.

Dezesseis testes novos cobrem opções sem escolha, perfis, matrícula, tabela válida, data inválida, referência divergente, valores diferentes, sequência repetida/faltante, ordem temporal, primeira parcela sem evento, continuação, linha quebrada, contexto não escolar, encargos isolados e prioridade da divergência por extenso. Casos novos reproduziram falhas antes da integração e do filtro de encargos.

## Próximo passo e progresso

Próximo: cronogramas de financiamento por fase, começando pelas relações entre carência, amortização, liberação e ajuste por dia útil, sem inventar datas. Nível recomendado: **Alto**. Alternativas ainda não vinculadas a um plano e formatos escolares não suportados permanecem limitações conhecidas.

Entrega: **100% (3/3: diagnóstico/testes, implementação, regressão/documentação)**. Experimento original: **29% (2/7 etapas)**. A avaliação independente permanece separada do desenvolvimento assistido autorizado.

## Artefatos e limites

Rodada final na C:, fora do Git: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0124-final-20261020-d569b4`.

A rodada anterior à proteção de encargos, `E04-lote-0124-final-20261020-6bedee`, também foi preservada na C:. A rodada final contém fontes, catálogos, resultados brutos, diagnósticos auxiliares, páginas, erros, comparação e logs com hashes.

Sem acesso aos dez documentos reservados, mudança de referências assistidas, API de IA, integração ao aplicativo ou deploy. Este é um avanço do protótipo local, não uma promessa de extração automática de qualquer contrato escolar.
