# Protocolo de extração de contratos — 1.0.0

Definido em **13/10/2026**, antes da implementação e da avaliação. Etapa E01; GPT-6 recomendado: **Alto**. As decisões abaixo são o ponto de partida do experimento, não afirmações sobre precisão já alcançada.

## 1. Pergunta e limites

Verificar se regras locais conseguem extrair cinco campos financeiros de contratos em português com evidência suficiente para auxiliar um preenchimento revisado por uma pessoa.

- Entrada inicial: PDF com camada de texto, obrigações em reais. Categorias: financiamento, aluguel, mensalidade escolar e plano de saúde.
- Saída: JSON com metadados e exatamente cinco campos financeiros. Cada campo tem valor estruturado, estado, evidências, confiança e identificação da regra.
- Sem interpretação jurídica, consulta de índices, cálculo de juros, previsão inventada, criação de contas ou pagamentos.
- Sem interface, autenticação, banco, chamadas de IA ou integração com o produto.
- OCR não integra a primeira versão. PDFs mistos, digitalizados, protegidos, danificados ou sem texto útil devem gerar resultado/erro registrado, não desaparecer do lote. O gabarito humano pode continuar sendo legível visualmente mesmo sem camada de texto.
- Não escolher silenciosamente entre várias obrigações independentes. Na ausência de uma obrigação principal explícita, marcar os campos afetados como ambíguos. Anexos ausentes e modelos com lacunas não autorizam preencher valores.

## 2. Definição dos cinco campos

| Campo JSON | Conteúdo e normalização | O que não presumir |
|---|---|---|
| `valor_parcela` | `tipo` fixo ou variável; `moeda: BRL`; `quantia` como string decimal de duas casas para valor fixo; `regra` literal para valor variável. Valor fixo zero só se explícito. | Não confundir entrada, caução, total, multa ou desconto condicional com parcela regular. Não calcular parcela dividindo total por quantidade. |
| `numero_parcelas` | `tipo: determinado` e inteiro positivo, ou `tipo: indeterminado` com quantidade nula se isso estiver explícito. | Ausência de quantidade não significa prazo indeterminado. Não converter automaticamente duração em parcelas. |
| `data_vencimento` | `tipo: data_unica` com `data` ISO; `mensal` com `dia` de 1 a 31; ou `outra_regra` com trecho literal, inclusive vencimentos relativos e dia útil. | Não inventar mês/ano a partir de “dia 10”; não reduzir “5º dia útil” ao dia 5. Não ajustar vencimentos automaticamente. |
| `vigencia` | `prazo` determinado, indeterminado ou não informado; datas ISO de início/fim e duração explícita em meses, quando presentes. `regra` preserva condição ou renovação expressa. | Não equiparar assinatura, entrega, carência ou início de cobrança ao início da vigência. Não calcular data final ausente. |
| `regra_reajuste` | `tipo` índice, percentual fixo, sem reajuste ou outra regra; lista de índices; percentual em string de duas casas; periodicidade explícita em meses; `regra` com a cláusula literal completa pertinente. | Não confundir juros/multa com reajuste; não reduzir regra alternativa a um único índice; ausência de cláusula não significa “sem reajuste”. |

Para `vigencia`, pelo menos uma informação deve estar explícita. Se só a data inicial existir, `prazo` será `nao_informado`, início preenchido e os demais componentes desconhecidos nulos. Para duração em dias ou eventos condicionais, preservar a expressão em `regra`, sem conversão arbitrária para meses.

Regras para parcelas variáveis devem preservar a sequência/condições em `regra`, sem escolher o menor valor. Alternativas de índices ficam em `indices` e sua relação na cláusula literal. Campos complexos parcialmente capturados não recebem acerto completo nem confiança alta.

## 3. Estados e evidências

| Extrator | Gabarito humano | Significado |
|---|---|---|
| `encontrado` | `presente` | Resposta identificável com evidência; objeto `valor` preenchido. |
| `nao_identificado` | `ausente` | Extrator não encontrou resposta; no gabarito, ausência somente após leitura humana. Não são afirmações equivalentes. |
| `ambiguo` | `ambiguo` | Leituras concorrentes ou informação insuficiente para uma resposta única. Valor nulo, motivo e trechos candidatos quando legíveis. |
| `erro_leitura` | `ilegivel` | Extrator falhou na leitura, ou pessoa não conseguiu estabelecer o gabarito. Valor nulo e motivo. |

Cada evidência contém `pagina` (posição física do PDF, começando em 1) e `trecho` copiado. Não usar numeração impressa de cláusulas como página. Anotar valores presentes somente com ao menos uma evidência. Campos vazios usam `null`, nunca zero, string vazia ou data fictícia.

Estados não respondidos usam confiança `nao_aplicavel`. Gabarito usa confiança `nao_aplicavel` e `regra_id: null` em todos os campos: não herda confiança do algoritmo. Extrações respondidas exigem `regra_id` versionada. `motivo` explica omissões, ambiguidade ou erro sem incluir segredo ou caminho pessoal.

## 4. Confiança antes de observar o teste

Confiança é uma classificação por regras, **não uma probabilidade calibrada**. Nunca preencher “95%” sem calibração independente.

- **Alta:** informação explícita na cláusula/linha pertinente; resposta única ou ocorrências equivalentes; objeto completo quanto aos dados explícitos relevantes; normalização direta válida; evidências para os componentes; nenhuma condição relevante omitida, conflito ou lacuna de leitura nas páginas pertinentes.
- **Média:** existe um candidato sustentado por evidência, mas sua associação à obrigação depende de contexto ou há dúvida de completude. Registrar a limitação no motivo.
- **Baixa:** candidato plausível sem associação suficiente; é uma previsão avaliada normalmente, não uma exclusão de erros. Valores sem evidência nunca podem ser retornados nem mesmo nesta faixa.
- **Abstenção:** conflito sem resolução, texto ilegível ou nenhum candidato defensável → valor nulo e estado apropriado, não uma previsão de baixa confiança.

Repetição do mesmo valor não cria confiança por si só. Uma falha em ler outra página pode esconder uma alteração contratual; não atribuir alta confiança enquanto houver essa incerteza. Fixar as regras de classificação antes do lote reservado.

## 5. Amostra e separação dos documentos

Meta exploratória: **40 documentos, dez por categoria**. Isso não é amostra suficiente para alegar confiabilidade geral ou ausência de erros raros.

- Inventário por documento: ID anônimo, SHA-256 do PDF, categoria, origem pública/real, fonte e data de obtenção, família do modelo, tipo texto/digitalizado/misto, páginas e divisão desenvolvimento/teste.
- Buscar diversidade de origem, redação, tabelas e casos ausentes/ambíguos. Modelos em branco são identificados no inventário; não substituem todos os exemplos preenchidos.
- Destinar aproximadamente 60% ao desenvolvimento e 40% ao teste, buscando ambas as divisões em cada categoria. **Famílias do mesmo modelo ficam juntas**, inclusive cópias com nomes/valores diferentes. Ajustar contagens à divisão por família e relatar números reais.
- Congelar manifesto da divisão e seus hashes antes de implementar regras. Duplicatas exatas não contam como documentos independentes.
- Usar desenvolvimento para ajustar regras e casos sintéticos para testar formato. O conjunto reservado só é aberto ao extrator após congelar código, regras e protocolo.
- Documento de teste usado depois para corrigir regras deixa de ser teste inédito; registrar nova rodada e obter novos documentos/famílias para nova avaliação final.
- Não excluir falhas após conhecer resultados. Reportar todas as entradas e separar estratos: PDFs com texto no escopo inicial versus digitalizados, protegidos ou outros casos não suportados.

Documentos reais, gabaritos, trechos e saídas ficam fora do Git em `data/` e `runs/`. Usar cópias sem dados pessoais quando houver compartilhamento. A identificação do responsável pela anotação pode ser um código, sem nome completo.

## 6. Gabarito independente

1. Uma pessoa lê o documento original e registra cada campo, estado, página e trecho sem consultar a saída do protótipo.
2. Uma segunda pessoa revisa, preferencialmente todo o conjunto reservado. Quando isso não for possível, registrar quantos campos tiveram revisão única e tratar isso como limitação.
3. Divergências ficam registradas e são resolvidas antes da pontuação. As que persistirem ficam como ambíguas; nunca substituir automaticamente pelo resultado do programa.
4. Congelar versão e hash dos gabaritos antes da execução final. Correção posterior exige motivo, nova versão e recálculo integral, preservando arquivos anteriores.

GPT pode auxiliar na organização e na validação estrutural; não é o anotador de referência. Os exemplos sintéticos desta pasta foram criados para especificar o formato e **não constituem gabarito humano nem evidência de desempenho**.

## 7. Comparação e tolerâncias fixadas

Comparar o objeto `valor` inteiro de cada campo, e não apenas uma palavra ou número que coincida. Metadados, confiança, motivo e evidências não entram na igualdade do valor; verificar evidências separadamente por revisão humana. A ordem das chaves JSON não importa.

- Dinheiro: string decimal com duas casas, comparação em centavos; acerto exato exige diferença zero. Medida tolerante adicional permite **até R$ 0,01**, mantendo moeda, tipo e todos os demais componentes iguais. Essa tolerância é analítica e não autoriza lançamento financeiro divergente.
- Datas: `AAAA-MM-DD`, data real; **tolerância zero dias**. Dia mensal, quantidade de parcelas, duração e periodicidade exigem igualdade inteira. Não converter formatos ambíguos por suposição.
- Percentuais: duas casas decimais, comparação exata; `5%` normaliza para `5.00`. Mais precisão explícita fica preservada em `outra_regra`, sem arredondar para inventar correspondência.
- Índices: normalizar os aliases da tabela abaixo; outros nomes passam por normalização textual. Ordenar a lista e remover repetições para comparar, preservando condições na cláusula. A correspondência é por nome completo, nunca por substring (IPCA-E não vira IPCA).
- Texto literal em `regra`: Unicode NFC, minúsculas e espaços consecutivos/quebras reduzidos a um espaço. Preservar números, sinais e pontuação. Sem comparação semântica, remoção de negações ou aceitação por “parece equivalente”.
- Datas/valores calculados não são equivalentes a informação expressa. Campos ausentes não podem ser premiados por um valor inventado plausível.

Precisão/revocação principais usam a comparação exata. A versão tolerante é publicada separadamente e usa somente a tolerância monetária acima. A avaliação é estrita, especialmente para cláusulas textuais; exemplos equivalentes rejeitados serão analisados qualitativamente sem mudar o critério após ver o teste.

| Nome canônico | Aliases aceitos, sem distinção de maiúsculas |
|---|---|
| `IPCA` | IPCA; Índice Nacional de Preços ao Consumidor Amplo |
| `IGP-M` | IGP-M; IGP M; IGPM; Índice Geral de Preços - Mercado; Índice Geral de Preços do Mercado |
| `INPC` | INPC; Índice Nacional de Preços ao Consumidor |

Aplicar NFC e normalização de espaços antes da consulta à tabela. Novos aliases devem ser definidos no desenvolvimento e versionados antes do teste final.

## 8. Métricas e denominadores

Unidade: **um documento × um dos cinco campos**. Calcular por campo, categoria, formato do PDF e conjunto. Resultado de desenvolvimento nunca se mistura ao teste final.

Para cada campo, universo decidível `D` = documentos cujo gabarito é presente ou ausente. `G` = presentes no gabarito. `P` = previsões com `encontrado` e valor estruturalmente válido dentro de `D`.

- `TP`: previsão corresponde exatamente ao valor presente no gabarito.
- `FP`: previsão preenchida incorreta ou preenchida quando o campo é ausente.
- `FN`: campo presente no gabarito não extraído corretamente, inclusive resposta errada, abstenção ou falha de leitura.
- `A`: gabarito ausente e extrator `nao_identificado`, sem falha de leitura.

Uma resposta errada para um campo presente soma **um FP e um FN**. Uma falha de leitura em campo ausente não recebe acerto de ausência.

| Medida | Fórmula | Interpretação |
|---|---|---|
| Acerto exato | `(TP + A) / D` | Acerto de conteúdo ou ausência correta. Mostrar presentes/ausentes separadamente para não inflar resultado por documentos vazios. |
| Acerto tolerante | Mesma fórmula, recalculando correspondências pela tolerância monetária | Publicar ao lado do exato, nunca substituí-lo. |
| Precisão | `TP / (TP + FP)` | Proporção de respostas preenchidas corretas. |
| Revocação | `TP / (TP + FN)` | Proporção dos valores identificáveis recuperados corretamente. |
| Não identificados | Presentes no gabarito com abstenção, omissão ou erro de leitura `/ G` | Respostas preenchidas erradas ficam fora deste numerador, pois já são erro de extração. |
| Erro com alta confiança | Previsões erradas de confiança alta `/` previsões de confiança alta em `D` | Avaliar por campo; usar correspondência exata mesmo quando existir resultado tolerante. |

Todo percentual deve apresentar numerador/denominador. Denominador zero → `null` e rótulo **não aplicável**, nunca 0%. Mostrar também quantidade e cobertura das previsões de alta confiança; não chamar uma faixa segura apenas porque retornou poucas respostas.

Gabaritos ambíguos/ilegíveis não entram em `D` por falta de resposta única. **Continuam no relatório**, com contagem por estado, total excluído da pontuação de conteúdo e quantidade de respostas assertivas/alta confiança sobre esses casos. Alta confiança nesses casos é sinal de risco, não erro exato mensurável sem gabarito resolvido.

Falhas completas do script permanecem no denominador dos campos presentes/ausentes conhecidos: registrar abstenção por erro nos cinco campos para a avaliação, mantendo a saída bruta original. JSON inválido é falha de contrato de saída: não aproveitar seletivamente partes corretas; avaliar como cinco abstenções e contabilizar o erro de formato. Esse registro derivado não substitui a saída bruta.

Publicar número de PDFs processados, falhas completas, parciais e JSONs inválidos, e duração por documento. Para resumo global, somar contagens (micro); não tirar média simples de percentuais de grupos de tamanhos diferentes. Resultados por campo continuam obrigatórios.

Exemplo de conferência: quatro gabaritos presentes e um ausente; duas respostas corretas, uma errada, uma omitida e uma ausência correta → TP=2, FP=1, FN=2, A=1; acerto=3/5; precisão=2/3; revocação=2/4; omissão=1/4. Se uma correta e a errada forem alta confiança, erro nessa faixa=1/2. Os [casos sintéticos](examples/casos-avaliacao.json) guardam essas contagens para E06.

Referência conceitual para precisão/revocação em extração: [avaliação de documentos](https://docs.cloud.google.com/document-ai/docs/evaluate). Não usaremos esse serviço para executar o experimento.

## 9. Execução reproduzível e arquivos

Cada rodada futura terá diretório próprio em `runs/`, com manifesto, versões/hashes de código, regras, protocolo, esquema, PDFs e gabarito; parâmetros de execução, ambiente e horário com fuso; texto por página; stdout/JSON bruto, stderr e código de saída; duração e registro derivado para avaliação. Cada PDF terá um resultado, mesmo em falha.

Nunca sobrescrever rodada anterior. Erros usam códigos estáveis (por exemplo, `PDF_PROTEGIDO`, `SEM_CAMADA_TEXTO`, `PDF_INVALIDO`, `FALHA_PARCIAL`, `JSON_INVALIDO`) e mensagens sem informações pessoais desnecessárias.

O [esquema](registro.schema.json) verifica estrutura e combinações básicas. Validação semântica futura deve verificar datas reais, ordem início/fim quando ambos existirem, páginas dentro do PDF, trechos presentes na página, hashes, coerência de cláusulas e regras de confiança. Passar no esquema não comprova correção do conteúdo.

## 10. Decisão após o piloto e controle de mudanças

- Nesta versão, nenhum resultado pode criar obrigação financeira automaticamente, independentemente das métricas.
- E07 decidirá por campo entre: continuar pesquisa; oferecer apenas sugestão revisável; ou avaliar OCR em novo experimento.
- Sem meta artificial de aprovação: reportar desempenho com contagens, diversidade da amostra e limitações. Zero erros observados não prova ausência de risco.
- Erros de alta confiança precisam de inspeção individual e podem motivar rebaixamento da regra em nova versão, sempre antes de uma nova avaliação reservada.
- Alterar campos, tolerâncias, divisão, critérios de confiança ou contagem de métricas exige nova versão deste protocolo e registro da razão. Preservar a 1.0.0 usada em cada rodada.

## Entrega E01

Conclui quando protocolo, esquema, exemplos sintéticos e casos esperados estiverem coerentes, com validação do formato e atualização do Kanban. Coleta real (E02), gabarito humano (E03), extrator (E04), execução (E05), métricas observadas (E06) e conclusão experimental (E07) continuam pendentes.

**Verificação em 13/10/2026:** esquema compilado com AJV e validação de formatos; 18 cenários estruturais aprovados, incluindo exemplos válidos, campos ausentes/extras, data impossível, valor sem evidência, ausência com valor e falha completa. Quatro casos de contagens esperadas foram recalculados e os trechos dos exemplos conferidos contra o texto fictício. Não foram executados testes da aplicação nem extração de contratos.
