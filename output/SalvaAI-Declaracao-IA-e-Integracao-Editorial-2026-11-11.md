# SalvaAI: declaração de IA e integração dos resultados

## Status consolidado em 13/11/2026

| Itens | Situação atual |
| --- | --- |
| 1, 2, 3, 4, 5, 6, 7 e 9 | Entregas técnicas integralmente concluídas; conteúdo disponível para integração editorial (Item 2 concluído em 13/11/2026 com 3/3 declarações, 3/3 validações formais no `avaliar_leitura.py` e adjudicação 26/26 pares; Item 7 concluído em 13/11/2026 nos 48 documentos com `deepseek-flash`, 87 chamadas / 674.533 tokens, ver `SalvaAI-Item7-Comparacao-DeepSeek-2026-11-13.md`). |
| 8 e 10 | Tratamento documental encerrado com ressalvas explícitas (atualizado em 13/11/2026: Claude Opus 5.5 declarado nos 10 reservados no Item 8; lançamento de DeepSeek-V4.1-Flash-1017 em 17/10/2026 informado no Item 10); lacunas de log histórico externo não convertidas em comprovação independente. |
| 11 | Responsabilidade externa: confirmação das condições da revista. |
| 12 | Material separado preparado; integração, revisão final, PDF e submissão pendentes. |

Há **8/12 itens integralmente comprovados (`66,7%`)** e **10/12 com tratamento técnico/documental encerrado, incluindo duas ressalvas (`83,3%`)**. Esses são indicadores diferentes. Não representam aprovação do artigo, conclusão do aplicativo ou fração do tempo restante. Este quadro substitui os percentuais e estados históricos anteriores para acompanhamento atual.

No item 2, encaminhar apenas o pacote individual a cada leitor. A coordenação recebe as cinco erratas propostas e a fila de decisões; essas informações não devem ser repassadas a leitores que ainda complementam suas fichas. Nenhuma resposta ou aprovação humana deve ser preenchida pelo assistente.

Atualização: 11/11/2026. Numeração conforme SalvaAI_Pendencias_06-11.pdf. Material destinado à pessoa que fará a revisão e a incorporação no artigo. O arquivo do artigo não foi editado.

## 1. O que foi concluído nesta rodada

Foram conferidas as 12 fichas de referência, os registros de 101 chamadas históricas à DeepSeek, a configuração de exemplo no commit 297b986 e os documentos de procedência disponíveis. A conferência foi local, sem novas chamadas pagas. Foram preparados textos para metodologia, declaração de IA, discussão e conclusão.

| Item | Resultado da conferência | O que ainda impede o fechamento integral |
| --- | --- | --- |
| 8. Ferramenta que auxiliou o gabarito | Claude Opus 5.5 declarado para pub-alu-02 e pub-alu-03, com perguntas que incluíam valores/trechos sugeridos nesta conversa. | Confirmar versão do Claude nos dez reservados e acesso às saídas do extrator; o texto declara as lacunas existentes. |
| 9. Versão do GPT | Identificação concluída: gpt-6-astra nos metadados locais do chat. | Inserir a declaração atualizada, preservando a limitação de snapshot imutável. |
| 10. DeepSeek em produção | Alias solicitado e retornado conferido em 101 chamadas; configuração versionada identificada. | Falta registro datado do painel ou log de configuração da Netlify que comprove as variáveis na data das transcrições. Os ensaios examinados foram locais. |
| 12. Preparação editorial | Blocos revisados e roteiro de integração prontos neste arquivo. | Inserção no artigo, segunda leitura, revisão final, exigências da revista e submissão continuam com seus responsáveis. |

Progresso desta rodada: 3/3 itens de rastreabilidade examinados (100% da conferência delimitada) e 4/4 blocos editoriais preparados (100% da preparação). O item 9 foi posteriormente concluído quanto à identificação disponível, conforme a seção 3. Os itens 8, 10 e 12 continuam com as lacunas indicadas. Esses percentuais não representam validação científica concluída.

## 2. Item 8: procedência do gabarito e exposição às respostas

As fichas registram revisão única, sem segunda pessoa revisora. O identificador publicado é usuario-revisao-assistida-01; as 12 cópias públicas mantêm confirmacao_leitura_humana=false. Esse sinalizador registra a falta de comprovação de leitura independente, sem apagar a conferência humana declarada pelo usuário.

| Grupo | Evidência disponível | Ferramenta/modelo | Exposição e limite da conclusão |
| --- | --- | --- | --- |
| pub-alu-03 | Procedência anterior preservada; identificação complementar declarada pelo usuário em 11/11/2026. | Claude Opus 5.5, conforme declaração do usuário. | Perguntas incluíram valores/trechos sugeridos nesta conversa. Referência assistida, com revisão humana declarada, sem independência cega. |
| pub-alu-02 | Ajuda de IA já declarada em 18/10; modelo e conteúdo das perguntas esclarecidos em 11/11/2026. | Claude Opus 5.5, conforme declaração do usuário. | Perguntas incluíram valores/trechos sugeridos nesta conversa. A declaração inicial de não exposição não descreve integralmente o procedimento esclarecido posteriormente. |
| Dez documentos reservados | Procedência registrada em 03/11: revisão humana com localização assistida por IA, sem independência certificada. | GPT-6 Astra e Claude Opus declarados posteriormente para o grupo, sem distribuição por documento. | A procedência declara anotação anterior à execução no reservado. O script preservado grava referências e depois roda a comparação; essa ordem não demonstra ausência de exposição em conversas ou execuções anteriores. |

O script consolidar-e-avaliar-reservados.py contém os campos de referência e os usa na avaliação das mesmas regras. A existência desse script demonstra a consolidação e o acesso às duas representações nessa atividade; não identifica qual modelo localizou cada trecho antes disso. A pasta de trabalho Antigravity e o repasse com nomes Claude/GPT-6 também não identificam, sozinhos, o modelo que produziu cada anotação.

Classificação adotada: referências assistidas, com revisão humana declarada e influência de respostas anteriores confirmada para os dois contratos preenchidos. O esclarecimento não prova que os valores/trechos usados nas perguntas foram produzidos pelo programa extrator; sua procedência exata não foi reconstruída. A relação com respostas anteriores está documentada sem afirmar uma origem técnica que o usuário não especificou.

O modelo é registrado como “Claude Opus 5.5, conforme declaração do usuário”. Não há log da sessão externa ou identificador de API/snapshot para conferência independente. Os arquivos originais e suas datas permanecem preservados; a informação nova está no registro complementar item8-declaracao-usuario-2026-11-11.json. Nenhum sinalizador de cegamento, valor de referência ou resultado de avaliação foi alterado.

A identificação dos dois contratos preenchidos está documentada em 2/2 casos (100% desse recorte). O item 8 completo continua parcial porque a atribuição de ferramenta/modelo nos dez documentos reservados não foi resolvida por essa declaração. O item 11 foi atribuído pelo usuário a outra pessoa e não faz parte das próximas ações desta atividade.

### Busca no histórico sobre os dez reservados (11/11/2026)

A consulta ao histórico deste chat e ao repasse anexado recuperou a sequência abaixo. Horários de Brasília (UTC−03).

| Data e horário | Registro encontrado | O que demonstra |
| --- | --- | --- |
| 03/11/2026, 16:06 | Pedido do usuário para preparar um prompt de continuidade dos testes no Claude. | Destino solicitado para o repasse. |
| 03/11/2026, 16:08 | Pedido para incluir também as outras pendências no repasse. | Ampliação do escopo solicitado. |
| 03/11/2026, 21:10 | Retorno de um repasse atualizado que descreve os dez gabaritos reservados como concluídos. | O pacote retornado já declarava a preparação das dez referências. |

Essa sequência sustenta a hipótese de continuidade no Claude, mas não comprova que ele preparou cada ficha nem identifica a versão Opus utilizada. O repasse menciona Claude, GPT-6 e Antigravity; as dez fichas registram assistência de IA sem identificar ferramenta ou modelo por documento. A declaração recente de Claude Opus 5.5 aplica-se aos dois contratos preenchidos, pub-alu-02 e pub-alu-03, e não foi estendida aos dez reservados.

A ausência de identificação no material consultado não comprova autoria por outra ferramenta. Para os dez reservados, a redação adotada é “assistência de IA; ferramenta/modelo por episódio não recuperados com certeza”. Não há base para registrar Opus 5.5 como fato nesse grupo. A procedência e os resultados originais foram preservados. A auditoria está em declaracao-ia-2026-11-11/item8-busca-historico-2026-11-11.json; o histórico completo não foi copiado.

O item 8 permanece parcial. O total de entregas técnicas concluídas permanece em 6/12 (50%); essa porcentagem não mede a conclusão do aplicativo.

### Esclarecimento complementar sobre os dez reservados (11/11/2026)

O responsável informou o uso de GPT-6 Astra e Claude Opus na preparação das referências dos dez contratos reservados. A mensagem original foi “Se é parcial foi com gpt6 astra e claude xode opus”. A expressão referente ao Claude foi registrada como Claude Opus, sem inferir versão específica nem confirmar qual interface foi utilizada.

A identificação das ferramentas no conjunto passa a estar declarada pelo responsável. A busca anterior continua válida quanto à ausência de registros que atribuam cada ficha a um modelo. O identificador gpt-6-astra consta nos metadados deste chat; a participação do Claude nesse grupo é uma declaração retrospectiva. O relato anterior de Opus 5.5 permanece limitado aos dois contratos preenchidos.

Esta atualização complementa a procedência e substitui a indicação de ferramentas inteiramente desconhecidas no conjunto reservado. As referências continuam assistidas, com revisão humana declarada; a segunda leitura independente permanece pendente. A versão do Claude nos dez reservados e a exposição às saídas do extrator continuam sem confirmação. A atribuição por ficha não é exigida pelo checklist. O item 8 permanece parcial nesses pontos; o total permanece em 6/12 entregas técnicas concluídas (50%).

### Item 8: acesso às saídas por etapa

| Etapa | O que está documentado | Limite |
| --- | --- | --- |
| Preparação de pub-alu-02 e pub-alu-03 | Claude Opus 5.5 declarado pelo responsável; perguntas incluíam sugestões anteriores da IA. | A origem de cada sugestão em saída do programa extrator não foi estabelecida. |
| Preparação dos dez reservados | GPT-6 Astra e Claude Opus declarados pelo responsável. | Versão específica do Claude e exposição inicial às saídas não recuperadas. |
| Revisão assistida posterior, 19/10/2026 | O registro de pub-alu-02 declara consulta conjunta às páginas, à referência e às saídas. | Confirma acesso nessa revisão posterior; não comprova exposição na anotação inicial. |
| Consolidação e comparação, 03/11/2026 | O script grava referências antes da comparação, reúne gabaritos e saídas e imprime os resultados por campo. O relatório preservado apresenta essa comparação. | A ordem estática do script não comprova a ordem de todas as atividades anteriores nem identifica o modelo externo que leu seus resultados. |

A declaração deve informar o acesso às saídas na análise posterior e a incerteza sobre a preparação inicial. Não é adequado afirmar ausência geral de acesso, nem concluir que todas as referências foram copiadas das saídas.

A redação e a conferência documental do item 8 estão concluídas com as fontes disponíveis. O atendimento integral ao pedido permanece parcial pela versão do Claude não recuperada e pela exposição inicial não esclarecida. A segunda leitura é o item 2 e não foi realizada nesta atividade. Repetir as extrações agora não recuperaria a procedência histórica. Uma nova busca só será útil se surgir registro adicional da sessão externa ou do procedimento original.

Fontes locais: experiments/contracts/analise-assistida-0118.md, docs/artigo-itens-1-2-4-5-6-consolidacao-2026-11-03.md e o script histórico consolidar-e-avaliar-reservados.py. A auditoria de linhas e hashes está em declaracao-ia-2026-11-11/item8-acesso-saidas-2026-11-11.json. O script histórico foi apenas lido, sem execução.

### Texto para a Seção 2.2

> As referências foram preparadas com assistência de IA e conferência humana declarada pelo responsável. Para pub-alu-02 e pub-alu-03, ele informou o uso de Claude Opus 5.5 e de perguntas que incluíam valores ou trechos sugeridos anteriormente neste chat. Para os dez documentos reservados, declarou o uso de GPT-6 Astra e Claude Opus, sem identificar a versão específica do Claude. Os metadados locais identificam gpt-6-astra como modelo configurado neste chat; as informações sobre Claude são declarações retrospectivas, sem log externo apresentado. Nos dois contratos preenchidos houve exposição a respostas anteriores da IA, mas não foi estabelecido se essas sugestões provinham de saídas do programa extrator. Nos dez reservados, não foi possível confirmar nem excluir acesso direto ou indireto às saídas durante a preparação inicial. A ordem de gravação das referências e execução da comparação no script preservado não demonstra ausência de exposição anterior. Por isso, os resultados são apresentados em relação a referências assistidas, sem certificação de anotação cega independente. A segunda leitura permanece pendente e seus resultados não integram as métricas apresentadas.

## 3. Item 9: identificação do GPT recuperada

Na conferência ampliada de 11/11/2026, foi localizado o log local do chat “Revisar projeto Salva-ai”, associado ao diretório AgentFinanceiro. Os 282 registros turn_context examinados contêm model=gpt-6-astra. Eles correspondem a 260 identificadores de turno distintos; registros repetidos não foram contados como atividades adicionais. O metadado da sessão identifica model_provider=openai e a ferramenta Codex.

No período de 13/10 a 06/11/2026, considerado por datas UTC, há 212 registros de contexto e 193 identificadores de turno distintos, todos com o mesmo identificador de modelo. Essa é a fonte que permite substituir a identificação genérica anterior por gpt-6-astra na declaração do artigo. Os metadados indicam a configuração do chat, sem constituir atestação de qual backend respondeu a cada geração.

O log registra os esforços low, medium e high em campo separado. A versão do cliente Codex também é distinta do identificador do modelo. Nenhum desses campos deve ser convertido em uma versão de pesos não documentada. Não foi identificado um snapshot imutável do modelo; essa limitação permanece explícita.

A auditoria item9-modelo-codex.json contém somente metadados selecionados: modelo, esforço, data, identificador de turno, número da linha e hash da linha de origem. O log completo não foi copiado ou publicado. Como ele continua crescendo, a integridade da consulta foi registrada pelo tamanho e SHA-256 do prefixo lido, em vez de atribuir um hash permanente ao arquivo ativo.

Esta identificação se aplica ao Codex neste chat do projeto. Ela não determina qual ferramenta externa o usuário consultou nas fichas, nem o modelo usado em outras ferramentas, como Claude ou Antigravity. Portanto, não encerra o item 8.

Estado do item 9: entrega técnica concluída quanto à identificação disponível do modelo, com a limitação de snapshot declarada. O texto está pronto para inserção no item (ii) da declaração de IA. Esta atualização substitui a afirmação anterior de que o identificador histórico não havia sido localizado.

## 4. Item 10: o que está comprovado sobre a DeepSeek

Foram confrontados os metadados de requisição e de resposta, sem reexecutar as chamadas. As contagens abaixo incluem chamadas concluídas pelo provedor cuja resposta foi posteriormente recusada pelo validador da aplicação.

| Ensaio | Ambiente registrado | Chamadas | Modelo solicitado/retornado | Entrada | Saída | Total de tokens |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| pub-alu-03, 03/11/2026 | Handler local com identidade de teste injetada | 1 | deepseek-flash | 6.239 | 977 | 7.216 |
| sau-04 e sau-05, 03/11/2026 | Adaptador local de pesquisa; 74 chamadas de OCR e uma de campos | 75 | deepseek-flash | 117.117 | 57.073 | 174.190 |
| sau-06, 11/11/2026 | Adaptador local de pesquisa; 25 chamadas de OCR | 25 | deepseek-flash | 31.025 | 28.760 | 59.785 |
| Total conferido | Três ensaios distintos | 101 | Coincidente em todas as chamadas | 154.381 | 86.810 | 241.191 |

Parâmetros registrados: max_tokens=8192, thinking={type:disabled}, temperatura não enviada explicitamente. No ensaio de sau-06, os metadados também preservam response_format={type:json_object}, texto de instrução e hash da requisição por página. Os históricos registram ausência de repetição automática. Alias retornado não é garantia de pesos imutáveis; os registros não fornecem uma revisão imutável do modelo.

Os 75 retornos do ensaio de sau-04/sau-05 tiveram HTTP 200, mas só 73/74 transcrições passaram na validação original. Uma transcrição foi recuperada offline; o JSON inválido da extração direta de campos continuou recusado. Aceitação HTTP ou JSON não equivale a acerto dos campos.

### Configuração do site versus configuração do experimento

No commit 297b986, .env.example contém DEEPSEEK_MODEL=deepseek-flash e DEEPSEEK_VISION_MODEL=deepseek-flash. O código do servidor também admite esse alias como padrão quando a variável correspondente não é fornecida. Isso confirma a configuração declarada no código, mas não demonstra os valores efetivos no painel da Netlify em 03/11.

A documentação operacional registra configuração e teste de produção em 29/10. É um relato histórico do projeto, com força de evidência diferente de uma exportação datada das variáveis. Nenhum valor atual do painel foi usado como prova de configuração passada. Os manifestos de 03/11 identificam ambientes locais; sau-06 também foi processado localmente. Portanto, os modelos desses ensaios estão documentados independentemente da lacuna sobre a hospedagem.

Para cumprir literalmente o item 10, falta um registro histórico da hospedagem que mostre apenas os nomes e valores das variáveis de modelo, contexto e data. Não é necessário expor chave de API. Se esse histórico não existir, o artigo deve registrar a limitação e evitar atribuir as transcrições experimentais à Netlify.

### Conferência adicional de 11/11: registro de produção de 29/10

Foi localizado deploy-20261029/environment.json, um registro local da conferência das variáveis da hospedagem. Para DEEPSEEK_MODEL e DEEPSEEK_VISION_MODEL, ele informa productionConfigured=true e valueMatches=true, com o escopo functions entre os escopos registrados. O arquivo não contém o valor literal usado na comparação nem timestamp interno. A associação a 29/10 provém da pasta da rodada e é contextual; não deve ser apresentada como data certificada do painel.

Na mesma pasta, production-checks.json registra checkedAt=2026-10-29T15:47:21.151Z e HTTP 200 para chat, contract-ocr e statement-recovery. O script preservado usa a URL de produção salvaaifinc.netlify.app. Isso acrescenta evidência de funcionamento da aplicação nessa data, mas as respostas HTTP da aplicação não demonstram por si só qual modelo do provedor respondeu.

| Evidência | O que sustenta | Limite |
| --- | --- | --- |
| environment.json | As duas variáveis de modelo foram registradas como configuradas em produção e correspondentes ao valor esperado na conferência local. | Sem valor literal, timestamp interno ou histórico de alterações. |
| production-checks.json | Três ações de IA responderam HTTP 200 na verificação datada de 29/10. | Não registra o identificador retornado pelo provedor. |
| .env.example em 297b986 | O código declara deepseek-flash para texto e imagem. | Não comprova o conteúdo efetivo do painel na data desejada. |
| Requisições/respostas dos ensaios | O alias deepseek-flash está documentado nas chamadas locais de 03/11 e 11/11. | Não são chamadas de comprovação da configuração histórica da Netlify. |

A consulta atual ao painel não foi concluída: não havia autenticação utilizável na configuração local da CLI; os dois mecanismos disponíveis de controle do navegador falharam ao iniciar, com “failed to write kernel assets” e erro de caminho do sistema. Nenhuma chamada autenticada à API da Netlify foi feita. Essa falha não prova indisponibilidade do site, ausência de histórico na conta ou restrição do plano.

A documentação da Netlify informa que alterações de variáveis são registradas no audit log e que o recurso de auditoria está disponível nos planos Pro e Enterprise. A disponibilidade na conta deste projeto ainda não foi conferida. Fontes: [logs da Netlify](https://docs.netlify.com/manage/monitoring/logs/) e [variáveis de ambiente](https://docs.netlify.com/build/environment-variables/overview/). A [API oficial](https://open-api.netlify.com/) também documenta a consulta de eventos de auditoria.

Foi solicitado ao usuário verificar se o histórico de 29/10 a 03/11 está disponível no painel. Para fechar o item, é necessário relacionar os eventos às variáveis de modelo, ao contexto de produção e ao período das transcrições, sem divulgar credenciais. A ausência de um evento numa página isolada não demonstra ausência de mudanças: é preciso conferir o período e a abrangência da consulta. Não é necessário contratar um plano ou alterar a hospedagem para prosseguir com o artigo; na falta do registro, mantém-se a limitação histórica explícita.

O registro adicional está em declaracao-ia-2026-11-11/item10-historico-netlify.json, com hashes das fontes e sem credenciais. O item 10 continua parcialmente resolvido; a evidência adicional não autoriza marcar confirmação integral do painel em 03/11.

### Correção de rastreabilidade do prompt

O arquivo request.json do piloto pub-alu-03 registra promptSha256=19a1fd9bcf3ed2166a4223f077857cab6ba0721ad48b51684202919f45ea5515. O relatório de 03/11 atribuiu a esse piloto o hash 08d75a31c8790ad75380aad8816dbf702bf541b391af0305d8e3bc37f36382df, presente no ensaio posterior de extração de campos. Usar o hash da requisição efetivamente salva para cada ensaio, sem presumir igualdade com base apenas no rótulo de versão 1.0.1. O hash registrado para OCR em sau-04/sau-05 é 91c02baf1780cef500c023057d79986aa0acdc95f81f1d163c5c18842df6e6aa. A auditoria reproduz os valores dos arquivos; não reconstrói a convenção histórica de cálculo desses hashes.

## 5. Declaração de IA: texto para os trechos solicitados

Os parágrafos abaixo cobrem os pontos do checklist. Devem ser integrados à declaração já existente, preservando os demais usos de ferramentas efetivamente documentados.

### Item (ii): organização e validação estrutural

> O Codex, da OpenAI, foi utilizado como apoio à organização dos arquivos, à implementação dos verificadores e à revisão técnica. Os registros locais de contexto do chat do projeto identificam o modelo configurado como gpt-6-astra. A conferência incluiu 212 registros de contexto entre 13 de outubro e 6 de novembro de 2026, correspondentes a 193 identificadores de turno distintos. O identificador registrado não especifica uma revisão imutável dos pesos nem constitui atestação do servidor por geração. Os níveis de esforço foram registrados separadamente e não foram tratados como versões do modelo. As verificações de estrutura e as métricas foram executadas por programas e comparadores preservados com os artefatos; a assistência do modelo não constitui validação humana independente.

### Item (iii): localização dos trechos do gabarito

> Na localização e compreensão dos trechos das referências, o responsável declarou o uso de Claude Opus 5.5 para pub-alu-02 e pub-alu-03, e de GPT-6 Astra e Claude Opus para os dez documentos reservados. A versão do Claude nesse último grupo não foi recuperada. O identificador gpt-6-astra consta nos metadados locais do chat; a participação do Claude foi informada retrospectivamente pelo responsável, sem log externo apresentado. Nos dois contratos preenchidos, as perguntas incluíram valores ou trechos já sugeridos pela IA, sem confirmação de que derivavam de saídas do programa extrator. Para os dez reservados, o acesso direto ou indireto às saídas durante a preparação inicial não pôde ser confirmado nem excluído. As referências são assistidas, com conferência humana declarada, e não constituem anotação cega independente. A segunda leitura permanece pendente.
>
> Houve também análise assistida posterior com acesso às saídas do extrator: o registro de 19/10/2026 descreve a inspeção conjunta de páginas, referência e resultados de pub-alu-02. O procedimento de consolidação de 03/11 grava as referências e depois reúne gabaritos e saídas para comparação; os resultados aparecem no relatório dessa rodada. Esses registros documentam a análise posterior com os dois materiais disponíveis, sem identificar qual modelo externo participou de cada operação nem demonstrar ausência de exposição na preparação inicial.

### Uso da DeepSeek nos ensaios e na aplicação

> Nos ensaios preservados de 3 e 11 de novembro de 2026, a API DeepSeek recebeu e retornou o identificador deepseek-flash. Foram usados limite de 8.192 tokens por resposta e raciocínio desativado, sem temperatura explicitamente definida. As requisições, respostas e parâmetros estão registrados por ensaio. As chamadas examinadas foram realizadas em ambiente local de pesquisa, incluindo uso do handler da aplicação com identidade de teste. O código de configuração do site também declara deepseek-flash para texto e imagem; não foi recuperado um registro histórico do painel da Netlify que comprove os valores em produção na data das transcrições. O identificador do provedor é um alias, sem snapshot imutável documentado.

## 6. Discussão dos resultados: texto revisado

> A reprodução das quatro avaliações da versão 0.1.25 confirmou os relatórios preservados, mas a interpretação dos resultados exige distinguir contratos públicos, referências assistidas e instâncias sintéticas. Os sintéticos verificam o comportamento das regras em condições controladas. Seu gabarito e seus modelos de origem têm vínculos com o desenvolvimento, o que limita a extrapolação para contratos reais não vistos. Nos contratos preenchidos, o resultado exato foi de um acerto entre sete respostas emitidas. A auditoria não sustentou a afirmação anterior de sete acertos estruturais, pois identificou, além de diferenças textuais e de abrangência, uma divergência de representação no reajuste de pub-alu-02.
>
> A análise complementar de sau-06 separou transcrição e reconhecimento dos campos: as mesmas 25 imagens foram processadas por Tesseract e DeepSeek, e os textos resultantes foram submetidos às mesmas regras congeladas. Os dois caminhos concluíram as páginas e produziram quatro campos não identificados e reajuste ambíguo, sem campo encontrado. Na referência assistida, valor, quantidade de parcelas e vencimento estão ausentes; vigência está presente; reajuste é ambíguo e não integra os pares decidíveis. O acerto global do reservado passou de 18/39 (46,15%) para 21/39 (53,85%), exclusivamente por três ausências corretamente reconhecidas. A precisão permaneceu 1/4 e a revocação 1/15. O ganho de acerto não representa recuperação de três valores financeiros.
>
> A cláusula de vigência aparece nas duas transcrições, mas não foi reconhecida pelas regras congeladas. Esse caso evidencia uma limitação de reconhecimento após a leitura do texto. A coincidência dos estados finais em um documento não demonstra equivalência geral entre os motores de OCR. Não há referência independente de transcrição para calcular taxa de erro de caracteres ou palavras. Da mesma forma, o resultado 0/0 para erros em alta confiança deve ser apresentado como não aplicável, pois não houve respostas nessa faixa. A concordância entre leitores e suas divergências ainda serão apuradas em separado.

## 7. Conclusão: texto revisado

> O estudo produziu um conjunto rastreável de documentos, referências assistidas, regras versionadas e resultados reproduzíveis. A edição pública permite reconstruir as 30 instâncias textuais sintéticas e reproduzir as métricas e decisões dos quatro lotes avaliados com a versão 0.1.25. Esses controles sustentam a verificação técnica dos resultados, enquanto a independência das referências ainda depende da segunda leitura.
>
> Os resultados mostram que a transcrição de páginas escaneadas pode viabilizar o processamento sem assegurar o preenchimento correto dos campos. Em sau-06, a etapa de OCR recuperou texto, mas as regras mantiveram a omissão de vigência e a abstenção nos demais campos. A comparação ampla com extração por modelo de linguagem em 18 documentos de desenvolvimento e 30 sintéticos não foi realizada; os pilotos disponíveis têm escopo menor. A continuidade deve priorizar a avaliação da segunda leitura, a análise das divergências e, em experimento separado e identificado, o tratamento de cláusulas condicionais e informações distribuídas em tabelas ou anexos. Os resultados atuais não sustentam preenchimento automático sem revisão do usuário.

## 8. Errata do relatório de OCR

Corrigidos dois trechos explicativos que descreviam, incorretamente, vigência e reajuste como campos presentes em sau-06. A referência original registra vigência presente e reajuste ambíguo. A tabela original já estava correta. Os relatórios de métricas, as referências e os dados brutos não foram alterados; permanecem D=39, G=15, P=4 e ganho de três ausências corretas. Também foi ajustada a notação dos tempos para 134,382 segundos e 179,653 segundos, com seus valores em milissegundos.

A correção foi aplicada ao relatório individual do item 6 e ao consolidado. A cópia arquivada na pasta original do experimento permanece histórica; esta errata a acompanha. Os hashes antes/depois das alterações editoriais constam em declaracao-ia-2026-11-11/errata-item6.json.

## 9. Roteiro de integração e pendências restantes

| Destino | Ação pronta para a pessoa responsável |
| --- | --- |
| Seção 2.2 e declaração (iii) | Incorporar a procedência assistida e a limitação de identificação/exposição; completar apenas com informação histórica confirmada. |
| Declaração (ii) | Usar Codex/gpt-6-astra conforme os registros locais; distinguir identificador de configuração e snapshot imutável não documentado. |
| Declaração DeepSeek | Identificar o alias por ensaio e separar ambiente local da configuração de produção não comprovada. |
| Seção 3.3 e Tabela 5 | Manter a linha histórica e acrescentar os dois cenários de OCR de sau-06; não sobrescrever o resultado original. |
| Discussão | Retirar 7/7 estrutural, explicar o ganho por ausências, registrar reajuste ambíguo e manter 0/0 como N/A. |
| Conclusão | Limitar as conclusões à evidência existente, sem antecipar concordância ou equivalência de OCR. |
| Item 7 opcional | Se a rodada ampla continuar adiada, retirar somente a nota amarela correspondente; preservar a informação de que a comparação não foi realizada. |
| Itens 2, 11 e 12 | Aguardar a segunda leitura; equipe confirma condições da revista; responsável incorpora, revisa e gera o PDF final antes da submissão. |

Não enviar este relatório ao segundo leitor antes da entrega das respostas: ele contém estados e resultados dos documentos. O kit cego e as fichas originais foram preservados. Nenhuma concordância, kappa ou adjudicação foi calculada nesta rodada.

## 10. Fontes e limites da auditoria

O arquivo declaracao-ia-2026-11-11/auditoria.json registra caminhos e SHA-256 das fontes examinadas, a procedência resumida das 12 fichas, os metadados das 101 chamadas e as linhas públicas de modelo do commit 297b986. Não contém chaves de API nem cabeçalhos de autorização.

Fontes principais: fichas em experiments/contracts/data/gabaritos; cópias públicas em experiments/contracts/evidence-20261110/gabaritos; analise-assistida-0118.md; kanban e repasse de 03/11; ia-centralizada.md; script histórico consolidar-e-avaliar-reservados.py; artefatos contracts-direct-live-20261103, item8-deepseek-comparacao-20261103 e item6-sau06-20261111.

A busca foi delimitada aos arquivos do projeto e aos artefatos desses ensaios. A ausência de um dado nessas fontes não prova que ele inexista em outro histórico. Não houve consulta à conta do provedor ou ao histórico administrativo da Netlify, reexecução paga, alteração do extrator, publicação ou edição do artigo original.

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

### Identificador adicional informado pelo responsável

Em 12/11/2026, o responsável informou “deepseek-flash V4.1-Flash-1017”. A origem desse identificador e sua associação às chamadas históricas ainda precisam ser esclarecidas. Registrar como versão informada pelo responsável, sem substituir o alias deepseek-flash efetivamente preservado nos registros nem afirmar uma configuração histórica da Netlify. O sufixo 1017 não foi interpretado como prova de data. Esta informação não altera, por enquanto, o encerramento com limitação do item 10.

## Item 10: confirmação retrospectiva do responsável (12/11/2026)

O responsável informou o identificador deepseek-flash V4.1-Flash-1017 e confirmou que ele já era usado na época das implantações e transcrições discutidas neste item. A confirmação é retrospectiva; o registro histórico dos valores das variáveis da Netlify continua indisponível. A versão não foi verificada independentemente em log do provedor. Não foi inferida uma data exata de início de uso nem continuidade técnica a partir do sufixo do identificador.

### Redação atual para integrar ao artigo

> Segundo confirmação retrospectiva do responsável, a aplicação utilizava deepseek-flash, identificado por ele como V4.1-Flash-1017, no período das implantações de 29/10 e 03/11/2026. Não foi possível recuperar o histórico dos valores das variáveis da Netlify para verificar independentemente essa configuração. Nos experimentos locais, as requisições e respostas preservadas identificam o alias deepseek-flash; esses registros não comprovam, por si só, a versão adicional informada.

Esta declaração substitui o estado anterior de associação temporal ainda não esclarecida. O tratamento documental do item 10 está encerrado com confirmação do responsável e ressalva sobre a ausência de verificação técnica histórica. Não é necessário repetir a solicitação de um histórico que o responsável informou não ter. Para a contagem estrita das exigências comprovadas, permanecem seis itens integralmente atendidos em doze (50%), mais este item encerrado documentalmente com ressalva.

## Encerramento documental do item 8 (12/11/2026)

O texto de procedência está concluído com as informações recuperadas e declaradas pelo responsável. Para pub-alu-02 e pub-alu-03, registrar Claude Opus 5.5 conforme declaração retrospectiva, com perguntas que incluíram valores ou trechos sugeridos anteriormente pela IA. Para os dez reservados, registrar GPT-6 Astra e Claude Opus, sem atribuir uma versão específica ao Claude. O identificador gpt-6-astra consta nos metadados locais deste chat.

Houve acesso às saídas do extrator em análises assistidas posteriores, conforme registros preservados. A exposição durante a preparação inicial não pôde ser integralmente reconstruída. A origem de cada sugestão anterior em uma saída do programa extrator também não foi estabelecida. Assim, manter a classificação de referências assistidas e não afirmar anotação cega independente para o primeiro gabarito.

O item fica encerrado documentalmente com ressalvas explícitas, sem atestar que todos os fatos históricos foram comprovados. Reabrir a investigação somente se surgir evidência adicional. A integração e a avaliação editorial dessas ressalvas continuam com a pessoa responsável pelo artigo. Este encerramento não conclui o item 2, não aprova as erratas propostas e não altera gabaritos ou métricas.
