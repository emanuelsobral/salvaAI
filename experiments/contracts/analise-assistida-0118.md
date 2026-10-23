# Análise assistida e correção 0.1.18

Data de conclusão: 19/10/2026.

O usuário solicitou continuar sem uma pessoa analisando. Esta rodada é diagnóstico de desenvolvimento assistido por IA. A referência anterior foi preservada integralmente, sem ser promovida a gabarito independente. Não há pontuação de precisão, revocação ou acurácia real.

## Comparação de pub-alu-02

Foram inspecionadas visualmente as páginas físicas 1, 2, 3, 4, 10, 11 e 12, junto com os textos e as saídas. Isso não é revisão jurídica nem anotação independente.

| Campo | Comparação e limites observados |
|---|---|
| Valor | O valor mensal coincide entre a referência e o extrator. A ressalva de reajuste fica nas evidências. |
| Parcelas | O extrator se abstém e a referência registra ausência de quantidade expressa. A tabela em meses não foi convertida em quantidade de pagamentos. |
| Vencimento | A regra relativa coincide no evento e prazo. O extrator inclui instruções adicionais da nota fiscal na página 2, mas não reúne todas as condições de pagamento continuadas na página 3. A referência também não as reúne. Não tratar coincidência do prazo como completude. |
| Vigência | Duração e dependência da assinatura coincidem. Datas de início/fim ficam nulas. A referência limita-se à cláusula principal; o PDF inclui condições acessórias na página 10. O extrator preserva condição de reconstrução e rescisão, mas a rodada anterior copiava também foro, rodapé e itens não pertinentes. A 0.1.18 corrige esse excesso; completude das demais condições ainda não foi demonstrada. |
| Reajuste | IVAR e intervalo mínimo anual coincidem. A referência inclui revisão excepcional da página 4, omitida pelo extrator. A referência e a saída também diferem na extensão e grafia das transcrições. INPC para atraso está na página 3 e não foi incorporado ao reajuste periódico. |

A igualdade semântica de partes de uma resposta não equivale à igualdade completa das regras segundo o protocolo. A referência assistida pode conter omissões; ela não foi usada como verdade absoluta.

## Correção aplicada

1. Separação da variante gráfica de título CLÁSULA para não agregar a cláusula de foro à anterior.
2. Remoção do par terminal de linhas de autenticação da evidência de vigência, preservando substrings literais. Quando houver conteúdo posterior, não cortar a página por esse padrão.
3. Recorte de subitens acessórios somente quando o prefixo consiste em um título sem condição e não há remissão explícita a outros itens. Introduções, hipóteses, requisitos e remissões conservam o bloco completo. A rescisão por descumprimento permanece no resultado.

A primeira tentativa de segmentação foi ampla demais e mudou contexto em contratos escolares/saúde. A rodada intermediária foi preservada; a regra final foi restringida e recebeu testes de regressão.

## Validação

- 193 testes Python e 27 Node aprovados: 220 no total, incluindo nove novos testes Python.
- 18 documentos de desenvolvimento: 16 processados e duas falhas de leitura preservadas (sau-04 e sau-05).
- 18 resultados validados no esquema e na localização literal das evidências.
- 89/90 objetos de campo idênticos à 0.1.17. Única diferença: regra/evidências de vigência de pub-alu-02; estado, duração, início e fim preservados.
- Nenhum documento reservado de teste utilizado. Nenhuma API de IA, alteração em dados financeiros ou deploy.

## Continuidade sem revisão humana

A próxima entrega técnica é preservar condições de pagamento entre páginas e revisão excepcional de preços sem confundi-las com vencimento comum/reajuste periódico. Usar casos fictícios para reproduzir falhas e o lote de desenvolvimento para regressão. Toda comparação com a referência atual permanece exploratória e assistida.

O protocolo 1.0.0 permanece congelado. Suas etapas de anotação e avaliação independentes não estão concluídas e não bloqueiam esta trilha de desenvolvimento. O pacote vazio para outra pessoa continua arquivado, sem ser requisito para o próximo trabalho autorizado.

Progresso desta entrega: 3/3 blocos (100%: diagnóstico, correção, regressão/documentação). Experimento original: 2/7 etapas (29%). Esses denominadores medem coisas diferentes; nenhum mede precisão do extrator.

## Artefatos locais (fora do Git)

- Diagnóstico e referência preservada: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/analise-assistida-20261018-51ba5c`.
- Regressão final: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0118-final-20261019-f4b1e4`.
- Tentativa intermediária: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0118-9b1820`.
