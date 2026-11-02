# Validação da versão 6 e do feedback do professor

Data: 20/10/2026. Fontes: `C:/Users/Vitor/Downloads/SalvaAI_6V.pdf` (46 páginas) e `C:/Users/Vitor/Downloads/Feedback - PROFESSOR.pdf` (6 páginas), comparadas com a pasta de trabalho atual.

**Convenção de páginas:** todas as referências usam a posição no leitor de PDF. A partir da introdução, a numeração impressa está uma página atrás: PDF 31 = página impressa 30. O sumário aponta posições do arquivo, não a numeração impressa; precisa de atualização consistente.

## Parecer

A versão 6 responde a várias solicitações documentais do professor, mas ainda não comprova a conclusão do experimento e não corresponde integralmente ao código. Há avanço na especificação, especialmente em privacidade e fronteira de confiança, sem implementação equivalente de todos os requisitos novos. Não há evidência suficiente para apresentar contratos ou conformidade integral como entregues.

Nenhuma funcionalidade, PDF original ou dado real foi alterado nesta revisão.

## Atendimento ao feedback

| Pedido do professor | Referência no feedback | Evidência na V6 | Parecer |
|---|---|---|---|
| Corrigir nome do orientador | p. 3 | p. 2: Prof. Nelson Aguiar | Atendido. |
| Conferir dois RAs fora do padrão informado | p. 4 | p. 1: Vitor continua com 10 dígitos; Felipe, com 8 | Pendente de conferência com matrícula. Não inventar os números corretos. |
| Atualizar situações das sprints | p. 4 | pp. 29–30: Sprint 1 concluída; Sprint 2 com entrega em 16/10 e ainda em andamento; Sprint 3 prevista | Parcial. Atraso pode ser legítimo, mas deve ser registrado com nova previsão. Em 20/10, explicitar também a situação real da Sprint 3. |
| Referências oficiais de tecnologia | p. 4 | pp. 42 e 46: React, Firestore, Auth e Netlify | Atendido documentalmente. |
| Corpus, gabarito e experimento de contratos | pp. 4 e 6 | pp. 31–32: protocolo de 30–50 contratos, métricas e linhas de base | Parcial: protocolo presente; faltam corpus demonstrável, execução e resultados. |
| Limitações de usar CUAD | p. 4 | p. 31: diferença de idioma e domínio explicitada | Atendido na discussão. |
| Definir premissa de reajuste | pp. 4–5 | p. 21: percentual fixo ou último acumulado de 12 meses, identificado como estimativa | Atendido na especificação; implementação de contratos continua prevista. |
| Separar garantias de regras e cliente | p. 5 | pp. 44–45, Quadro 10 | Parcial: há seção específica, mas algumas afirmações técnicas são amplas demais e precisam de correção. |
| Testes das regras em emulador | p. 5 | RNF24 p. 24; testes mencionados p. 43; código em tests/firebase.integration.js | Implementação de testes localizada. Resultado da execução desta revisão registrado abaixo. |
| Avaliar backend financeiro, contador e App Check | p. 5 | p. 45: risco e evolução registrados | Atendido como análise; não como proteção implementada. |
| Estender privacidade para chat/insights | p. 5 | RNF03 p. 22; RNF21–RNF23 p. 23; discussão p. 24 | Atendido no texto, com pendências concretas no aplicativo. |
| Metas mensuráveis e resumo dos testes | p. 5 | p. 23: 2 s/5.000 lançamentos; p. 43: 37 testes | Parcial: falta medição de desempenho e a contagem está desatualizada (48 testes locais nesta revisão). |
| Comparar soluções existentes | p. 5 | pp. 8–9: comparação narrativa com Organizze | Parcial: há comparação, mas falta referência do produto, data e escopo que sustentem a afirmação abrangente “nenhum deles”. |
| Antecipar experimento antes do artigo | pp. 5–6 | p. 32 afirma anterioridade; cronograma pp. 29–31 não inclui marco de 25/10 | Parcial: falta data, responsável e entrega verificável do experimento. |
| Explicar limite do pagamento de fatura | p. 5 | p. 19: salvaguarda do projeto | Parcial: informar o valor adotado (400 itens candidatos no código), regra de contagem e fonte específica das limitações da plataforma. Não substituir a explicação por um limite histórico de 500 sem verificar versão/documentação. |
| Legendas e fontes nas tabelas | p. 6 | Quadros 1–10 numerados e com fonte | Atendido nas tabelas e páginas inspecionadas. |
| Confirmar nome do curso | p. 6 | pp. 1–2 mantêm Engenharia de Software e Computação | Pendente de confirmação institucional; a revisão não determina qual é o nome oficial. |
| Usar nome atual fora da explicação histórica | p. 6 | AgentFinanceiro aparece na evolução e no histórico do cronograma | Uso histórico justificável, sem constituir erro por si só. |

## Pendências de implementação introduzidas ou reforçadas pela V6

### Privacidade: requisitos essenciais ainda não atendidos integralmente

- **RNF03, PDF 22:** não foi localizado aviso consistente antes de cada envio, explicando documento, resumo e destino externo. O clique no botão, isoladamente, não comprova o aviso descrito.
- **RNF21, PDF 23:** `src/services/aiService.js` envia `notifications` no resumo; `src/utils/dashboard.js` inclui `sub.name` em notificações. Nomes livres de assinaturas podem, portanto, chegar ao modelo. O backend também aceita o contexto sem impor esquema estrito de campos agregados. A pergunta e o histórico do chat são texto livre: definir separadamente sua política e o alcance do requisito sobre o resumo automático.
- **RNF22, PDF 23:** não foi localizado fluxo de eliminação da conta e de todos os seus dados financeiros. As regras atuais também não permitem excluir várias coleções pelo cliente. Excluir somente o usuário do Authentication não substitui a limpeza das subcoleções. O texto da p. 24 não deve tratar a existência do requisito como prova de atendimento do direito.
- **RNF23, PDF 23:** não foi localizado aviso explícito de que as respostas não constituem aconselhamento financeiro no chat/interface examinada.

Evidências principais: `src/services/aiService.js`, `src/components/Chat/AIChatWidget.jsx`, `src/utils/dashboard.js`, `server/ai-handler.js`, `firestore.rules`.

### Contratos e fatura

- **RF28–RF30, PDF 16:** continuam previstos. Não foram localizados extrator de contratos, revisão dos cinco campos ou geração de obrigações contratuais integradas à projeção. O backend aceita somente `chat`, `insight` e `receipt`.
- **RF16, PDF 15:** detalhamento da fatura continua ausente na interface. O helper de serviço não equivale à tela entregue.
- **Artigo, PDF 31–32:** protocolo não equivale a experimento executado. Faltam arquivos de entrada identificados, gabarito, versão de prompt/modelo, saídas brutas, erros e tabela de resultados. O prazo de 25/10 mencionado no feedback precisa entrar no plano.

## Problemas já conhecidos que continuam reproduzíveis

Reexecutado `node --experimental-vm-modules docs/validacao-5entrega/probes.mjs`, sem banco real:

| Verificação sintética | Resultado observado | Esperado |
|---|---|---|
| Mesmo gasto em CSV e OFX simultâneos | 2 transações; saldo −50 | 1 transação; saldo −25 |
| Mesmo CSV com escolha explícita de manter duplicada | 0 inserções, 1 ignorada | Comportamento coerente com a opção apresentada na interface |
| Conta agendada vencida e próxima | 0 notificações | Avisos das obrigações pendentes |
| Compra no cartão 100 + pagamento de fatura importado 100 | Despesa mensal 200 | Consumo 100 |

A limitação das pp. 16–17 deve mencionar o cenário demonstrado **CSV/OFX entre formatos/fontes**. O teste não demonstra genericamente que dois lotes OFX idênticos sempre duplicam; o texto atual descreve uma causa/cenário diferente do efetivamente reproduzido. Não apresentar o problema como restrito ao OFX.

RF23–RF26, nas pp. 15–16, merecem situação “parcial” ou observação de falha conhecida. A definição da p. 13 associa “Implementado” a codificado e validado; sem ressalva, ela promete mais do que a evidência atual permite.

## Correções técnicas e textuais por página

| PDF | Correção recomendada |
|---|---|
| 3–4 e 43 | Resumo/abstract e tabela de tecnologias descrevem leitura de contratos no presente. Identificar como recurso proposto, ainda não integrado. |
| 5–6 | Sumário está deslocado da numeração impressa em uma página a partir da introdução. Regerar após definir a contagem institucional correta. |
| 7 | Conferir denominador de “85,3% desse endividamento”; participação de famílias que citam cartão não equivale à participação do cartão no valor da dívida. |
| 8, 13–14, 22, 33, 43–44 | Trocar “identificador de sessão (UID)” por “identificador do usuário (UID)”. Sessão/token expiram; UID permanece entre acessos. |
| 9 | Substituir “nenhum deles” por conclusão restrita às soluções e versões efetivamente analisadas; acrescentar fontes e quadro comparativo. Não foi realizada pesquisa de mercado nesta revisão. |
| 14 | RF05 precisa distinguir contas únicas GENERAL/VR/VA de várias caixinhas. RF08 ainda generaliza uma garantia de idempotência não uniforme. |
| 15 e 27 | RF22/HU27 dizem não presumir receitas futuras; o código inclui receitas explicitamente agendadas. Explicitar a exceção ou alterar a regra. Contratos previstos na HU27 também não estão integrados. |
| 18 | UC07 começa com seleção de competência; conferir a interface, que atualmente oferece o pagamento da fatura corrente. O marcador é lido dentro da transação por financialOperation, apesar de o fluxo textual separar a verificação da abertura da transação. |
| 21 | Na premissa do índice, definir fonte, data-base, atualização, índice indisponível/negativo e regras de arredondamento; são detalhes necessários à implementação, sem invalidar o avanço conceitual. |
| 24 | Distinguir política proposta de mecanismos existentes. Não afirmar que todo documento enviado só contém dados do próprio titular: contratos e recibos podem conter terceiros. Não foi feita certificação jurídica de conformidade. |
| 27 | HU21 ainda diz “sem apagar registros”; transactionService usa exclusão física após estorno. Preservar trilha ou alterar formalmente a história. |
| 29–31 | Cronograma precisa mostrar trabalho efetivamente feito em 15/10. Não afirmar conclusão em 02/10 sem evidência histórica. Sprint 2 vencida requer replanejamento; experimento/artigo de 25/10 não têm marco explícito. |
| 31 | Corrigir “cinco campos que o RF29 extrai” para RF28; RF29 é revisão/confirmação. |
| 31–32 | Acrescentar regras de avaliação para campo ausente/não aplicável, normalização de vigência/reajuste, definição de TP/FP/FN e denominadores. “Acerto exato com tolerância” deve separar correspondência estrita e tolerante. Definir como se detecta ausência de incerteza, sem tratá-la como confiança calibrada. Usar avaliação separada dos documentos empregados no ajuste de prompt. |
| 34 | Diagrama de classes ainda não contém Recorrencia nem CANCELLED; TipoMovimentacao é usado sem enumeração correspondente; Operacao.resultado é String, mas o código persiste objeto/map. |
| 36 | Pagamento de uma fatura encerra os itens da mesma competência; corrigir “competências distintas”. |
| 38 e 41 | Rastreabilidade omite scheduleService. Na figura, RF09/RF10 continuam ligados a cardService; mover para scheduleService e atualizar os módulos novos de importação/domínio. |
| 41 | Nem toda operação que altera saldo passa por financialOperation: importação, edição, exclusão e baixa possuem caminhos próprios. |
| 43 | A afirmação de dependência somente da camada imediatamente inferior conflita com o acesso direto dos serviços ao Firebase descrito na p. 42. Descrever camadas lógicas sem impor essa cadeia estrita. Atualizar 37 para 48 testes locais, separando os quatro testes de emulador e as quatro verificações de auditoria. |
| 44–45 | Corrigir a impossibilidade absoluta de validação entre documentos. As regras usam get/getAfter para conferir saldo em edições e baixas. O correto é dizer que **nem todos os invariantes estão cobertos**, em especial soma arbitrária de itens e os protocolos completos de pagamento/estorno/importação. |

### Como reescrever o ponto de segurança

Sugestão para substituir a generalização da p. 44:

> As regras validam a identidade, os formatos e determinadas relações entre documentos, usando get/getAfter em operações como edição e baixa de agendamentos. A versão atual não implementa, contudo, um protocolo completo que garanta todos os invariantes financeiros contra um cliente modificado, especialmente em pagamento de fatura, estorno e importação em lote.

Isso corresponde ao código e à [documentação oficial do Firebase sobre validação de operações atômicas](https://firebase.google.com/docs/firestore/manage-data/transactions).

O Quadro 10 deve separar criação, edição, baixa e exclusão: validações diferentes se aplicam a cada operação. Atomicidade é executada pelo Firestore quando o cliente solicita uma transação; a lacuna é não obrigar universalmente o cliente a usar um protocolo contábil válido. Não confundir atomicidade do banco com autorização financeira completa.

### Política da IA

As pp. 17 e 24 reconhecem a diferença entre modalidades, mas a condição efetiva do projeto de IA não foi confirmada nesta revisão. Não deduzir o plano da Gemini API do plano Spark do Firebase: são configurações distintas. Os [termos oficiais da Gemini API](https://ai.google.dev/gemini-api/terms) distinguem o tratamento conforme o projeto e faturamento. A restrição a dados pessoais na modalidade não paga não depende de o usuário ser membro da equipe. Dados sintéticos ou efetivamente anonimizados são adequados para ensaios; pagar pelo serviço, por si só, não comprova todos os mecanismos de privacidade prometidos no documento.

## Verificações e limites

- `npm test`: **48/48 passaram**, em 20/10/2026. A V6 cita 37.
- Os quatro problemas de auditoria acima foram novamente reproduzidos; não são parte dos 48 testes aprovados.
- `npm run test:firebase`: **4/4 passaram** no projeto de demonstração local `demo-salva-ai`, em 20/10/2026. A primeira tentativa restrita falhou ao iniciar a porta local; a repetição fora da restrição concluiu. Os testes não alteraram o projeto de produção.
- Não foi executado benchmark com 5.000 lançamentos: a meta de 2 segundos é requisito, não resultado demonstrado. Definir dispositivo, rede, localização, cache frio/quente, repetições e percentil antes de medir.
- Diagramas e tabelas-chave foram renderizados e inspecionados: casos de uso, classes, sequência, arquitetura, quadros de RF/RNF, cronograma e segurança. Não foi identificado corte evidente nessas páginas; diagramas densos exigem zoom. Isso não certifica toda a normalização institucional.
- A inspeção de segurança foi estática, complementada pelos testes locais existentes; não é teste de intrusão em produção.

## Ordem de fechamento

1. Antes de 25/10: executar o experimento, preservar evidências e incluir resultados reais; atualizar o cronograma para esse marco.
2. Corrigir os dois erros financeiros: duplicação concorrente e consumo duplicado de fatura importada.
3. Implementar os requisitos novos de privacidade RNF03/21/22/23 ou marcá-los explicitamente como pendentes; RNF24 possui testes locais, mas não comprova invariantes que as regras não impõem.
4. Fechar RF16, alertas e contratos integrados (ou ajustar formalmente o escopo). Não confundir protótipo experimental com RF28–RF30 completos.
5. Corrigir RAs, curso, paginação, contagem de testes, diagramas, rastreabilidade e generalizações técnicas antes da versão final.
