# Repasse de continuidade: SalvaAI, pendências acadêmicas

## Atualização prioritária: Item 2 concluído formalmente (3/3 leitores) e esclarecimentos dos Itens 8 e 10 (13/11/2026)

Em **12–13/11/2026**, foram concluídas todas as etapas pendentes do **Item 2**:
1. **Adjudicação do coordenador:** **26/26 pares (`100%`)** e **69/69 ocorrências leitor-par (`100%`)** adjudicados quanto ao estado e ao escopo textual das regras (`CONSOLIDACAO-26-PARES-ADJUDICADOS-2026-11-12.md` e `referencia-revisao-coordenador-20261112-v2.json`).
2. **Declarações individuais (`3/3 = 100%`):** recebidas de `Kaique` (`11/11/2026 18:00–20:00`), `Daniel Felipe` (`11/11/2026 20:00–23:00`) e `Raul` (`11/11/2026`), todas com resposta favorável aos quatro itens de não exposição (`manifesto-declaracoes-2026-11-13.json`).
3. **Complementos e validação formal no `avaliar_leitura.py` (`3/3 = 100%` aprovados sem erros):**
   - **Kaique:** `22/35` (`62,86%`), kappa nominal `0,260163`, `0` estados alterados (`P03` literal preenchido; `P08`/`P20` página `7` confirmada, com registro de troca de texto entre justificativa e trecho na cópia complementar).
   - **Raul:** `24/35` (`68,57%`), kappa nominal `0,384000`, `0` estados alterados (`P03` preenchido e `P18` justificado).
   - **Daniel Felipe:** `22/35` (`62,86%`), kappa nominal `0,330935`, `0` estados alterados (`P29` completado com página `1` e trecho `"PRAZO DE LOCAÇÃO"`; na cópia normalizada para o `avaliar_leitura.py`, foi feito esvaziamento sintático da coluna `valor_ou_regra` nos 20 casos `ausente`/`ambiguo`, preservando as observações em `justificativa` e o bruto intacto em `originais/`).

**Esclarecimentos adicionais registrados em 13/11/2026 (`output/declaracao-ia-2026-11-11/esclarecimentos-complementares-2026-11-13.json`):**
- **Item 8:** O responsável declarou retrospectivamente **Claude Opus 5.5** também para os **10 documentos reservados** (junto com GPT-6 Astra), mantendo a ressalva de ausência de log externo e impossibilidade de reconstrução integral de eventual exposição inicial às saídas (mitigada pela segunda leitura do Item 2).
- **Item 10:** O responsável informou que `DeepSeek-V4.1-Flash-1017` foi lançado oficialmente em `17/10/2026` (antes dos deploys de `29/10` e `03/11/2026`) e que todas as APIs do provedor foram atualizadas automaticamente para essa versão, mantendo a ressalva de ausência de log histórico do painel da Netlify.

**Atualização do Item 7 em 13/11/2026 (`output/SalvaAI-Item7-Comparacao-DeepSeek-2026-11-13.md`):**
- Executada a comparação ampla com `deepseek-flash` (`DeepSeek-V4.1-Flash-1017`, `contract-extract`, blocos de até 10 páginas) nos **48 documentos**: `87` chamadas HTTP 200 (`674.533` tokens; `sau-04`/`sau-05` sem texto útil em modo texto); `70/87` (`80,46%`) aprovadas em `validateContractAi` e `17/87` (`19,54%`) bloqueadas.
- Contra gabarito (`avaliar-sinteticos.mjs`, exato): `S1` `28/92` acerto (`7/33` precisão, `7/62` revocação vs `41/92`, `12/21`, `12/62` das regras `0.1.25`); `S2` `25/50` acerto (`15/40` precisão/revocação vs `49/50`, `39/40`); `2` preenchidos `3/10` acerto (`2/8` precisão/revocação vs `3/10`, `1/7`, `1/8`). Nos `16` documentos de desenvolvimento sem gabarito humano (`80` pares), concordância de estado de `41/80` (`51,25%`).

**Placar atualizado do checklist (12 itens):** **8/12 (`66,7%`)** entregas integralmente comprovadas (Itens **1, 2, 3, 4, 5, 6, 7 e 9**) e **10/12 (`83,3%`)** documentalmente encerradas incluindo as duas ressalvas explícitas (Itens **8 e 10**). Restam apenas os itens editoriais/externos (**11** revista com outra pessoa, **12** integração no artigo/PDF/submissão). Os números `5/26`, `9/26`, `15/69`, `26/69`, `21 pares`, `6/12`, `7/12`, `8/12` e `9/12` nas seções históricas abaixo estão superados por esta atualização.

Atualizado em 12/11/2026, horário de referência America/Sao_Paulo. Destinado ao próximo agente que trabalhará com o coordenador. Contém respostas, referências e decisões; NÃO encaminhar aos leitores que ainda complementam a leitura independente.

## 1. Objetivo e primeira ação

Concluir as pendências acadêmicas do checklist SalvaAI_Pendencias_06-11.pdf. A tarefa atual não é desenvolver funcionalidades, trocar o extrator, fazer deploy nem ampliar os experimentos. O usuário pediu material separado para outra pessoa incorporar ao artigo. Não editar o artigo original por suposição.

Primeira ação: ler a consolidação das cinco aprovações e a fila dos 26 pares. Continuar a revisão dos 21 pares sem decisão com o próprio usuário, que se declarou coordenador. Começar pelos modelos em branco de D01/D02, usando as notas já preparadas, sem refazer toda a pesquisa. Perguntar se chegaram os complementos dos três leitores; a última informação disponível é que ainda não chegaram. Não prometer concluir confirmação humana sozinho.

Nível recomendado para a revisão: Alto. Usar esforço menor para organização de arquivos e redação mecânica. O usuário quer economizar créditos e tempo: não iniciar chamadas pagas, repetir auditorias concluídas, recriar documentos equivalentes nem propor a rodada opcional de 48 documentos.

## 2. Diretórios e arquivos de entrada

Todos os caminhos são locais ao computador do usuário. Um agente em outro computador precisará receber cópias; links locais não dão acesso remoto.

- Projeto: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai`
- Documento principal de integração: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/SalvaAI-Texto-para-Integracao-no-Artigo-2026-11-11.md`
- Declarações e rastreabilidade: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/SalvaAI-Declaracao-IA-e-Integracao-Editorial-2026-11-11.md`
- Relatório técnico histórico: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/SalvaAI-Relatorio-Tecnico-Feedback-06-11-Consolidado-2026-11-10.md`
- Checklist original: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/.codex-remote-attachments/01a09bf1-f3ad-7f42-8325-623a4637007e/90637817-9030-4386-891f-c99772e84a71/1-SalvaAI_Pendencias_06-11.pdf`
- Kit cego: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/ENTREGAR_AO_LEITOR`
- Coordenação inicial: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR`
- Rodada das três devoluções: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12`
- Revisão assistida atual: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida`

Os nomes dos documentos principais ainda trazem 11/11, mas receberam atualizações em 12/11. Eles têm trechos históricos e adendos. Usar o status mais recente; não copiar uma antiga afirmação de que não recebemos leituras ou de que ainda estamos procurando registros da Netlify. Este repasse e a consolidação das aprovações são a referência operacional atual.

## 3. Status real dos 12 itens

| Item | Situação | Entrega ou dependência |
| --- | --- | --- |
| 1. Artefatos públicos | Concluído tecnicamente | Publicados e reprodução conferida; outra pessoa deve citar endereço e commit no artigo. |
| 2. Segunda leitura | Em andamento | Três devoluções recebidas; cálculo preliminar e revisão assistida feitos. Faltam complementos, declarações individuais, decisões de coordenação e fechamento formal. |
| 3. Tabela 0.1.25 | Concluído tecnicamente | Quatro lotes reproduzidos; frações prontas. O responsável pelo artigo calcula Wilson, conforme solicitado no checklist. |
| 4. Origem das regras | Concluído | Novas formas de vencimento atribuídas a documentos de desenvolvimento alu-02 e sau-07. alu-02 também foi usado em S1: declarar essa dependência. |
| 5. 1/7 versus 7/7 | Concluído | A afirmação 7/7 estrutural não se sustenta. Correção e explicações preparadas. |
| 6. Terceiro escaneado | Concluído tecnicamente | sau-06 comparado por Tesseract e DeepSeek OCR, seguido das regras congeladas. |
| 7. Comparação ampla DeepSeek | Opcional, adiado | Não executar os 18 documentos de desenvolvimento e 30 sintéticos sem nova decisão explícita. Declarar comparação não realizada. |
| 8. IA do gabarito | Encerrado documentalmente com ressalvas | Ferramentas declaradas, versão do Claude nos dez reservados e exposição inicial não recuperadas integralmente. Não reabrir sem nova evidência. |
| 9. GPT usado | Concluído quanto à identificação disponível | gpt-6-astra identificado nos metadados locais do chat; não é snapshot imutável dos pesos. |
| 10. DeepSeek na hospedagem | Encerrado documentalmente com ressalva | Usuário confirmou deepseek-flash V4.1-Flash-1017 desde aquela época; histórico técnico das variáveis indisponível. |
| 11. Revista | Outra pessoa | Usuário explicitamente atribuiu a terceiros. Não retomar investigação por conta própria. |
| 12. Artigo final/submissão | Pendente com responsável editorial | Material separado pronto; faltam integração, revisão, PDF e submissão. |

Percentuais usados com o usuário: 6/12 integralmente atendidos = 50%; 8/12 documentalmente encerrados incluindo duas ressalvas = 66,7%. Não misturar os dois indicadores, nem tratá-los como fração do tempo, qualidade científica ou progresso do aplicativo. Informar percentuais junto às respostas. Aprovação das cinco erratas é 5/5, mas NÃO conclui o item 2.

## 4. Três leituras recebidas

Arquivos originais fornecidos:

- `H:/Atalhos/Downloads/respostas Kaique.xlsx`
- `H:/Atalhos/Downloads/respostas Raul.xlsx`
- `H:/Atalhos/Downloads/respostas Daniel.csv`

Cópias byte a byte e hashes estão em `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/originais` e `manifesto.json`. O usuário confirmou no chat que trabalharam separadamente, sem primeiro gabarito, saídas do extrator, respostas de IA, respostas uns dos outros ou IA para anotar. Essa confirmação é do coordenador; não assinamos declarações em nome dos leitores.

Datas: ele respondeu inicialmente “hoje”, mas corrigiu explicitamente para **11/11/2026**, para os três. Recebimento e análise: **12/11/2026**. A correção está em `coordenacao/declaracao-coordenador.json` e `manifesto-atualizacao-data.json`. Não usar recebimento como data de leitura.

Cada pessoa respondeu aos mesmos 35 pares: 15 presentes e 20 ausentes na referência inicial, sorteados no kit. São 105 respostas, mas apenas 35 pares distintos; não são 105 observações independentes. A primeira referência foi assistida por IA.

| Leitor | Concordância de estados com referência inicial | Percentual | Kappa nominal | Estados diferentes |
| --- | --- | --- | --- | --- |
| Kaique | 22/35 | 62,86% | 0,2602 | 13 |
| Raul | 24/35 | 68,57% | 0,3840 | 11 |
| Daniel | 22/35 | 62,86% | 0,3309 | 13 |

São resultados PRELIMINARES, anteriores à adjudicação. O avaliador formal recusou as devoluções por campos/documentação incompletos. Foi feito um diagnóstico suplementar explícito com a função de concordância preservada, usando todos os estados originais. Não afirmar que o avaliador formal aprovou. O cálculo foi verificado independentemente por frações racionais.

Estado igual não prova equivalência do valor ou cláusula. Kappa não mede acerto do extrator. Não escolher o leitor mais concordante, tirar média dos kappas, nem votar para construir uma verdade. A comparação exploratória entre leitores também está registrada: Kaique/Raul 33/35, kappa 0,8852; Kaique/Daniel 23/35, 0,3851; Raul/Daniel 21/35, 0,2847. Semelhança não prova nem refuta independência.

### Problemas de formato e complementos

- Kaique: XLSX com uma coluna contendo registros separados por ponto e vírgula. Em P08/P20 há vírgula na fronteira página/trecho; a cópia de trabalho interpreta página 7, com reparo registrado para confirmação. P03 sem trecho literal.
- Raul: XLSX com oito colunas. P03 sem trecho; P18 sem justificativa.
- Daniel: CSV em CP1252. Explicações colocadas em valor_ou_regra para ausente/ambiguo, com justificativas vazias. São 21 pares com pendências estruturais, não 21 erros científicos confirmados. P29 presente sem página/trecho.
- Nenhum estado foi trocado durante a normalização. Não inventar páginas, justificativas ou declarações.

Pacotes para encaminhar individualmente: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/pacotes-para-leitores/Complementos-Kaique.zip`, `Complementos-Raul.zip`, `Complementos-Daniel.zip`. Cada ZIP tem apenas a própria resposta, COMPLEMENTOS.md e declaração em branco. Conteúdo foi conferido; nenhuma mensagem enviada por ferramenta. Não enviar relatório, chave ou decisões aos leitores enquanto complementam a leitura.

## 5. Revisão e aprovações do coordenador

O usuário declarou que ele será o coordenador. A revisão no chat é posterior, com apoio de IA e acesso às respostas. Não chamá-la de leitura cega nem atribuir decisões aos três leitores.

Fila: 69 ocorrências leitor-par, correspondentes a 26 pares distintos. Uma nota assistida foi preparada para cada um dos 26. Os nove pares fora da fila NÃO passaram por essa revisão de conteúdo. Há cinco erratas na própria referência: textos não literais ou condições alteradas. A referência não é verdade independente; discordância não significa necessariamente erro do leitor.

### Decisões já confirmadas — não perguntar novamente

| Par | Documento/campo | Decisão final do coordenador | Aprovação textual |
| --- | --- | --- | --- |
| P14 | D02, vigência | Ausente: campos de datas/prazo são instruções sem preenchimento. | Aprovada. |
| P19 | D06, vencimento | Presente: primeira parcela na matrícula; demais até dia 10 para desconto de 20%, com perda do desconto e encargos após a data. | Síntese aprovada; manter separada dos trechos literais do § 2º e cláusula 8, p. 4. |
| P21 | D05, reajuste | Presente: regra textual de reajuste, sem inventar índice nominal único. | Aprovada a restauração das condições econômicas/tributárias da cláusula 12 e parágrafo único, p. 5. |
| P24 | D06, vigência | Presente: 01/07/2025 a 31/12/2025, com ressalva financeira posterior. | Aprovada. A hipótese inicial do usuário de vigência anual foi esclarecida e ele confirmou o semestre. |
| P34 | D04, vencimento | Presente: 12 datas no dia 10, de janeiro a dezembro de 2026. | Aprovada a redação final sobre forma e locais indicados pela contratada. |

Registros: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/decisao-P*.json`. As respostas originais, a chave original e os relatórios antigos foram preservados. Arquivos de fila atualizados têm hashes antes/depois nos eventos; os manifestos anteriores representam snapshots históricos, não devem ser silenciosamente regenerados como se nunca tivessem mudado.

### Referência revisada atual

`H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/referencia-revisao-coordenador-20261112-v1.json`

É uma cópia da chave dos 35 pares, com somente cinco correções aprovadas. Os outros 30 pares continuam idênticos. Todos os 35 estados são os mesmos da referência inicial, portanto concordâncias/kappas de estados não mudam. Métricas de correspondência exata de regras podem mudar: NÃO foram recalculadas. Não substituir o gabarito publicado nem dizer que a nova versão já reproduziu os resultados antigos.

Em P19, valor.regra contém a síntese aprovada; evidencias contém os dois recortes literais que a sustentam. Não confundir síntese com citação literal. Os campos estruturados restantes foram preservados. O metadado _revisao_coordenador informa o escopo limitado.

### Arquivos centrais para continuar

- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/CONSOLIDACAO-CINCO-APROVACOES.md`: estado mais recente das decisões.
- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/triagem-26-pares.csv`: uma linha por par, com decisão humana e justificativa.
- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/revisao-69-ocorrencias-com-notas.csv`: uma linha por leitor-par; 15 decididas, 54 pendentes.
- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/REVISAO-ASSISTIDA.md`: notas e limites da revisão inicial, anteriores às aprovações.
- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/paginas-consultadas.json`: texto extraído das páginas consultadas e hashes dos PDFs.
- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/D*.png`: páginas renderizadas. D10 p.22 foi inspecionada visualmente, sem nova API.
- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/proposta-erratas/decisoes-do-coordenador.csv`: cinco aprovações registradas.
- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/proposta-erratas/chave-proposta-nao-aprovada.json`: proposta histórica; NÃO é a versão aprovada atual.
- `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/RELATORIO-RECEBIMENTO.md`: cálculo preliminar e pendências; anterior às decisões posteriores.

## 6. Os 21 pares ainda sem decisão

A tabela abaixo foi gerada da fila em disco no momento do repasse. A nota de cada par está na triagem e na revisão assistida. Não usar a decisão de um par para aprovar outro sem confirmação do coordenador.

| Par | Documento | Campo | Páginas já consultadas | Foco da revisão |
| --- | --- | --- | --- | --- |
| P01 | D08 | data_vencimento | 35 | remissao_externa |
| P02 | D01 | numero_parcelas | 1 | lacuna_modelo |
| P03 | D02 | regra_reajuste | 1,2 | regra_incompleta |
| P05 | D07 | numero_parcelas | 2 | remissao_externa |
| P08 | D05 | data_vencimento | 7 | regra_incompleta |
| P09 | D02 | numero_parcelas | 1,2 | lacuna_modelo |
| P11 | D01 | data_vencimento | 1 | lacuna_modelo |
| P13 | D01 | valor_parcela | 1 | lacuna_modelo |
| P17 | D10 | vigencia | 22 | omissao_e_condicoes |
| P20 | D05 | vigencia | 7,14,15 | campo_trocado |
| P22 | D02 | data_vencimento | 1,2 | lacuna_modelo |
| P23 | D09 | vigencia | 26 | regra_incompleta |
| P25 | D03 | vigencia | 2 | regra_incompleta |
| P26 | D03 | numero_parcelas | 2 | quantidade_explicita |
| P27 | D06 | regra_reajuste | 4 | omissao |
| P28 | D07 | data_vencimento | 2 | remissao_externa |
| P29 | D01 | vigencia | 1 | lacuna_modelo |
| P31 | D03 | data_vencimento | 2 | campo_trocado |
| P32 | D04 | vigencia | 1,3 | escopo_e_evidencia |
| P33 | D09 | data_vencimento | 26,35 | campo_trocado |
| P35 | D08 | vigencia | 27 | omissao_e_condicoes |

### Como conduzir a revisão

1. Mostrar ao coordenador a divergência e a evidência pertinente do PDF. Usar perguntas curtas; pode agrupar casos do mesmo documento quando a decisão for inequívoca, mas pedir uma resposta que identifique quais pares foram aprovados.
2. Separar classificação (presente/ausente/ambiguo/ilegivel), conteúdo do campo e literalidade da evidência. Não inferir aprovação textual de uma resposta que só diz “presente”. Já ocorreu neste chat e as aprovações foram coletadas separadamente.
3. Presentes precisam de regra/valor e evidência; espaço em branco não é dado presente. Duração não equivale a número de parcelas, e vigência não equivale a vencimento. Remissão a anexo exige verificar se o anexo está no PDF e explicitar o critério.
4. Se uma evidência do gabarito for incorreta, abrir uma errata separada. Não favorecer o gabarito automaticamente. Revisões assistidas não certificam independência inicial.
5. Registrar decisão explícita com data real, responsável, apoio de IA, trecho da confirmação e hashes antes/depois. Atualizar apenas linhas pertinentes nas filas. Não preencher dados humanos ausentes por conveniência.
6. Consolidar novas decisões em versão nova, preservando 20261112-v1. Se houver alteração de estados, calcular e relatar separadamente efeito pós-adjudicação. Nunca substituir os números pré-adjudicação ou apresentar respostas corrigidas como originais cegas.
7. Ao receber complementos, arquivar os bytes em nova pasta, comparar mudanças e distinguir complemento de evidência de mudança de interpretação. Não usar respostas expostas ao gabarito como segunda leitura cega original.

## 7. Avaliador, execução e cuidados

`H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/avaliar_leitura.py` é o avaliador formal preservado. Aceita --chave, --respostas, --declaracao e --saida. CSV UTF-8 com BOM, delimitador ponto e vírgula, oito colunas: par_id, documento, campo, estado, valor_ou_regra, paginas_fisicas, trecho_literal, justificativa. Estados válidos: presente, ausente, ambiguo, ilegivel.

Para presente, exige valor/regra, página e trecho. Para outros estados, valor vazio e justificativa preenchida. Declaração requer leitor_id, datas ISO e quatro booleanos: nao_consultei_primeiro_gabarito, nao_consultei_saidas_extrator, nao_consultei_respostas_ia, nao_usei_ia_para_anotar. Uma resposta false não deve ser convertida para true. A confirmação do coordenador foi arquivada separadamente, não satisfaz automaticamente a declaração individual exigida pelo fluxo atual.

O programa recusa saída existente. Exemplo, depois de receber arquivos completos:

```powershell
& 'C:/Users/gamer/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' -B 'H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/avaliar_leitura.py' --chave 'H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/chave.json' --respostas 'CAMINHO_DA_NOVA_DEVOLUCAO/respostas.csv' --declaracao 'CAMINHO_DA_NOVA_DEVOLUCAO/declaracao.json' --saida 'PASTA_NOVA_PARA_O_RESULTADO'
```

Usar a referência inicial para a comparação pré-adjudicação. Uma comparação com referência revisada tem outro significado e precisa de identificação própria. A função concordancia calcula kappa nominal, sem pesos, e N/A quando Pe=1. Os 11 testes fictícios do avaliador já passaram; não executar repetidamente sem alteração ou dúvida concreta.

`H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/leitura-cega-2026-11-11/RESTRITO_COORDENADOR/analisar_recebimento_20261112.py` registra a recepção inicial e o diagnóstico suplementar. Recusa pasta existente. Não reexecutar sobre as devoluções atuais. `registrar_revisao.py` e `preparar_erratas.py` são scripts históricos de geração: não rodar cegamente porque recriam artefatos. Preparar uma nova rodada quando necessário.

## 8. Resultados científicos que não podem ser confundidos

Versão congelada de regras 0.1.25, resultados históricos:

| Lote | D | Acerto | Precisão | Revocação |
| --- | --- | --- | --- | --- |
| Reservado | 39 | 18/39 | 1/4 | 1/15 |
| Dois preenchidos | 10 | 3/10 | 1/7 | 1/8 |
| Sintéticos S1 | 92 | 41/92 | 12/21 | 12/62 |
| Sintéticos S2 exato | 50 | 49/50 | 39/40 | 39/40 |
| Sintéticos S2 tolerante | 50 | 50/50 | 40/40 | 40/40 |

Alta confiança: 0/0 = N/A, nunca “zero por cento de erro”. A diferença de um centavo em S2 foi deliberada para testar tolerância.

Sintéticos: 30 instâncias textuais, não 30 novos PDFs. São 23 preenchidas e sete controles em branco. S1: 20 instâncias, 15 preenchidas; S2: dez instâncias, oito preenchidas. Semente 20261103, escolhas discretas com reposição em ordem fixa. Cinco modelos de desenvolvimento: alu-01 (2 páginas), alu-02 (7), edu-01 (16), fin-01 (17), sau-01 (33). Parte da referência é derivada das regras: declarar dependência. Não reutilizar os números antigos 2/8/17/18/34 páginas sem conferir.

Item 6, sau-06: 25 páginas por Tesseract e DeepSeek OCR, seguidas das mesmas regras congeladas. Ambos produziram quatro não identificados e reajuste ambíguo, sem campo encontrado. Na referência: valor, parcelas e vencimento ausentes; vigência presente; reajuste ambíguo. Acerto do lote passa a 21/39 por três ausências corretamente reconhecidas, não três valores recuperados. Precisão 1/4 e revocação 1/15 permanecem. Não há referência independente para CER/WER. Isso não é comparação de extração completa por LLM.

Detalhe item 6: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/SalvaAI-Item6-OCR-sau06-2026-11-11.md`. Artefatos em `C:/Users/gamer/.codex/visualizations/2026/09/13/01a09bf1-f3ad-7f42-8325-623a4637007e/item6-sau06-20261111`.

## 9. Encerramentos dos itens 8, 9 e 10

Item 8: Claude Opus 5.5 foi declarado somente para pub-alu-02/pub-alu-03. GPT-6 Astra e Claude Opus foram declarados para os dez reservados, sem versão específica do Claude. Exposição a sugestões anteriores confirmada nos dois preenchidos; não inferir que cada sugestão veio do programa extrator. Revisão posterior com acesso a saídas está documentada em analise-assistida-0118.md; preparação inicial não inteiramente reconstruída. Documentação encerrada com ressalvas. Não insistir em perguntas que o usuário já disse não lembrar.

Item 9: metadados locais identificaram gpt-6-astra; 212 contextos/193 turnos no recorte de 13/10 a 06/11 UTC. Não afirmar snapshot imutável nem atestação do servidor por geração.

Item 10: usuário forneceu registros de deploy: 1f77f6d falhou em 29/10; dc3d546 e a99becf tiveram sucesso em 29/10; 4adce4f e 297b986 em 03/11. Código e .env.example usam deepseek-flash como padrão, mas variáveis podem substituir. SECRETS_SCAN_OMIT_KEYS só lista nomes omitidos no scanner, não seus valores. Usuário informou que não tem o histórico dos valores e confirmou retrospectivamente **deepseek-flash V4.1-Flash-1017 desde aquela época**. Encerrado com essa declaração e ausência de verificação independente; não perguntar de novo nem usar configuração atual como prova passada. As 101 chamadas experimentais históricas tinham alias deepseek-flash e foram locais. Não atribuir execução desses ensaios à Netlify.

Auditorias desses itens: `H:/Atalhos/Area de Trabalho/AgentFinanceiro/salva-ai/output/declaracao-ia-2026-11-11`. Não há necessidade de repetir busca em logs enormes do chat. Podem conter segredos; não copiar ou publicar logs completos.

## 10. Publicação e limites do ambiente

Pacote público: https://github.com/emanuelsobral/salvaAI/tree/2f01c0ba6d737566d85f889156426e7601cc44d2/experiments/contracts/evidence-20261110

Reprodução isolada conferiu quatro relatórios e geração dos 30 sintéticos. PDFs originais ficaram fora. Pacote público usa cópias com supressões identificadas de dados pessoais. Novas erratas ainda NÃO foram aplicadas a esse pacote; não publicar automaticamente cópias privadas, nomes dos leitores ou respostas. Não usar git add indiscriminado: podem existir mudanças não relacionadas.

Python disponível: `C:/Users/gamer/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`. Bibliotecas usadas: pypdf, pypdfium2, openpyxl para leitura, Pillow; fitz/PyMuPDF não está instalado. Node: `C:/Program Files/nodejs/node.exe`. PowerShell: usar UTF-8 e gravar texto com newline='\n' para evitar CRLF duplicado. Não instalar dependências sem necessidade. A unidade H teve pouco espaço anteriormente; usar a pasta de artefatos C quando necessário, sem mover/excluir o projeto por conta própria.

Não há sessão ativa de ferramenta deixada por esta entrega. Browser/Netlify não foram necessários nesta última etapa. O usuário não pediu deploy agora. Não fazer chamadas reais à DeepSeek para comprovar história ou gastar créditos em repetição de testes.

## 11. Critério para terminar

Concluir item 2 quando: devoluções e procedimento documentados; diferenças de estado e conteúdo decididas com justificativa/responsável/data; versões e números pré/pós-adjudicação separados; limitações da primeira referência e da revisão assistida descritas; material entregue à pessoa que integra o artigo. Não declarar que aprovação de cinco erratas equivale à revisão dos 26 pares ou à aprovação de 69 ocorrências.

Itens 11/12 ficam com responsáveis externos. O agente deve fornecer um pacote técnico claro, não assumir que a revista aprovou, que o PDF final foi gerado ou que houve submissão. O usuário prefere um repasse separado e explicativo, sem várias rodadas de arquivos repetidos.
