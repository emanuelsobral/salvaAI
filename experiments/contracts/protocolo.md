# Protocolo de extração de contratos 1.0.0

Definido em 13/10/2026, antes da implementação e da avaliação. Este protocolo especifica os campos extraídos e como avaliar os resultados. A precisão alcançada precisa ser medida separadamente.

## 1. Pergunta e limites

O experimento verifica se regras locais conseguem extrair cinco campos financeiros de contratos em português, com evidências que permitam a uma pessoa conferir o preenchimento.

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

As regras classificam a confiança da resposta. Essa classificação não é uma probabilidade calibrada; informar "95%" exige calibração independente.

| Classificação | Critérios |
|---|---|
| Alta | Informação explícita na cláusula ou linha pertinente, com resposta única ou ocorrências equivalentes. O objeto inclui todos os dados explícitos relevantes, normalização direta válida e evidências dos componentes. Não há condição relevante omitida, conflito ou lacuna de leitura nas páginas pertinentes. |
| Média | Há um candidato sustentado por evidência, mas a associação à obrigação depende do contexto ou existe dúvida de completude. A limitação precisa constar no motivo. |
| Baixa | O candidato é plausível, mas a associação é insuficiente. A previsão continua sujeita à avaliação de erros. Valores sem evidência não podem ser retornados, mesmo nesta faixa. |
| Abstenção | Há conflito sem resolução, texto ilegível ou nenhum candidato defensável. Retornar valor nulo e o estado apropriado, sem preencher uma previsão de baixa confiança. |

Repetição do mesmo valor não cria confiança por si só. Uma falha em ler outra página pode esconder uma alteração contratual; não atribuir alta confiança enquanto houver essa incerteza. Fixar as regras de classificação antes do lote reservado.

## 5. Amostra e separação dos documentos

A meta exploratória é de 40 documentos, dez por categoria. Essa amostra não basta para demonstrar confiabilidade geral ou ausência de erros raros.

- Inventário por documento: ID anônimo, SHA-256 do PDF, categoria, origem pública/real, fonte e data de obtenção, família do modelo, tipo texto/digitalizado/misto, páginas e divisão desenvolvimento/teste.
- Buscar diversidade de origem, redação, tabelas e casos ausentes/ambíguos. Modelos em branco são identificados no inventário; não substituem todos os exemplos preenchidos.
- Destinar aproximadamente 60% ao desenvolvimento e 40% ao teste, buscando ambas as divisões em cada categoria. Famílias do mesmo modelo ficam juntas, inclusive cópias com nomes/valores diferentes. Ajustar contagens à divisão por família e relatar números reais.
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

GPT pode ajudar a organizar arquivos e validar a estrutura, mas a referência deve vir da anotação humana independente. Os exemplos sintéticos especificam o formato; não servem como gabarito humano ou evidência de desempenho.

## 7. Comparação e tolerâncias fixadas

Compare o objeto `valor` inteiro de cada campo. Uma palavra ou um número coincidente não basta. Metadados, confiança, motivo e evidências ficam fora dessa comparação; as evidências exigem revisão humana separada. A ordem das chaves JSON não importa.

- Dinheiro: string decimal com duas casas, comparação em centavos; acerto exato exige diferença zero. Medida tolerante adicional permite até R$ 0,01, mantendo moeda, tipo e todos os demais componentes iguais. Essa tolerância é analítica e não autoriza lançamento financeiro divergente.
- Datas: `AAAA-MM-DD`, data real; tolerância zero dias. Dia mensal, quantidade de parcelas, duração e periodicidade exigem igualdade inteira. Não converter formatos ambíguos por suposição.
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

A unidade de avaliação é um documento × um dos cinco campos. Calcule os resultados por campo, categoria, formato do PDF e conjunto. Mantenha os resultados de desenvolvimento separados do teste final.

Para cada campo, universo decidível `D` = documentos cujo gabarito é presente ou ausente. `G` = presentes no gabarito. `P` = previsões com `encontrado` e valor estruturalmente válido dentro de `D`.

- `TP`: previsão corresponde exatamente ao valor presente no gabarito.
- `FP`: previsão preenchida incorreta ou preenchida quando o campo é ausente.
- `FN`: campo presente no gabarito não extraído corretamente, inclusive resposta errada, abstenção ou falha de leitura.
- `A`: gabarito ausente e extrator `nao_identificado`, sem falha de leitura.

Uma resposta errada para um campo presente soma um FP e um FN. Uma falha de leitura em campo ausente não recebe acerto de ausência.

| Medida | Fórmula | Interpretação |
|---|---|---|
| Acerto exato | `(TP + A) / D` | Acerto de conteúdo ou ausência correta. Mostrar presentes/ausentes separadamente para não inflar resultado por documentos vazios. |
| Acerto tolerante | Mesma fórmula, recalculando correspondências pela tolerância monetária | Publicar ao lado do exato, nunca substituí-lo. |
| Precisão | `TP / (TP + FP)` | Proporção de respostas preenchidas corretas. |
| Revocação | `TP / (TP + FN)` | Proporção dos valores identificáveis recuperados corretamente. |
| Não identificados | Presentes no gabarito com abstenção, omissão ou erro de leitura `/ G` | Respostas preenchidas erradas ficam fora deste numerador, pois já são erro de extração. |
| Erro com alta confiança | Previsões erradas de confiança alta `/` previsões de confiança alta em `D` | Avaliar por campo; usar correspondência exata mesmo quando existir resultado tolerante. |

Apresente numerador e denominador junto de cada percentual. Quando o denominador for zero, use `null` e o rótulo "não aplicável", nunca 0%. Mostre também a quantidade e a cobertura das previsões de alta confiança. Poucas respostas não bastam para considerar uma faixa segura.

Gabaritos ambíguos ou ilegíveis ficam fora de `D` por não terem resposta única. Eles continuam no relatório, com contagem por estado, total excluído da pontuação de conteúdo e quantidade de respostas assertivas ou de alta confiança. A alta confiança nesses casos sinaliza risco; sem gabarito resolvido, não permite medir um erro exato.

Falhas completas do script permanecem no denominador dos campos presentes/ausentes conhecidos: registrar abstenção por erro nos cinco campos para a avaliação, mantendo a saída bruta original. JSON inválido é falha de contrato de saída: não aproveitar seletivamente partes corretas; avaliar como cinco abstenções e contabilizar o erro de formato. Esse registro derivado não substitui a saída bruta.

Publicar número de PDFs processados, falhas completas, parciais e JSONs inválidos, e duração por documento. Para resumo global, somar contagens (micro); não tirar média simples de percentuais de grupos de tamanhos diferentes. Resultados por campo continuam obrigatórios.

Exemplo: com quatro gabaritos presentes e um ausente, duas respostas corretas, uma errada, uma omitida e uma ausência correta produzem TP=2, FP=1, FN=2 e A=1. O acerto é 3/5; a precisão, 2/3; a revocação, 2/4; e a omissão, 1/4. Se uma resposta correta e a errada tiverem alta confiança, o erro nessa faixa será 1/2. Os [casos sintéticos](examples/casos-avaliacao.json) registram essas contagens para conferir o avaliador.

Referência conceitual para precisão/revocação em extração: [avaliação de documentos](https://docs.cloud.google.com/document-ai/docs/evaluate). Não usaremos esse serviço para executar o experimento.

## 9. Execução reproduzível e arquivos

Cada rodada deve ter um diretório próprio em `runs/`. Guarde manifesto, versões e hashes do código, regras, protocolo, esquema, PDFs e gabarito. Registre também parâmetros, ambiente, horário com fuso, texto por página, stdout/JSON bruto, stderr, código de saída, duração e resultado derivado para avaliação. Cada PDF deve ter um resultado, inclusive quando a leitura falhar.

Nunca sobrescrever rodada anterior. Erros usam códigos estáveis (por exemplo, `PDF_PROTEGIDO`, `SEM_CAMADA_TEXTO`, `PDF_INVALIDO`, `FALHA_PARCIAL`, `JSON_INVALIDO`) e mensagens sem informações pessoais desnecessárias.

O [esquema](registro.schema.json) verifica estrutura e combinações básicas. Validação semântica futura deve verificar datas reais, ordem início/fim quando ambos existirem, páginas dentro do PDF, trechos presentes na página, hashes, coerência de cláusulas e regras de confiança. Passar no esquema não comprova correção do conteúdo.

## 10. Decisão após o piloto e controle de mudanças

- Nesta versão, nenhum resultado pode criar obrigação financeira automaticamente, independentemente das métricas.
- A conclusão do piloto decidirá por campo entre continuar a pesquisa, oferecer apenas sugestão revisável ou avaliar OCR em novo experimento.
- Sem meta artificial de aprovação: reportar desempenho com contagens, diversidade da amostra e limitações. Zero erros observados não prova ausência de risco.
- Erros de alta confiança precisam de inspeção individual e podem motivar rebaixamento da regra em nova versão, sempre antes de uma nova avaliação reservada.
- Alterar campos, tolerâncias, divisão, critérios de confiança ou contagem de métricas exige nova versão deste protocolo e registro da razão. Preservar a 1.0.0 usada em cada rodada.
