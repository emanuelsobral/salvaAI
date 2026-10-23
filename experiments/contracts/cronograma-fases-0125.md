# Diagnóstico de cronogramas por fase — 0.1.25

**23/10/2026.** O comando de extração agora salva um diagnóstico auxiliar das condições de financiamento, separado dos cinco campos oficiais. Ele organiza referências a carência, amortização, ausência de carência e deslocamento para dia útil, com evidências por página.

## O que foi entregue

- Condições mantidas em registros separados, sem fundir cláusulas ou escolher uma fase aplicável.
- Distinção entre liberação de recursos, emissão e término da carência como eventos referidos.
- Associação restrita de periodicidade à fase adjacente em cláusulas de exigibilidade. Cálculo e capitalização não são tratados como cobrança.
- Reconhecimento de prazo da primeira prestação de juros após liberação, no formato suportado. Quando há número e extenso juntos, eles precisam concordar.
- Dependências explícitas de quadros, eventos, aplicabilidade e calendário de dias úteis, sem resolvê-las por suposição.
- Diagnóstico bloqueado quando a leitura do PDF é parcial ou falha, mesmo que alguma página esteja legível.

As categorias são etiquetas dos recortes reconhecidos, não confirmação de que a fase se aplica ao contrato. As evidências continuam necessárias para interpretar condições como a existência de carência. O diagnóstico conserva `completude: nao_avaliada` e `calendario_gerado: false`.

## Comportamento no lote de desenvolvimento

| Documento | Diagnóstico auxiliar |
|---|---|
| fin-01 | Seis recortes candidatos ligados à amortização, incluindo remissões a quadros. |
| fin-04 | Três recortes: amortização, carência e dia útil. Prazo de 30 dias após liberação reconhecido como relativo; nenhuma data criada. |
| fin-05 | Sete recortes com condições de carência, amortização, ausência de carência e dia útil. Uma cláusula permite associar periodicidades trimestral e mensal às respectivas fases. |
| Demais documentos legíveis | Nenhuma condição no formato suportado; isso não comprova ausência de condições financeiras. |
| sau-04 e sau-05 | Diagnóstico não executado devido às falhas de leitura já conhecidas. |

**Os 90 objetos dos cinco campos oficiais ficaram idênticos à 0.1.24.** O avanço desta versão é tornar o diagnóstico de dependências inspecionável e disponível no comando normal. Não se promove um vencimento parcial a encontrado.

## Arquivos produzidos

O comando normal continua imprimindo somente o JSON oficial no terminal. Na pasta da rodada, acrescenta `cronograma-financiamento.json`, com identificador, hash do PDF, versão do extrator e indicação de diagnóstico auxiliar. Cada condição contém categorias, eventos, periodicidades/prazos reconhecidos, dependências e evidências literais.

O manifesto inclui o hash desse arquivo e dos módulos de regras que antes não estavam todos relacionados. A gravação usa quebras de linha explícitas para que o hash corresponda aos bytes salvos também no Windows. O teste do comando verifica essa correspondência.

`resultado.json`, `paginas.json`, `stderr.log` e `manifesto.json` continuam preservados. O esquema oficial e o protocolo 1.0.0 permanecem inalterados. O diagnóstico não é gabarito nem avaliação de acerto.

## Limites

O reconhecimento usa regras locais e formatos restritos. Prazo numérico relativo admite de 1 a 366 dias, opcionalmente acompanhado de extenso compatível; outras formas ficam apenas no trecho literal. Não interpreta datas de liberação, tabelas de financiamento, feriados, parcelas escolhidas, conflitos entre cláusulas ou cronograma completo.

As referências a carência e amortização podem coexistir no mesmo recorte. Isso não autoriza transferir uma frequência para a outra fase. Frequências concorrentes permanecem separadas. Formas não suportadas e trechos que misturam cálculo e cobrança podem manter a periodicidade vazia.

A evidência é recortada por página e sentença/parágrafo. Não há reconstrução automática de uma sentença partida entre páginas. A verificação literal garante procedência do trecho, não a correção de sua interpretação financeira.

## Validação

**300 testes Python + 27 Node = 327 aprovados.** São 24 testes novos em relação à 0.1.24, incluindo evidências inválidas, negação, frequência de cálculo, opções sem carência, extenso divergente, leitura parcial, arquivo auxiliar e integridade dos hashes.

As 18 saídas passaram na validação do esquema e localização literal das evidências. Dezesseis PDFs concluíram o processamento e dois permaneceram com falha de leitura. O lote mantém 15 campos encontrados, 52 não identificados, 13 ambíguos e dez com erro de leitura. Esses números não são métricas de acerto.

Os hashes dos PDFs foram conferidos com os catálogos. As evidências dos diagnósticos de financiamento e das opções escolares também foram verificadas. Os dez documentos reservados não foram processados.

Rodada final na C:, fora do Git: `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/contracts/E04-lote-0125-final-20261023-5b9a8b`.

A rodada intermediária `E04-lote-0125-final-20261023-d2953e` foi preservada; antecede o suporte às vírgulas e ao pagador explícito. Ambas mantêm fontes, resultados, páginas, erros e verificações. O nome da pasta intermediária não a torna a versão final desta entrega.

## Próximo passo e progresso

Próximo: piloto de OCR local nos dois contratos de desenvolvimento sem texto, mantendo a saída OCR separada da camada original e sem uso de API. Nível recomendado: **Alto**. Resolução de quadros, calendários, planos escolhidos e reajustes por objeto permanece pendente.

**Entrega: 100% (3/3 blocos). Experimento original: 29% (2/7 etapas).** O percentual do experimento depende de etapas de coleta e avaliação independente ainda não concluídas; não representa acurácia nem o avanço global do SalvaAI.
