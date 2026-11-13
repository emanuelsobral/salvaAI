# SalvaAI: material pronto para integrar ao artigo

## Status consolidado em 13/11/2026

| Itens | Situação atual |
| --- | --- |
| 1, 2, 3, 4, 5, 6, 7 e 9 | Entregas técnicas integralmente concluídas; conteúdo disponível para integração editorial. |
| 8 e 10 | Tratamento documental encerrado com ressalvas explícitas (incluindo esclarecimentos complementares de 13/11/2026); as lacunas de log histórico externo não foram convertidas em comprovação independente. |
| 11 | Responsabilidade externa: confirmação das condições da revista. |
| 12 | Material separado preparado; integração, revisão final, PDF e submissão pendentes. |

Há **8/12 itens integralmente comprovados (`66,7%`)** e **10/12 com tratamento técnico/documental encerrado, incluindo duas ressalvas (`83,3%`)**. Esses são indicadores diferentes. Não representam aprovação do artigo, conclusão do aplicativo ou fração do tempo restante. Este quadro substitui os percentuais e estados históricos anteriores para acompanhamento atual.

### Fechamento do Item 7 em 13/11/2026 (Comparação ampla com DeepSeek em 48 documentos)

Foi executada a comparação completa com `deepseek-flash` (`DeepSeek-V4.1-Flash-1017`, `contract-extract`, blocos de até 10 páginas, `87` chamadas HTTP 200, `674.533` tokens totais; `sau-04` e `sau-05` sem texto útil em modo texto). Relatório detalhado em `output/SalvaAI-Item7-Comparacao-DeepSeek-2026-11-13.md`:
- **Validação estrita (`validateContractAi`):** `70/87` (`80,46%`) chamadas aprovadas e `17/87` (`19,54%`) bloqueadas por sintaxe JSON (`4`), formato de valor (`6`), evidência fora da página (`5`) ou estado inválido (`2`).
- **Contra gabarito (`avaliar-sinteticos.mjs`, critério exato):**
  - `S1` (20 docs): Regras `0.1.25` `41/92` (`44,57%`) acerto, `12/21` (`57,14%`) precisão, `12/62` (`19,35%`) revocação vs DeepSeek `28/92` (`30,43%`) acerto, `7/33` (`21,21%`) precisão, `7/62` (`11,29%`) revocação (`12` concluídos, `6` parciais, `2` falhos).
  - `S2` (10 docs): Regras `0.1.25` `49/50` (`98,00%`) acerto, `39/40` (`97,50%`) precisão/revocação vs DeepSeek `25/50` (`50,00%`) acerto, `15/40` (`37,50%`) precisão/revocação (`26/50` e `16/40` no tolerante).
  - `2` preenchidos (`pub-alu-02`, `pub-alu-03`): Regras `0.1.25` `3/10` (`30,00%`) acerto, `1/7` (`14,29%`) precisão, `1/8` (`12,50%`) revocação vs DeepSeek `3/10` (`30,00%`) acerto, `2/8` (`25,00%`) precisão e revocação.
- **Nos `16` demais documentos de desenvolvimento (`80` pares, sem gabarito humano preenchido):** concordância de estado entre DeepSeek e regras `0.1.25` em `41/80` (`51,25%`); `13` pares `encontrado` apenas pelo DeepSeek e `3` apenas pelas regras.

> **Texto pronto para a Seção 3.6 / Discussão (Item 7):** Em comparação ampla com `deepseek-flash` em 48 documentos (`87` chamadas em blocos de até 10 páginas; `674.533` tokens; `sau-04` e `sau-05` sem texto útil em modo texto), `70/87` blocos (`80,46%`) passaram na validação estrita de esquema e evidência literal da aplicação, enquanto `17/87` (`19,54%`) foram bloqueados. Contra gabarito no comparador oficial (critério exato), o modelo igualou o acerto global das regras `0.1.25` nos dois contratos públicos preenchidos (`3/10`, com precisão/revocação de `2/8` contra `1/7` e `1/8`), porém ficou abaixo das regras nos sintéticos `S1` (`28/92` vs `41/92` de acerto; `7/33` vs `12/21` de precisão) e `S2` (`25/50` vs `49/50` de acerto; `15/40` vs `39/40` de precisão). Nos 16 documentos de desenvolvimento sem gabarito humano preenchido, os extratores concordaram no estado em `41/80` (`51,25%`) pares. Esses resultados confirmam que a validação determinística de evidência e formato restringe alucinações e desvios de esquema do LLM, mas exige revisão humana nos casos bloqueados ou divergentes.

### Fechamento formal do Item 2 em 13/11/2026

Todas as pendências de devolução e validação formal do Item 2 foram concluídas:
- **Declarações individuais (`3/3`):** `Kaique`, `Raul` e `Daniel Felipe` declararam ter realizado a leitura em `11/11/2026` sem consulta ao primeiro gabarito, saídas do extrator, respostas de IA ou uso de IA para anotar.
- **Validação formal no `avaliar_leitura.py` (`3/3` aprovados sem erros):** `Kaique` (`22/35 = 62,86%`, kappa `0,2602`), `Raul` (`24/35 = 68,57%`, kappa `0,3840`) e `Daniel Felipe` (`22/35 = 62,86%`, kappa `0,3309`), com `0` estados alterados após os complementos (`P03` de Kaique/Raul, `P18` de Raul e `P29` de Daniel com página `1` e trecho `"PRAZO DE LOCAÇÃO"`, além da normalização sintática de colunas na cópia de Daniel).

### Atualização complementar dos Itens 8 e 10 em 13/11/2026

- **Item 8:** O responsável declarou retrospectivamente o uso de **Claude Opus 5.5** também nos **10 documentos reservados** (junto com GPT-6 Astra). Permanece a ressalva de ausência de log externo e impossibilidade de reconstrução integral de eventual exposição inicial às saídas na preparação do primeiro gabarito (limitação mitigada pela segunda leitura cega do Item 2).
- **Item 10:** O responsável informou que o **DeepSeek-V4.1-Flash-1017** foi lançado oficialmente em `17/10/2026` (antes dos deploys de `29/10` e `03/11/2026`) e que todas as APIs foram atualizadas automaticamente pelo provedor para essa versão, mantendo a ressalva de indisponibilidade de log histórico do painel da Netlify.

No item 2, encaminhar apenas o pacote individual a cada leitor. A coordenação recebe as cinco erratas propostas e a fila de decisões; essas informações não devem ser repassadas a leitores que ainda complementam suas fichas. Nenhuma resposta ou aprovação humana deve ser preenchida pelo assistente.

## Atualização do item 2 em 12/11/2026

Foram recebidas as devoluções de Kaique, Raul e Daniel, com 35 pares por pessoa. O coordenador declarou que as leituras ocorreram separadamente, sem consulta às respostas anteriores ou uso de IA, em 11/11/2026. As declarações individuais ainda não foram recebidas. Há complementos de preenchimento pendentes. O diagnóstico preliminar de estados encontrou 22/35 concordâncias para Kaique (kappa 0,2602), 24/35 para Raul (0,3840) e 22/35 para Daniel (0,3309).

Esses números não foram aprovados como resultado formal do item 2. O avaliador formal recusou as devoluções incompletas; os cálculos suplementares consideram todos os estados originais, sem trocar classificações ou excluir pares. Ainda é necessário completar a documentação, conferir valores e cláusulas e registrar a resolução das divergências. Não substituir silenciosamente as respostas iniciais pelas respostas corrigidas.

O relatório de recebimento e as solicitações individuais de complemento estão em leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12. Não compartilhar o relatório ou a chave com os leitores durante a complementação. As menções anteriores a “aguardar a devolução” ficam substituídas por este estado: devoluções recebidas, validação formal e adjudicação pendentes. O progresso geral permanece em 6/12 entregas integralmente concluídas (50%).

Preparado em 11/11/2026 com base no checklist de 06/11. Este é o roteiro de trabalho da pessoa responsável pelo artigo. Reúne o conteúdo atual, sem exigir a leitura dos estados históricos do dossiê. O artigo original não foi alterado. As devoluções da segunda leitura foram recebidas; sua validação e adjudicação permanecem pendentes.

### Revisão assistida posterior das devoluções (12/11/2026)

A fila de 69 ocorrências leitor-par foi organizada em 26 pares distintos, todos com nota de revisão assistida baseada nas páginas do kit. Foram identificados campos em branco marcados como presentes, confusão entre vigência e vencimento e regras incompletas apesar de concordância de estado. Também foram encontradas divergências de transcrição no próprio gabarito em pelo menos cinco pares: P14, P19, P21, P24 e P34. As propostas de errata estão separadas da referência congelada.

Esses achados reforçam que a comparação preliminar mede concordância com uma referência assistida, não acerto contra uma verdade independente. Nenhum estado, gabarito ou resultado foi alterado. A revisão foi feita por IA com acesso a todas as respostas, portanto não constitui adjudicação humana ou nova leitura cega. As 69 decisões finais continuam em branco para conferência e registro pelo coordenador. Antes de integrar os números como resultado final do item 2, concluir a validação das devoluções e a revisão da referência, preservando resultados anteriores e identificando eventuais novas versões.

### Adjudicação pelo coordenador concluída para a fila de 26 pares (12/11/2026)

Após a preparação das notas documentais, o coordenador revisou e adjudicou todos os **26/26 pares (`100%`)** e **69/69 ocorrências leitor-par (`100%`)** da fila de revisão assistida (com apoio de IA e acesso às respostas e às páginas dos PDFs, sem caracterizar leitura cega). Foram aprovadas:
1. As cinco erratas de literalidade/escopo da referência (`P14`, `P19`, `P21`, `P24` e `P34`), incorporadas em `referencia-revisao-coordenador-20261112-v1.json` e mantidas em `referencia-revisao-coordenador-20261112-v2.json`;
2. A classificação `ausente` para os campos em branco dos modelos de locação `D01` (`P02`, `P11`, `P13`, `P29`) e `D02` (`P09`, `P22`, além de `P14`) e para as remissões a anexos ausentes nos PDFs de `D07` (`P05`, `P28`), `D08` (`P01`) e `D09` (`P33`);
3. A confirmação do estado `presente` e do escopo textual completo das cláusulas em `D02` (`P03`), `D03` (`P25`, `P26`, `P31`), `D04` (`P32`, além de `P34`), `D05` (`P08`, `P20`, além de `P21`), `D06` (`P27`, além de `P19` e `P24`), `D08` (`P35`), `D09` (`P23`) e `D10` (`P17`).

Todos os 26 estados adjudicados coincidem com os estados da referência inicial (`chave.json`), assim como os 9 pares fora da fila (`P04`, `P06`, `P07`, `P10`, `P12`, `P15`, `P16`, `P18` e `P30`, todos `ausente` por unanimidade). Dessa forma, as concordâncias de estado com a referência adjudicada permanecem em **22/35 (`62,86%`, kappa `0,2602`) para Kaique**, **24/35 (`68,57%`, kappa `0,3840`) para Raul** e **22/35 (`62,86%`, kappa `0,3309`) para Daniel**. Na camada de conteúdo dos pares `presente`, a adjudicação registrou trocas entre vigência e vencimento (`P19`, `P20`, `P31`, `P33`) e capturas parciais de regras compostas (`P03`, `P08`, `P17`, `P23`, `P25`, `P34`, `P35`).

A consolidação completa está em `leitura-cega-2026-11-11/RESTRITO_COORDENADOR/devolucoes-2026-11-12/coordenacao/revisao-assistida/CONSOLIDACAO-26-PARES-ADJUDICADOS-2026-11-12.md`. Para o fechamento formal do Item 2 no `avaliar_leitura.py`, restam apenas os complementos de preenchimento e as declarações individuais assinadas/preenchidas pelos três leitores. Não compartilhar a consolidação ou a chave com os leitores enquanto concluem o preenchimento.

## 1. Onde aplicar cada alteração

| Item | Local no artigo informado pelo checklist | Ação |
| --- | --- | --- |
| 1 | Disponibilidade de código e dados | Inserir o endereço e o commit da seção 2 deste arquivo. |
| 2 | Avaliação entre leitores | Manter como pendente; não inserir concordância, kappa ou adjudicação antes de receber a segunda leitura. |
| 3 | Tabela 5, p. 12 | Usar a seção 4 para preencher as células da versão 0.1.25. Preservar os resultados de outras versões em linhas próprias. |
| 4 | Seção 2.4, p. 8, e limitações | Inserir a origem das regras e a reutilização de alu-02 em S1, seção 5. |
| 5 | Seção 3.6, p. 13 | Substituir a afirmação 7/7 pela análise da seção 6. |
| 6 | Seção 3.3, p. 10, e Tabela 5 | Acrescentar os cenários de OCR como análise complementar, sem apagar o histórico. |
| 7 | Nota opcional da Seção 3.6 | Mantida a decisão de adiar a rodada ampla, retirar somente essa nota amarela e conservar a declaração de comparação não realizada. |
| 8 | Seção 2.2 e declaração (iii), p. 6 e 16 | Registrar Claude Opus 5.5 declarado nos dois preenchidos e influência de valores/trechos anteriores; GPT-6 Astra e Claude Opus declarados para os dez reservados; explicitar versão do Claude não recuperada e exposição às saídas não esclarecida. |
| 9 | Declaração (ii), p. 16 | Inserir Codex/gpt-6-astra, identificado nos registros locais; manter a limitação sobre snapshot imutável. |
| 10 | Declaração de IA, p. 16 | Incorporar a confirmação retrospectiva do responsável: deepseek-flash V4.1-Flash-1017; explicitar ausência de verificação técnica histórica e distinguir os ensaios locais. |
| 11 | Dados da revista | Responsabilidade de outra pessoa, conforme orientação do usuário; fora das próximas ações desta atividade. |
| 12 | Revisão final e submissão | Incorporar, revisar referências cruzadas, remover apenas notas resolvidas e gerar o PDF final. |

As páginas e seções são as do checklist de 06/11; conferir a numeração após editar. O nome do curso registrado pelo grupo é “Engenharia de Software e Computação”. A comunicação com o professor, a revista e os gestores permanece com os responsáveis.

## 2. Disponibilidade de código e dados

O [pacote de evidências](https://github.com/emanuelsobral/salvaAI/tree/2f01c0ba6d737566d85f889156426e7601cc44d2/experiments/contracts/evidence-20261110) está disponível no repositório SalvaAI, no diretório experiments/contracts/evidence-20261110, commit 2f01c0ba6d737566d85f889156426e7601cc44d2. A edição reúne as referências de 12 documentos públicos, 30 instâncias textuais sintéticas, parâmetros de geração, regras congeladas e o comparador, com manifestos de integridade e supressões explícitas de identificadores pessoais. Uma instalação isolada reproduziu as métricas e decisões dos quatro lotes da versão 0.1.25 e a geração dos 30 sintéticos. Os PDFs originais permanecem fora do repositório; sua identificação por URL e hash está documentada. A publicação dos artefatos não caracteriza validação humana independente dos gabaritos.

## 3. Procedência e método

### Referências e participação de IA

As referências foram preparadas com assistência de IA e conferência humana declarada pelo responsável. Para pub-alu-02 e pub-alu-03, ele informou o uso de Claude Opus 5.5 e de perguntas que incluíam valores ou trechos sugeridos anteriormente neste chat. Para os dez documentos reservados, declarou o uso de GPT-6 Astra e Claude Opus, sem identificar a versão específica do Claude. Os metadados locais identificam gpt-6-astra como modelo configurado neste chat; as informações sobre Claude são declarações retrospectivas, sem log externo apresentado. Nos dois contratos preenchidos houve exposição a respostas anteriores da IA, mas não foi estabelecido se essas sugestões provinham de saídas do programa extrator. Nos dez reservados, não foi possível confirmar nem excluir acesso direto ou indireto às saídas durante a preparação inicial. A ordem de gravação das referências e execução da comparação no script preservado não demonstra ausência de exposição anterior. Por isso, os resultados são apresentados em relação a referências assistidas, sem certificação de anotação cega independente. A segunda leitura permanece pendente e seus resultados não integram as métricas apresentadas.

Houve também análise assistida posterior com acesso às saídas do extrator: o registro de 19/10/2026 descreve a inspeção conjunta de páginas, referência e resultados de pub-alu-02. O procedimento de consolidação de 03/11 grava as referências e depois reúne gabaritos e saídas para comparação; os resultados aparecem no relatório dessa rodada. Esses registros documentam a análise posterior com os dois materiais disponíveis, sem identificar qual modelo externo participou de cada operação nem demonstrar ausência de exposição na preparação inicial.

### Instâncias sintéticas

Foram reconstruídas e publicadas 30 instâncias textuais derivadas de cinco modelos públicos de desenvolvimento: alu-01 (2 páginas), alu-02 (7), edu-01 (16), fin-01 (17) e sau-01 (33). S1 contém 20 instâncias, das quais 15 preenchidas e cinco controles em branco, com 92 pares decidíveis. S2 contém dez instâncias, oito preenchidas e dois controles, com 50 pares decidíveis. A geração usa random.Random(20261103), escolhas com reposição em listas discretas e ordem fixa. Os controles em branco não consomem sorteios. Os textos-base, listas, parâmetros e gerador estão no pacote público.

Essas instâncias são strings de páginas; não correspondem à geração e leitura de 30 novos PDFs. Alguns estados de referência herdam resultados das regras aplicadas aos modelos-base, o que limita sua independência. O caso sint-s2-alu02-04 contém uma diferença deliberada de R$ 0,01 na referência para verificar a tolerância. Essa diferença não representa erro espontâneo de extração. A reprodução verificou textos, campos e parâmetros dos 30 arquivos reconstruídos, sem demonstrar identidade com arquivos originais não preservados.

Para a descrição completa dos sorteios, usar a seção “Sintéticos — Método, reconstrução e limites” do relatório técnico consolidado, que discrimina escolhas aleatórias e parâmetros fixos por modelo. Não substituir essa descrição apenas pelos valores mínimo e máximo observados.

## 4. Tabela 5: linhas conferidas da versão 0.1.25

| Conjunto / cenário | Critério | D | Acerto | Precisão | Revocação | Não identificados | Erro em alta confiança |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Reservado, histórico | exato | 39 | 18/39 (46,15%) | 1/4 (25,00%) | 1/15 (6,67%) | 11/15 (73,33%) | 0/0 (N/A) |
| Reservado, histórico | tolerante | 39 | 18/39 (46,15%) | 1/4 (25,00%) | 1/15 (6,67%) | 11/15 (73,33%) | 0/0 (N/A) |
| Preenchidos | exato | 10 | 3/10 (30,00%) | 1/7 (14,29%) | 1/8 (12,50%) | 1/8 (12,50%) | 0/0 (N/A) |
| Preenchidos | tolerante | 10 | 3/10 (30,00%) | 1/7 (14,29%) | 1/8 (12,50%) | 1/8 (12,50%) | 0/0 (N/A) |
| Sintéticos S1 | exato | 92 | 41/92 (44,57%) | 12/21 (57,14%) | 12/62 (19,35%) | 41/62 (66,13%) | 0/0 (N/A) |
| Sintéticos S1 | tolerante | 92 | 41/92 (44,57%) | 12/21 (57,14%) | 12/62 (19,35%) | 41/62 (66,13%) | 0/0 (N/A) |
| Sintéticos S2 | exato | 50 | 49/50 (98,00%) | 39/40 (97,50%) | 39/40 (97,50%) | 0/40 (0,00%) | 0/0 (N/A) |
| Sintéticos S2 | tolerante | 50 | 50/50 (100,00%) | 40/40 (100,00%) | 40/40 (100,00%) | 0/40 (0,00%) | 0/0 (N/A) |
| Reservado + OCR Tesseract em sau-06 | exato | 39 | 21/39 (53,85%) | 1/4 (25,00%) | 1/15 (6,67%) | 11/15 (73,33%) | 0/0 (N/A) |
| Reservado + OCR Tesseract em sau-06 | tolerante | 39 | 21/39 (53,85%) | 1/4 (25,00%) | 1/15 (6,67%) | 11/15 (73,33%) | 0/0 (N/A) |
| Reservado + OCR DeepSeek em sau-06 | exato | 39 | 21/39 (53,85%) | 1/4 (25,00%) | 1/15 (6,67%) | 11/15 (73,33%) | 0/0 (N/A) |
| Reservado + OCR DeepSeek em sau-06 | tolerante | 39 | 21/39 (53,85%) | 1/4 (25,00%) | 1/15 (6,67%) | 11/15 (73,33%) | 0/0 (N/A) |

Fonte: relatórios JSON preservados, lidos diretamente para gerar esta tabela. Exato e tolerante são critérios do mesmo experimento; as linhas não devem ser somadas como amostras independentes. Os dois cenários de OCR substituem somente o processamento de sau-06 no lote reservado e preservam os nove outros documentos e as referências. Também não são conjuntos independentes entre si.

D representa pares decidíveis. Acerto inclui respostas corretas e ausências corretamente reconhecidas; precisão considera respostas preenchidas; revocação considera campos presentes na referência. Não identificados e erros emitidos são ocorrências diferentes. A tolerância monetária é de um centavo e não equivale à avaliação semântica de cláusulas. Denominador zero significa N/A, não taxa de erro zero. Os intervalos de Wilson não foram acrescentados: as frações exatas estão disponíveis para a equipe responsável pelo cálculo. A dependência entre campos de um mesmo documento deve ser considerada na interpretação da incerteza.

O rótulo técnico “sintetica” nas entradas adaptadas dos lotes reais decorre da interface do comparador. A procedência foi conferida: os reservados e preenchidos são documentos públicos reais. A classificação de sau-06 como digitalizado foi corrigida nas entradas complementares, sem alterar silenciosamente a avaliação histórica.

## 5. Origem das alterações posteriores à versão congelada

Segundo os registros de desenvolvimento, as duas formas de vencimento incorporadas após a versão 0.1.25 foram identificadas em alu-02 e sau-07, ambos pertencentes à divisão de desenvolvimento. O modelo alu-02 também foi utilizado na geração de S1, de modo que esse estrato não representa avaliação em famílias documentais completamente novas. A comparação entre versões é apresentada separadamente, sem substituir os resultados da versão congelada.

## 6. Correção da comparação nos contratos preenchidos

Nos dois contratos públicos preenchidos, a precisão exata foi 1/7. As demais respostas diferiram da referência na delimitação das cláusulas, na inclusão de condições complementares e na representação textual. Em pub-alu-02, a regra de reajuste também divergiu no tipo, na lista de índices e na periodicidade, pois a extração reuniu reajuste periódico e revisão excepcional em uma regra textual. A afirmação anterior de precisão estrutural 7/7 não é sustentada pelos objetos avaliados. Uma avaliação de equivalência semântica exigiria critério próprio e revisão independente.

## 7. Discussão dos resultados

A reprodução das quatro avaliações da versão 0.1.25 confirmou os relatórios preservados, mas a interpretação dos resultados exige distinguir contratos públicos, referências assistidas e instâncias sintéticas. Os sintéticos verificam o comportamento das regras em condições controladas. Seu gabarito e seus modelos de origem têm vínculos com o desenvolvimento, o que limita a extrapolação para contratos reais não vistos. Nos contratos preenchidos, o resultado exato foi de um acerto entre sete respostas emitidas. A auditoria não sustentou a afirmação anterior de sete acertos estruturais, pois identificou, além de diferenças textuais e de abrangência, uma divergência de representação no reajuste de pub-alu-02.

A análise complementar de sau-06 separou transcrição e reconhecimento dos campos: as mesmas 25 imagens foram processadas por Tesseract e DeepSeek, e os textos resultantes foram submetidos às mesmas regras congeladas. Os dois caminhos concluíram as páginas e produziram quatro campos não identificados e reajuste ambíguo, sem campo encontrado. Na referência assistida, valor, quantidade de parcelas e vencimento estão ausentes; vigência está presente; reajuste é ambíguo e não integra os pares decidíveis. O acerto global do reservado passou de 18/39 (46,15%) para 21/39 (53,85%), exclusivamente por três ausências corretamente reconhecidas. A precisão permaneceu 1/4 e a revocação 1/15. O ganho de acerto não representa recuperação de três valores financeiros.

A cláusula de vigência aparece nas duas transcrições, mas não foi reconhecida pelas regras congeladas. Esse caso evidencia uma limitação de reconhecimento após a leitura do texto. A coincidência dos estados finais em um documento não demonstra equivalência geral entre os motores de OCR. Não há referência independente de transcrição para calcular taxa de erro de caracteres ou palavras. Da mesma forma, o resultado 0/0 para erros em alta confiança deve ser apresentado como não aplicável, pois não houve respostas nessa faixa. A concordância entre leitores e suas divergências ainda serão apuradas em separado.

## 8. Conclusão

O estudo produziu um conjunto rastreável de documentos, referências assistidas, regras versionadas e resultados reproduzíveis. A edição pública permite reconstruir as 30 instâncias textuais sintéticas e reproduzir as métricas e decisões dos quatro lotes avaliados com a versão 0.1.25. Esses controles sustentam a verificação técnica dos resultados, enquanto a independência das referências ainda depende da segunda leitura.

Os resultados mostram que a transcrição de páginas escaneadas pode viabilizar o processamento sem assegurar o preenchimento correto dos campos. Em sau-06, a etapa de OCR recuperou texto, mas as regras mantiveram a omissão de vigência e a abstenção nos demais campos. A comparação ampla com extração por modelo de linguagem em 18 documentos de desenvolvimento e 30 sintéticos não foi realizada; os pilotos disponíveis têm escopo menor. A continuidade deve priorizar a avaliação da segunda leitura, a análise das divergências e, em experimento separado e identificado, o tratamento de cláusulas condicionais e informações distribuídas em tabelas ou anexos. Os resultados atuais não sustentam preenchimento automático sem revisão do usuário.

## 9. Declaração de IA

Os parágrafos abaixo cobrem os pontos do checklist. Devem ser integrados à declaração já existente, preservando os demais usos de ferramentas efetivamente documentados.

### Item (ii): organização e validação estrutural

> O Codex, da OpenAI, foi utilizado como apoio à organização dos arquivos, à implementação dos verificadores e à revisão técnica. Os registros locais de contexto do chat do projeto identificam o modelo configurado como gpt-6-astra. A conferência incluiu 212 registros de contexto entre 13 de outubro e 6 de novembro de 2026, correspondentes a 193 identificadores de turno distintos. O identificador registrado não especifica uma revisão imutável dos pesos nem constitui atestação do servidor por geração. Os níveis de esforço foram registrados separadamente e não foram tratados como versões do modelo. As verificações de estrutura e as métricas foram executadas por programas e comparadores preservados com os artefatos; a assistência do modelo não constitui validação humana independente.

### Item (iii): localização dos trechos do gabarito

> Na localização e compreensão dos trechos das referências, o responsável declarou o uso de Claude Opus 5.5 para pub-alu-02 e pub-alu-03, e de GPT-6 Astra e Claude Opus para os dez documentos reservados. A versão do Claude nesse último grupo não foi recuperada. O identificador gpt-6-astra consta nos metadados locais do chat; a participação do Claude foi informada retrospectivamente pelo responsável, sem log externo apresentado. Nos dois contratos preenchidos, as perguntas incluíram valores ou trechos já sugeridos pela IA, sem confirmação de que derivavam de saídas do programa extrator. Para os dez reservados, o acesso direto ou indireto às saídas durante a preparação inicial não pôde ser confirmado nem excluído. As referências são assistidas, com conferência humana declarada, e não constituem anotação cega independente. A segunda leitura permanece pendente.
>
> Houve também análise assistida posterior com acesso às saídas do extrator: o registro de 19/10/2026 descreve a inspeção conjunta de páginas, referência e resultados de pub-alu-02. O procedimento de consolidação de 03/11 grava as referências e depois reúne gabaritos e saídas para comparação; os resultados aparecem no relatório dessa rodada. Esses registros documentam a análise posterior com os dois materiais disponíveis, sem identificar qual modelo externo participou de cada operação nem demonstrar ausência de exposição na preparação inicial.

### Uso da DeepSeek nos ensaios e na aplicação

> Nos ensaios preservados de 3 e 11 de novembro de 2026, a API DeepSeek recebeu e retornou o identificador deepseek-flash. Foram usados limite de 8.192 tokens por resposta e raciocínio desativado, sem temperatura explicitamente definida. As requisições, respostas e parâmetros estão registrados por ensaio. As chamadas examinadas foram realizadas em ambiente local de pesquisa, incluindo uso do handler da aplicação com identidade de teste. O código de configuração do site também declara deepseek-flash para texto e imagem; não foi recuperado um registro histórico do painel da Netlify que comprove os valores em produção na data das transcrições. O identificador do provedor é um alias, sem snapshot imutável documentado. Um registro local associado à implantação de 29/10 indica que as duas variáveis de modelo estavam configuradas em produção e correspondiam ao valor esperado na conferência, mas não preserva o valor literal nem o histórico até 03/11. Essa evidência adicional não permite afirmar continuidade da configuração no período.

## 10. Critérios para a revisão final

- Conferir se os itens 1, 3, 4, 5 e 6 foram efetivamente incorporados antes de remover suas notas.
- Não apresentar a primeira referência assistida como anotação cega independente. A segunda leitura ainda precisa retornar.
- Não declarar concluída a comparação ampla de 48 documentos com DeepSeek. Os pilotos têm outro escopo.
- Não atribuir aos experimentos locais uma execução na Netlify. O histórico do painel não foi recuperado.
- Não usar “7/7 estrutural”, “0% de erro em alta confiança” a partir de 0/0, ou “três campos recuperados” para o ganho de três ausências corretas.
- Preservar a distinção entre a versão de regras 0.1.25, as versões posteriores e o modelo de linguagem.
- Se citar o hash de prompt do piloto pub-alu-03, usar 19a1fd9bcf3ed2166a4223f077857cab6ba0721ad48b51684202919f45ea5515. O hash 08d75a31c8790ad75380aad8816dbf702bf541b391af0305d8e3bc37f36382df pertence ao ensaio posterior de campos.
- Conferir se a discussão usa vigência presente e reajuste ambíguo para sau-06. Os três outros campos estão ausentes na referência.
- Reservar a conclusão final de concordância e divergências para depois do retorno do leitor; manter a versão do artigo anterior à integração como histórico.

## 11. Progresso e entrega

Após a identificação documentada do item 9, o checklist tem seis entregas técnicas concluídas em 12 itens (50%), cinco itens com dependências e um opcional adiado. A montagem deste roteiro está concluída; ela não representa aplicação das alterações no artigo. Nenhuma chamada paga, alteração das regras ou nova avaliação humana foi realizada nesta preparação.

Este arquivo contém respostas e resultados: não o encaminhar ao segundo leitor antes da devolução da ficha. Para a equipe que integrará o artigo, ele é a entrada principal; o relatório técnico consolidado guarda o detalhamento e o histórico.

### Ordem das ações restantes

| Item | Situação atual | Próxima ação e responsável |
| --- | --- | --- |
| 2 | Três devoluções recebidas; diagnóstico preliminar concluído; validação formal pendente. | Receber complementos e declarações individuais, validar as devoluções e documentar as divergências e sua resolução. |
| 8 | Texto disponível, com lacunas históricas explícitas. | Confirmar versão do Claude e exposição às saídas se houver registro; na ausência dele, responsável pelo artigo avalia a limitação declarada. Não reconstruir esses fatos por suposição. |
| 10 | Modelo dos ensaios locais conferido; configuração histórica da Netlify parcialmente documentada. | Busca encerrada: responsável informou indisponibilidade do registro histórico. Incorporar a ressalva preparada; reabrir somente se surgir nova evidência. |
| 7 | Experimento opcional de 48 documentos adiado. | Manter a comparação como não realizada; não iniciar nova rodada paga para concluir esta entrega documental. |
| 11 | Atribuído a outra pessoa. | Responsável externo confirma as condições da revista. |
| 12 | Material separado de integração preparado. | Responsável pelo artigo incorpora os textos, resolve as dependências, revisa o PDF final e conduz a submissão. |

### Critério de fechamento conferido no PDF de 06/11

O item 8 exige nome e versão da ferramenta e informação sobre acesso direto ou indireto à saída do extrator. Não exige atribuição de modelo por ficha. A distribuição por documento permanece desconhecida, mas deixa de ser tratada como requisito adicional de fechamento.

O texto para a Seção 2.2 e a declaração (iii) está preparado com as informações disponíveis. A identificação geral das ferramentas foi declarada. Permanecem sem confirmação a versão do Claude nos dez reservados e a exposição às saídas do extrator durante a preparação inicial. Nos dois preenchidos, está confirmada a exposição a sugestões anteriores da IA; sua origem no programa extrator não foi estabelecida. Assim, o item 8 está documentado, mas não integralmente confirmado segundo o pedido original. Se não surgir registro histórico adicional, a pessoa responsável pelo artigo terá de avaliar a aceitação dessa limitação explícita.

## Item 10: histórico de deploy fornecido em 12/11/2026

O responsável forneceu transcrições da tela de deploys e dos logs da Netlify para o site salvaaifinc, contexto Production, branch main. Os registros abaixo são evidências fornecidas pelo usuário; não houve consulta autenticada ao painel nesta conferência. Os horários reproduzem a tela informada, sem fuso explícito. O ano foi cruzado com as datas dos commits locais.

| Data | Horário exibido | Commit | Resultado informado |
| --- | --- | --- | --- |
| 29/10/2026 | 12:40 | 1f77f6d | Failed |
| 29/10/2026 | 12:46 | dc3d546 | Deploy successful |
| 29/10/2026 | 12:49 | a99becf | Deploy successful |
| 03/11/2026 | 14:32 | 4adce4f | Deploy successful |
| 03/11/2026 | 20:56 | 297b986 | Deploy successful |

O primeiro deploy, 1f77f6d, falhou e não deve ser citado como publicação bem-sucedida. Os registros seguintes informam sucesso, incluindo duas versões de 03/11. O commit a99becf altera apenas o README. Nas versões dc3d546, 4adce4f e 297b986, a inspeção local confirmou deepseek-flash no .env.example para texto e imagem. O handler utiliza a variável de ambiente correspondente quando fornecida e só recorre a deepseek-flash quando ela está ausente ou vazia.

As linhas SECRETS_SCAN_OMIT_KEYS indicam quais nomes foram excluídos da varredura de segredos. Elas não exibem os valores de DEEPSEEK_MODEL ou DEEPSEEK_VISION_MODEL e não comprovam sequer que ambas as variáveis estavam definidas. Por isso, o sucesso do deploy e o padrão do código não bastam para determinar o modelo efetivo em produção.

Conclusão: a cronologia de implantação está documentada pelos registros fornecidos, e o padrão do código dessas versões foi conferido. A confirmação dos valores históricos das variáveis continua pendente. O item 10 permanece parcial, sem impedir a descrição dos modelos registrados nos experimentos locais. Não iniciar chamadas atuais para tentar comprovar uma configuração passada.

### Texto complementar para o artigo

> Os registros de implantação fornecidos pelo responsável indicam publicações bem-sucedidas em produção em 29/10 e 03/11/2026. O código dessas versões adotava deepseek-flash como padrão para texto e imagem, sujeito a substituição por variáveis de ambiente. Os trechos de log preservados mostram os nomes dispensados da varredura de segredos, mas não os valores dessas variáveis. Assim, a configuração efetiva histórica da hospedagem não foi confirmada. Essa limitação é distinta da identificação deepseek-flash registrada nas requisições e respostas dos experimentos locais.

O progresso global permanece em 6/12 entregas integralmente concluídas (50%).

## Encerramento da busca do item 10 (12/11/2026)

Após consultar o histórico, o responsável informou que não dispõe do registro dos valores das variáveis de modelo na época das transcrições. A busca fica encerrada com essa limitação. Não há confirmação histórica dos valores efetivos de DEEPSEEK_MODEL e DEEPSEEK_VISION_MODEL em produção.

Os registros fornecidos documentam deploys bem-sucedidos e o código consultado define deepseek-flash como padrão, substituível por variáveis de ambiente. A lista SECRETS_SCAN_OMIT_KEYS não informa esses valores. Os experimentos locais têm requisições e respostas próprias que identificam o modelo utilizado; não devem ser descritos como executados na Netlify.

Texto para o artigo:

> Não foi possível recuperar um registro histórico dos valores das variáveis de modelo da Netlify na data das transcrições. Os registros de implantação indicam publicações bem-sucedidas em 29/10 e 03/11/2026, cujo código adotava deepseek-flash como padrão, sujeito a substituição por configuração de ambiente. Portanto, não se afirma que esse era o valor efetivo em produção. Nos experimentos locais, o identificador deepseek-flash está documentado nas requisições e respostas preservadas.

Situação: tratamento documental concluído com limitação; comprovação solicitada no item 10 não obtida. Substituir orientações anteriores de continuar procurando esse histórico por esta conclusão, salvo surgimento de nova evidência. A pessoa responsável pelo artigo deve manter a ressalva na integração. Isso não promove o item a comprovação integral: o total permanece em 6/12 entregas integralmente atendidas (50%).

## Item 10: confirmação retrospectiva do responsável (12/11/2026)

O responsável informou o identificador deepseek-flash V4.1-Flash-1017 e confirmou que ele já era usado na época das implantações e transcrições discutidas neste item. A confirmação é retrospectiva; o registro histórico dos valores das variáveis da Netlify continua indisponível. A versão não foi verificada independentemente em log do provedor. Não foi inferida uma data exata de início de uso nem continuidade técnica a partir do sufixo do identificador.

### Redação atual para integrar ao artigo

> Segundo confirmação retrospectiva do responsável, a aplicação utilizava deepseek-flash, identificado por ele como V4.1-Flash-1017, no período das implantações de 29/10 e 03/11/2026. Não foi possível recuperar o histórico dos valores das variáveis da Netlify para verificar independentemente essa configuração. Nos experimentos locais, as requisições e respostas preservadas identificam o alias deepseek-flash; esses registros não comprovam, por si só, a versão adicional informada.

Esta declaração substitui o estado anterior de associação temporal ainda não esclarecida. O tratamento documental do item 10 está encerrado com confirmação do responsável e ressalva sobre a ausência de verificação técnica histórica. Não é necessário repetir a solicitação de um histórico que o responsável informou não ter. Para a contagem estrita das exigências comprovadas, permanecem seis itens integralmente atendidos em doze (50%), mais este item encerrado documentalmente com ressalva.

## Encerramento documental do item 8 (12/11/2026)

O texto de procedência está concluído com as informações recuperadas e declaradas pelo responsável. Para pub-alu-02 e pub-alu-03, registrar Claude Opus 5.5 conforme declaração retrospectiva, com perguntas que incluíram valores ou trechos sugeridos anteriormente pela IA. Para os dez reservados, registrar GPT-6 Astra e Claude Opus, sem atribuir uma versão específica ao Claude. O identificador gpt-6-astra consta nos metadados locais deste chat.

Houve acesso às saídas do extrator em análises assistidas posteriores, conforme registros preservados. A exposição durante a preparação inicial não pôde ser integralmente reconstruída. A origem de cada sugestão anterior em uma saída do programa extrator também não foi estabelecida. Assim, manter a classificação de referências assistidas e não afirmar anotação cega independente para o primeiro gabarito.

O item fica encerrado documentalmente com ressalvas explícitas, sem atestar que todos os fatos históricos foram comprovados. Reabrir a investigação somente se surgir evidência adicional. A integração e a avaliação editorial dessas ressalvas continuam com a pessoa responsável pelo artigo. Este encerramento não conclui o item 2, não aprova as erratas propostas e não altera gabaritos ou métricas.
