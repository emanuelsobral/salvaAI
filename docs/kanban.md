# Kanban do SalvaAI

Atualizado em **24/10/2026**. Quadro principal de acompanhamento do projeto.

Objetivo: gestão financeira na web e no celular, com dados em nuvem, extratos, contas programadas e planejamento baseado nos compromissos cadastrados. **Sem depender de IA ou de cotas de modelos.** Contratos serão cadastrados manualmente primeiro; interpretação automática não está prometida nesta etapa.

Prioridades e ordem são propostas de execução. As datas indicam registros, não prazos de entrega. Entrar neste quadro não significa iniciar ou publicar uma funcionalidade.

**Publicação de 24/10/2026:** atualização funcional confirmada na Netlify e regras Firebase publicadas. README atualizado. K07 segue em validação para conferência visual e fluxos autenticados em produção. [Registro do deploy](deploy-2026-10-23.md).

## Prioridade atual — contratos retomados

**23/10/2026: diagnóstico de cronogramas por fase concluído na 0.1.25.** O comando de extração salva condições de carência, amortização, ausência de carência e dia útil com evidências e dependências. Não gera calendário. 327 testes e 18 saídas validadas; 90/90 campos oficiais idênticos à versão anterior. **Entrega 100% (3/3); experimento original 29% (2/7).** [Relatório](../experiments/contracts/cronograma-fases-0125.md).

**Próximo passo técnico: piloto de OCR local para contratos, com Alto.** Começar pelos dois documentos de desenvolvimento sem texto, preservando separadamente OCR, camada original e falhas. Quadros, calendários, planos escolhidos e reajustes por objeto continuam com limites. Desenvolvimento assistido autorizado; avaliação independente segue pendente e separada.

**Extratos:** C09/PDF e OCR concluídos no código local; rodada de qualidade concluída em 3/3 blocos, com revisão em 320/390 pixels e limitações registradas. O usuário adiou o teste em celular físico. Mais digitalizações e bancos continuam pendentes, sem bloquear os contratos. Isso não representa cobertura de todos os bancos. [Validação dos PDFs](validacao-extratos-pdf.md) · [Qualidade do OCR](validacao-ocr-qualidade.md).

## Quadro atual

| A fazer | Pronto para iniciar | Em andamento | Em validação | Concluído no código local |
|---|---|---|---|---|
| E05–E07 · Experimento de contratos | — | **E03 · Anotação humana; E02 · Ampliação da coleta** | — | E01 · Protocolo; E04 · Protótipo 0.1.25; comparador sintético (apoio) |
| K03–K06 · Preparação e validação ampliada | **K01 · Agenda de contas** | Nenhum cartão | K07 · Publicado; conferência de uso pendente | C01 · Regras financeiras |
| K08–K12 · Planejamento e contratos | K02 · Backup e restauração | — | — | C02 · Configuração por ambiente |
| K13–K19 · Cartões, metas e importação | — | — | — | C03 · Interface mobile |
| K20–K23 · Experiência e celular | — | — | — | C04 · Assistente sem IA |
| K24–K32 · Qualidade, segurança e dados | — | — | — | C05 · Importação CSV/OFX |
| K33–K36 · Evoluções a avaliar | — | — | — | C06 · Contas recorrentes |
| — | — | — | — | C07 · Conciliação de extratos |
| — | — | — | — | C08 · Edição de recorrências |
| Mais amostras por banco; celular físico adiado | Digitalizações reais | — | — | C09 · PDF/OCR; qualidade e viewports móveis conferidos |

E03 aguarda gabarito independente; a referência de pub-alu-03 é de IA revisada pelo usuário. E02 precisa ampliar a amostra preenchida. E05 depende do gabarito e das versões congeladas; os dez PDFs de teste permanecem reservados. K01 segue pronta para a sequência do aplicativo.

## Como vamos trabalhar

**Situação técnica:** extrator 0.1.25 e comparador sintético 0.1.0. **327 testes aprovados** (300 Python e 27 Node). Último lote: 18 saídas validadas, 16 leituras concluídas e duas falhas preservadas. Diagnósticos e resultados salvos na C:. Os cinco campos oficiais mantêm os 90 objetos da 0.1.24; cronograma auxiliar não gera datas. Não há métricas de precisão real: faltam gabarito independente e execução de avaliação congelada.

- Fluxo: **A fazer → Pronto para iniciar → Em andamento → Em validação → Concluído no código local**.
- Manter **um cartão de implementação em andamento**. Dividir cartões grandes quando forem iniciados.
- Mover para validação quando o código estiver pronto; concluir após os critérios do cartão, verificações necessárias e documentação.
- Registrar impedimentos de acesso ou decisão na coluna atual, sem marcar o cartão como concluído.
- Atualizar o quadro e o registro de movimentações ao final deste documento. Publicações são registradas separadamente em K07, com data e versão.
- **P1:** próxima entrega e preparação para uso. **P2:** completar fluxos principais. **P3:** melhoria posterior ou dependente de decisão. Respeitar dependências dentro de cada prioridade.

## Nível de raciocínio do GPT-6 antes de cada etapa

As indicações são recomendações práticas para o GPT-6 usado no Codex para desenvolver e revisar o projeto. **Não adicionam GPT ao SalvaAI nem ao extrator de contratos.** Não são resultados de uma comparação medida entre níveis neste projeto.

Antes de iniciar cada cartão, informar ao usuário: **“Etapa [ID] — [nome]. GPT-6 recomendado: [nível]. Motivo: [razão breve].”** Se for recomendada uma mudança durante o trabalho, avisar antes e explicar o motivo. A recomendação não altera a configuração da conversa: o usuário seleciona o nível no aplicativo.

| Nível | Quando usar neste projeto |
|---|---|
| Baixo | Atualizar status do Kanban, formatar texto, organizar arquivos e executar rotinas já validadas. |
| Médio | Configurações conhecidas, interface simples, documentação e execução acompanhada de verificações. |
| Alto | Implementar extração, definir critérios de avaliação, cálculos financeiros e testes com casos de borda. |
| Extra alto | Revisar segurança, concorrência, migração e diagnósticos difíceis. Usar na parte crítica do cartão e reavaliar se traz benefício. |
| Ultra | Excepcional: problema complexo continua sem solução após Extra alto, com falha reproduzível e hipóteses a investigar. Nenhuma etapa exige Ultra por padrão. |

Para cartões que misturam atividades, a coluna indica o nível recomendado para o trabalho principal; uma atualização de texto dentro de um cartão complexo pode usar Baixo. Não elevar o nível apenas porque o texto ou o arquivo é grande. Testes e revisão das evidências continuam necessários em todos os níveis.

A documentação oficial explica que esforço menor favorece rapidez e menor uso de tokens; os níveis disponíveis dependem do modelo. A escolha de nível por cartão abaixo é nossa recomendação, não uma prescrição oficial. Usamos “Ultra” como a opção mencionada pelo usuário no aplicativo, sem presumir equivalência com um parâmetro da API. Referência consultada em 13/10/2026: [OpenAI — esforço de raciocínio](https://developers.openai.com/api/docs/guides/reasoning).

## Experimento independente de extração de contratos

Escopo: script de terminal, entrada PDF e saída JSON com valor da parcela, número de parcelas, vencimento, vigência e regra de reajuste. Sem interface, login, banco, integração ao SalvaAI ou chamadas a modelos. Primeira versão para PDFs com texto; documentos digitalizados são identificados e registrados, com OCR reservado a uma etapa posterior.

| ID | Etapa | GPT-6 recomendado | Critério de conclusão | Depende de |
|---|---|---|---|---|
| E01 | Definir protocolo e formato do JSON — concluído | **Alto** | [Protocolo 1.0.0](../experiments/contracts/protocolo.md), esquema e exemplos prontos. Validação: 18 cenários estruturais e quatro casos de contagem; nenhum contrato real processado. | Nenhuma |
| E02 | Coletar e organizar contratos — em andamento | **Médio** | Piloto original com 26 PDFs e divisão 16/10 preservados; dois contratos institucionais preenchidos em catálogo complementar de desenvolvimento. Ampliar a coleta de contratos pessoais preenchidos nas quatro categorias. Meta proposta: 40 documentos, dez por categoria, sem alegar representatividade estatística. | E01 e acesso aos documentos |
| E03 | Preparar e revisar o gabarito — em andamento | **Alto** | 28 pares de fichas/JSONs preparados; `pub-alu-03` preenchido por IA externa e conferido pelo usuário, como referência de desenvolvimento. Falta gabarito independente e congelamento para avaliação. Conferência humana de respostas da IA registrada separadamente. | E01, piloto de E02 |
| E04 | Implementar o protótipo local — versão 0.1.0 concluída | **Alto** | PDF → JSON com cinco campos, evidências, regras e confiança média. 32 testes próprios e 21 JSONs verificados. Cobertura inicial baixa; sem avaliação de acerto ou integração ao produto. | E01, amostra de desenvolvimento de E02 |
| E05 | Executar lote e preservar resultados | **Médio** | Congelar versão das regras e executar documentos reservados; salvar saídas brutas, erros, duração e versões. Não excluir falhas nem ajustar regras usando o teste final sem declarar nova rodada. | E03, E04 |
| E06 | Calcular métricas e investigar erros | **Alto** | Acerto exato e com tolerância separados; precisão, revocação, omissões e erros de alta confiança por campo/categoria; falhas de processamento registradas; denominador zero como não aplicável. Usar Extra alto se houver divergência metodológica difícil de resolver. | E05 |
| E07 | Revisar relatório e decidir continuidade | **Alto** | Conferir evidências, tamanho/limitações da amostra e erros relevantes; concluir quais campos podem auxiliar preenchimento com revisão humana e se vale testar OCR. Nenhuma integração automática nesta etapa. | E06 |

Execuções de um script já validado e formatação do relatório podem usar **Baixo**. A avaliação humana continua independente do GPT. E04 pode avançar com os documentos de desenvolvimento enquanto o gabarito humano é preparado; não pode usar o conjunto reservado para ajustar regras. Os resultados deste experimento informarão K34, sem depender da implementação de K10 ou K31 porque não há armazenamento de documentos no produto nesta fase.

## Próxima entrega e publicação

Os cartões E01–E07, detalhados acima, organizam o experimento independente que antecede a agenda. Protocolo e protótipo inicial estão disponíveis; gabarito humano, execução reservada e métricas continuam pendentes.

| ID | Prioridade | GPT-6 recomendado | Entrega | Quando estará concluída | Depende de |
|---|---|---|---|---|---|
| **K01** | P1 | Alto | **Agenda de contas a pagar** | Visões semanal e mensal; atrasadas, de hoje, próximas e pagas; total pendente do período; registrar pagamento ou vincular extrato. Primeira versão usa recorrências e reajustes, sem duplicar cobranças. Validar em celular e desktop. | C06–C08 |
| K02 | P1 | Alto | Backup e restauração | Exportação com acesso restrito e restauração comprovada em ambiente isolado; conferir quantidades e saldos. Backup de código não substitui backup de dados. | Acesso ao ambiente escolhido |
| K03 | P1 | Médio | Ambiente de testes separado | Interface, login e banco de testes com dados fictícios e identificação visível do ambiente; nenhuma gravação de teste em produção. | Configuração Firebase de testes |
| K04 | P1 | Extra alto | Regras do banco e compatibilidade | Comparar regras locais e publicadas; testar conciliação, recorrências, documentos antigos e isolamento entre usuários em ambiente de testes. Preparar regras compatíveis para publicação. | K03 |
| K05 | P1 | Alto | Validação completa dos fluxos | Validar login/logout, troca de usuário, importação, pagamentos, estornos, edições, agenda, falhas de rede e navegação mobile/desktop; registrar evidências e corrigir falhas. | K01, K03, K04 |
| K06 | P1 | Médio | Preparar versão e documentação | Revisar alterações e arquivos sensíveis antes de registrar a versão no Git; atualizar guias que descrevem IA ou recursos antigos; definir atualização de sessões antigas e reversão compatível com os dados. | K04, K05 |
| K07 | P1 | Alto | Publicar e conferir o site | Publicar regras compatíveis antes da interface, fazer deploy na Netlify, testar rotas diretas e funções principais; confirmar ausência de chamadas Gemini; registrar versão, data e resultado. | K02, K04–K06 e acesso à hospedagem |

Preparar código ou aprovar testes locais não comprova publicação. As funções dos próximos blocos também passarão por validação e publicação em suas respectivas versões.

## Planejamento e contratos, sem IA

| ID | Prioridade | GPT-6 recomendado | Entrega | Quando estará concluída | Depende de |
|---|---|---|---|---|---|
| K08 | P2 | Alto | Contas avulsas e boletos programados | Cadastrar valor e vencimento sem reduzir saldo antes do pagamento; mostrar na agenda; quitar, cancelar e estornar sem duplicidade. É controle interno, não pagamento bancário. | K01 |
| K09 | P2 | Alto | Receitas futuras | Cadastrar recebimentos previstos, separar previsão de dinheiro disponível e confirmar recebimento uma vez; incluir na projeção sem somar novamente após confirmação. | Regras de confirmação de K08 |
| K10 | P2 | Alto | Cadastro manual de contratos | Registrar título, contraparte, início, término, valor, parcelas, vencimentos e observações; revisar antes de gerar compromissos vinculados ao contrato. | K08, C08 |
| K11 | P2 | Alto | Reajustes e encerramento de contratos | Programar valores ou percentuais informados pelo usuário, mostrar antes/depois e encerrar compromissos futuros preservando pagamentos e histórico. Nenhum índice externo será presumido. | K10 |
| K12 | P2 | Alto | Planejamento consolidado | Reunir contas, contratos, parcelas e receitas previstas; separar realizado de previsto; indicar períodos de saldo insuficiente e permitir conferir a origem dos valores. Não estimar receitas desconhecidas. | K08–K11 |

## Cartões, metas e importação

| ID | Prioridade | GPT-6 recomendado | Entrega | Quando estará concluída | Depende de |
|---|---|---|---|---|---|
| K13 | P2 | Médio | Detalhes e histórico de faturas | Abrir itens da fatura, navegar entre competências e visualizar pendentes, pagos e vínculos dos pagamentos. | Serviços de cartão existentes |
| K14 | P2 | Alto | Fechamento e vencimento do cartão | Calcular competência pelas datas configuradas; testar viradas de mês/ano e dias curtos; preservar compras antigas sem recalcular silenciosamente o histórico. | K13 |
| K15 | P2 | Alto | Histórico das assinaturas antigas do cartão | Preservar cobranças por competência após mudanças/cancelamentos; definir tratamento dos dados antigos sem inventar cobranças passadas. Não confundir com recorrências já prontas. | K13, K14 |
| K16 | P2 | Alto | Múltiplos cartões e edição de compras | Escolher cartão nos lançamentos e faturas; editar compras permitidas com prévia das parcelas, bloqueando alterações que comprometam pagamentos feitos. | K13, K14 |
| K17 | P2 | Alto | Resgate de caixinhas | Resgatar valor parcial ou total para conta corrente, verificando saldo, com duas movimentações vinculadas e estorno consistente. | Transferências existentes |
| K18 | P2 | Médio | Categorias consistentes | Usar mesmos códigos e nomes em cadastro, importação, histórico e gráficos; mapear valores antigos explicitamente sem perder classificação. | Inventário das categorias |
| K19 | P2 | Alto | Revisão de duplicidades na importação | Diferenciar linhas CSV repetidas de despesas legítimas iguais; permitir decisão explícita e auditável; tratar registros antigos sem marcadores sem fundir pagamentos por aproximação. | C05, C07 |

## Experiência e acesso pelo celular

| ID | Prioridade | GPT-6 recomendado | Entrega | Quando estará concluída | Depende de |
|---|---|---|---|---|---|
| K20 | P2 | Médio | Acessibilidade e mensagens | Padronizar confirmações/erros; validar teclado, foco em modais, rótulos, contraste e telas pequenas nos fluxos principais. | Telas das respectivas entregas |
| K21 | P2 | Alto | Aplicativo web instalável (PWA) | Instalação, ícones, tela inicial e atualização de versão; conferir no celular. Primeira versão depende de internet para login e operações financeiras e informa isso claramente. | K07, K20 |
| K22 | P2 | Médio | Lembretes de vencimento | Avisos na agenda e preferências de antecedência, sem repetir contas pagas; documentar o que funciona apenas com aplicativo aberto. | K01, K08 |
| K23 | P3 | Extra alto | Uso offline controlado | Definir dados que podem ficar no dispositivo, indicar desatualização e limpar acesso na saída/troca de usuário; validar reconexão. Gravações offline exigem política de conflitos e testes próprios. | K21, K26 |

PWA permite instalar a versão web; não equivale a um aplicativo nativo nas lojas. Notificações com aplicativo fechado têm requisitos próprios e ficam em K35.

## Qualidade, segurança e continuidade dos dados

| ID | Prioridade | GPT-6 recomendado | Entrega | Quando estará concluída | Depende de |
|---|---|---|---|---|---|
| K24 | P1 | Médio | Verificações automáticas no Git | Testes, lint e build a cada alteração; regras e serviços no emulador; nenhum segredo em arquivos ou saídas. O repositório Git já existe. | Organização da versão em K06 |
| K25 | P2 | Alto | Consultas e carregamento mais leves | Paginar histórico, reduzir leituras completas e evitar respostas antigas substituindo dados novos; medir leituras e tamanho do carregamento antes/depois, preservando totais financeiros. | Cenários financeiros de referência |
| K26 | P2 | Alto | Retomar operações após recarregar | Preservar identificação de operações em andamento, consultar resultado antes de repetir e isolar por usuário; testar queda de conexão, recarga e troca de sessão. | Operações atômicas existentes |
| K27 | P2 | Extra alto | Proteção das regras financeiras | Restringir/remover helper de saldo isolado; testar escritas diretas inconsistentes em saldos, pagamentos e vínculos; definir regras adicionais ou servidor confiável onde necessário. | K03, K04 |
| K28 | P2 | Extra alto | Conciliação dos dados antigos | Relatório de divergências de saldos, transferências e faturas; propor correções com evidência e revisão, sem criar vínculos automaticamente por valor/data parecidos. | K02, K03 |
| K29 | P3 | Extra alto | Migração SQLite → Firestore | Se os dados antigos forem aproveitados: simulação, mapa de IDs, relatório, retomada e reversão; testar cópia isolada sem debitar saldos novamente; definir fim das gravações no legado. | K02, K03, K28 e escolha dos dados/usuário de destino |
| K30 | P2 | Médio | Limpeza e manutenção do código | Resolver cinco avisos de lint registrados; retirar dependências e caminhos de IA sem uso após conferir referências; manter proteção contra chamadas antigas ao endpoint desativado. | C04 e testes de regressão |
| K31 | P2 | Alto | Exportação, privacidade e exclusão | Exportar dados do usuário em formato documentado; informar armazenamento/retenção; exclusão com confirmação e tratamento dos dados vinculados. Exportação pessoal difere de backup operacional. | K02 e inventário dos dados |
| K32 | P2 | Médio | Diagnóstico de falhas e custos | Registrar erros úteis sem chaves ou conteúdo financeiro sensível; acompanhar leituras, armazenamento e hospedagem; definir limites/avisos e recuperação. | K07 |

## Evoluções a avaliar depois

| ID | Prioridade | GPT-6 recomendado | Entrega | Quando estará concluída | Depende de |
|---|---|---|---|---|---|
| K33 | P3 | Alto | Orçamento por categoria | Limites mensais, comparação com gastos e saldo do orçamento, sem misturar transferências ou contar faturas duas vezes. | K18 |
| K34 | P3 | Alto | Anexos e leitura local de documentos | Avaliar armazenamento privado de contratos e extração local de texto/PDF ou OCR; se adotado, revisar campos antes de cadastrar. Reconhecer texto não significa interpretar cláusulas automaticamente. | K10, K31 e avaliação de custo/precisão |
| K35 | P3 | Alto | Notificações com app fechado | Escolher mecanismo e avaliar suporte/custos; depois implementar permissões, cancelamento e prevenção de avisos duplicados ou de contas pagas. | K21, K22 e decisão sobre infraestrutura |
| K36 | P3 | Alto | Tipagem e fuso do perfil | Avaliar TypeScript gradual e necessidade de fuso por usuário; registrar decisões e, se adotadas, validar migração e datas entre dispositivos. | Necessidade comprovada e testes de calendário |

## O que já está pronto no código

| ID | Entrega concluída | Evidência / referência |
|---|---|---|
| C01 | Correções de saldo, parcelas, pagamentos, transferências e estornos | [Regras financeiras](regras-financeiras.md) e testes de domínio/serviços |
| C02 | Configuração por ambiente e arquivos locais sensíveis fora do Git | [Configuração e Git](configuracao-e-git.md) |
| C03 | Adaptação mobile das telas existentes | [Interface mobile](interface-mobile.md); novas telas exigem validação própria |
| C04 | Assistente local e desligamento das chamadas Gemini | [Operação sem IA](sem-ia.md) |
| C05 | CSV/OFX com prévia e proteção contra reimportação | [Importação de extratos](importacao-extratos.md) |
| C06 | Recorrências semanais, mensais e anuais, pagamentos e projeção | [Contas recorrentes](contas-recorrentes.md) |
| C07 | Vincular/desvincular extratos e recorrências sem repetir débito | [Conciliação de extratos](conciliacao-extratos.md) |
| C08 | Editar recorrências por data, com prévia e histórico | [Edição de recorrências](edicao-recorrencias.md) |

Última validação registrada em **12/10/2026**: 79 testes locais, dois testes com emulador, build aprovado e verificação de edição em 320/390/1280 pixels. Permanecem cinco avisos de lint e aviso de tamanho do pacote. São resultados do registro anterior; não foram executados novamente na criação deste quadro.

## Fora do compromisso atual

- Reativação do Gemini ou outro modelo: contraria a decisão atual de evitar dependência de IA.
- Interpretação automática de cláusulas: substituída nesta fase por cadastro/revisão manual em K10/K11; K34 é avaliação posterior.
- Open Finance, pagamentos bancários reais e aplicativos nativos nas lojas: exigem planejamento próprio; não são entregas implícitas da agenda, dos boletos ou da PWA.

## Registro de movimentações

| Data | Cartões | Movimentação |
|---|---|---|
| 13/10/2026 | C01–C08 | Base existente inventariada como concluída no código local; esta não é a data de implementação de cada recurso. |
| 13/10/2026 | K01, K02 | Prontos para iniciar; agenda definida como próximo desenvolvimento. |
| 13/10/2026 | K03–K36 | Registrados em “A fazer”, com prioridades e dependências. |
| 13/10/2026 | E01–E07 | Planejado experimento independente de contratos. E01 pronto para iniciar; E02–E07 em “A fazer”; agenda mantida pronta para a sequência. |
| 13/10/2026 | K01–K36 e E01–E07 | Registradas recomendações de nível do GPT-6 e aviso antes de cada etapa. Nenhuma configuração do modelo foi alterada. |
| 13/10/2026 | E01 | Em andamento: definição do protocolo e do JSON, com Alto confirmado pelo usuário. |
| 13/10/2026 | E01 | Passou por validação e foi concluída: protocolo 1.0.0, esquema de extração/gabarito, exemplos sintéticos e contagens esperadas. |
| 13/10/2026 | E02 | Pronto para iniciar, com nível Médio recomendado. Coleta real ainda não começou. |
| 13/10/2026 | E02 | Em andamento: coleta de fontes públicas, inventário e separação por família; recomendado Médio antes do início. |
| 13/10/2026 | E02 | Piloto congelado: 31 fontes, 26 PDFs, cinco falhas preservadas; 16 desenvolvimento e dez teste. Nove testes de integridade aprovados. Ampliação para a meta proposta e maior diversidade continuam pendentes. |
| 13/10/2026 | E04 | Pronto para iniciar com os documentos de desenvolvimento, recomendado Alto. Não iniciado nesta coleta. E03 exige anotação humana independente. |
| 13/10/2026 | E04 | Implementado protótipo 0.1.0 após autorização com Alto. 16 PDFs de desenvolvimento e cinco fictícios geraram resultados válidos; duas falhas por ausência de texto preservadas entre os documentos reais. Baixa cobertura registrada, sem estimar precisão. |
| 13/10/2026 | E03 | Em andamento com Alto confirmado: 26 fichas e 26 rascunhos vazios, guia e conferência estrutural. Leitura humana, revisão e gabarito final pendentes. Validação acumulada do experimento: 44 testes Python e sete Node aprovados. |
| 13/10/2026 | E02, E03 | Corrigida a indicação de modelos em branco após relato do usuário. Três novos PDFs obtidos; dois contratos preenchidos aceitos como complemento institucional de desenvolvimento e um mantido como candidato. Duas fichas vazias preparadas; início indicado pelo `pub-alu-03`. Piloto original e teste reservado preservados. |

| 13/10/2026 | E03 | Usuário confirmou origem em IA das respostas de `pub-alu-03`. Procedência registrada e atribuição humana anterior retirada, com histórico preservado. Material mantido como referência provisória de desenvolvimento; gabarito humano e métricas continuam pendentes. |

| 13/10/2026 | E03 | Usuário declarou “Conferido” sobre as respostas de `pub-alu-03`. Registrada revisão humana de material gerado por IA, mantendo a origem e os valores. Referência disponível para desenvolvimento; sem classificação como gabarito independente nem cálculo de métricas. |

| 13/10/2026 | E04 | Comparação de desenvolvimento de `pub-alu-03` concluída, com regras 0.1.0 preservadas. Saída estruturalmente válida, mas reajuste mensal incorreto, duas omissões e vigência ambígua. Referência de IA revisada pelo usuário; sem métricas formais. Correção das regras proposta com Alto. |

| 13/10/2026 | E04 | Correção 0.1.1 concluída: periodicidade ligada explicitamente ao reajuste, sete novos testes e 58 testes totais aprovados. Nova execução de `pub-alu-03`: 1 → 12 meses, com evidências e outros quatro campos preservados. Próxima correção proposta: vencimento, com Alto. |

| 13/10/2026 | E04 | Correção 0.1.2 concluída: vencimento “pago mensalmente até” reconhecido, condições do mês subsequente preservadas. Sete testes novos e 65 testes totais aprovados. Nova execução mantém os outros quatro campos idênticos à 0.1.1. Próxima correção proposta: valor do aluguel, com Alto. |

| 13/10/2026 | E04 | Correção 0.1.3 concluída: aluguel mensal de BRL 2200.00 reconhecido, com evidência original e tratamento restrito de RS. Oito testes novos e 73 testes totais aprovados; outros quatro campos idênticos à 0.1.2. Próxima correção proposta: vigência, com Alto. |

| 13/10/2026 | E04 | Correção 0.1.4 concluída: vigência com datas em português, condições separadas e carimbos digitais excluídos das datas contratuais. Onze testes novos e 84 totais aprovados. Tentativa intermediária preservada; rodada final manteve outros quatro campos idênticos à 0.1.3. Próximo passo: outro contrato de desenvolvimento, com Médio. |

| 14/10/2026 | E04 | Executado pub-alu-02 com 0.1.4: quatro campos não identificados e reajuste ambíguo. JSON e evidências validados; páginas 2 e 3 conferidas visualmente. Próximo ajuste: separação de título/corpo da vigência, com Alto. Sem mudança nas regras ou gabarito. |

| 14/10/2026 | E04 | Correção 0.1.5: título e corpo da vigência preservados; Mafra retorna 12 meses sem calcular datas. Nove testes novos, 93 totais aprovados. Outros campos e contrato anterior preservados. Próximo ajuste: valor mensal da locação, com Alto. |

| 14/10/2026 | E04 | Correção 0.1.6: valor mensal da locação reconhecido em Mafra (R$ 8.825,50), com ressalva de reajuste preservada. Oito testes novos, 101 totais aprovados. Outros quatro campos e contrato anterior preservados. Próximo ajuste: prazo de pagamento por evento, com Alto. |

| 14/10/2026 | E04 | Correção 0.1.7: prazo de pagamento por evento reconhecido em Mafra, com condições e sem cálculo de data. Oito testes novos, 109 totais aprovados. Outros quatro campos e contrato anterior preservados. Próximo ajuste: reajuste IVAR, com Alto. |

| 14/10/2026 | E04 | Correção 0.1.8: IVAR e intervalo mínimo anual reconhecidos em Mafra, com condições complementares. Onze testes novos, 120 totais aprovados. Outros quatro campos e contrato anterior preservados. Próximo passo: repetir os 16 PDFs originais de desenvolvimento, com Médio; sem acessar os dez reservados. |

| 14/10/2026 | E04 | Lote 0.1.8 concluído nos 16 PDFs originais de desenvolvimento: 14 processados, dois sem texto; 16 saídas validadas. Comparação com 0.1.0 identificou 24 objetos de campo alterados e nove mudanças de estado. Problemas de vigência/vencimento registrados; correção com Alto é a próxima etapa. Nenhuma regra alterada, nenhum teste reservado executado. |

| 14/10/2026 | E04 | Correção 0.1.9: lacunas/eventos incidentais de vigência e seleção de vencimento corrigidos nos três casos prioritários. Oito testes novos, 128 totais aprovados. Dez documentos conferidos; contratos complementares preservados. Três vigências educacionais continuam ambíguas; próximo ajuste com Alto. |

| 14/10/2026 | E04 | Correção 0.1.10: seleção de vigência educacional refinada; edu-01 retorna duração anual literal e edu-04/edu-06 deixam de acusar ambiguidades incidentais. Sete testes novos, 135 totais aprovados. Dez documentos conferidos; 47 outros objetos de campo idênticos. Próximo passo: lote completo de desenvolvimento, com Médio. |

| 14/10/2026 | E04 | Lote completo 0.1.10: 18 documentos, 16 processados e duas falhas de leitura; 18 saídas validadas. Dez documentos idênticos à conferência anterior; entre os outros oito, nove objetos de campo mudaram frente à 0.1.8. Pendências consolidadas; próximo ajuste: vigência de saúde, com Alto. Regras e conjunto reservado preservados. |

| 14/10/2026 | E04 | Correção 0.1.11: prazo mínimo e início explícito reconhecidos nos dois contratos de saúde revisados, preservando condições. Oito testes novos, 143 totais aprovados. Lote de 18 documentos: duas vigências alteradas e 88 outros campos idênticos; duas falhas de leitura preservadas. Próximo passo: completude do vencimento de fin-05, com Alto. |

| 15/10/2026 | E04 | Correção 0.1.12: fin-05 passa a exigir revisão por vencimento parcial; fin-04 mantém abstenção com evidência de dia útil. Sete testes novos, 150 totais aprovados. Lote de 18 documentos validado, com 88 outros campos idênticos e duas falhas de leitura preservadas. Próximo passo: diagnóstico dos quatro reajustes ambíguos, com Alto. |

| 15/10/2026 | E04 | Diagnosticados quatro reajustes ambíguos, sem alterar a 0.1.12. Regras de objetos/modalidades distintos e candidatos fragmentados; identificada classificação interna incompleta de IGPM + IRT. Vinte campos reproduzidos idênticos e quatro JSONs validados. Próximo passo: proteção de regras compostas, com Alto. |

| 15/10/2026 | E04 | Correção 0.1.13: regras compostas e condições técnicas preservadas sem índice/taxa simplificados. Nove testes novos, 159 totais aprovados. Quatro candidatos internos corrigidos em sau-07; lote de 18 documentos mantém os 90 campos finais idênticos. Próximo passo: separar títulos e referências de regras efetivas, com Alto. |

| 15/10/2026 | E04 | Correção 0.1.14: títulos isolados filtrados e referências sem critério mantidas como pendências. Oito testes novos, 167 totais aprovados. Lote de 18 documentos validado; apenas evidências de dois reajustes alteradas e 88 outros campos idênticos. Próximo passo: distinguir modalidades de reajuste em saúde, com Alto. |

| 16/10/2026 | C09 | PDF genérico concluído localmente: revisão editável, original por página, inclusão manual, deduplicação e conciliação. 85 testes do aplicativo, dois do emulador e build aprovados; navegador com dados fictícios. Próximo passo: validar layouts reais anonimizados, com Alto. Contratos pausados; sem deploy. |

| 16/10/2026 | C09 | Primeira amostra BB/Itaú analisada em 3/3 páginas. Itaú: 10/10 sugestões em dia/mês, valor e sinal, com ano confirmado; BB: 0/6, fonte interna ilegível sinalizada; notas: zero sugestões. 106 testes e build aprovados. Próximo passo: OCR local, com Alto. Sem dados reais no Git ou gravação na conta. |

| 16/10/2026 | C09 | Segundo layout Itaú (2026): quatro páginas, 108/108 movimentações conferidas e 36 saldos excluídos; datas das descrições preservadas e continuidade de colunas validada. 112 testes, build e conferência no navegador aprovados. Dados originais fora do Git; sem gravação. OCR local para a página BB continua como próximo passo, com Alto. |

| 17/10/2026 | E04 | Contratos retomados; 0.1.15 protege modalidades e negações restritas. Oito testes novos, 175 totais aprovados. Lote de 18 documentos: somente três motivos alterados e 87 outros campos idênticos; quatro reajustes ambíguos e duas falhas de leitura preservados. Resultados na C:. Próximo: objetos do reajuste, com Alto. Geral 29% (2/7); entrega 3/3 blocos. Celular físico dos extratos adiado pelo usuário. |

| 17/10/2026 | E04 | Correção 0.1.16: objetos acessórios não fornecem índice geral da parcela; dez candidatos reclassificados como pendências nos dois casos afetados. Nove testes novos, 184 totais aprovados. Lote de 18 documentos validado: 88 campos idênticos, sem mudança de estado/valor; evidências preservadas. Próximo: cronograma de financiamento, com Alto. Geral 29% (2/7), entrega 3/3 blocos. |

| 17/10/2026 | E04 | Correção 0.1.17: condições de cobrança por evento e fase preservadas. Sete testes novos, 191 totais aprovados. Lote de 18 saídas validado: 88 campos idênticos; evidências de vencimento ampliadas em fin-04 (1→2) e fin-05 (4→6), sem mudar estados/valores. Próximo: comparador com casos fictícios (apoio E06), Alto; avaliação real depende de E03/E05. Geral 29% (2/7), entrega 3/3 blocos. |

| 18/10/2026 | Apoio E06 | Comparador sintético 0.1.0 concluído: cinco campos, métricas exatas/tolerantes, falhas e exclusões. Vinte testes novos; 211 totais aprovados. Quatro cenários fictícios conferidos e demonstração na C:. Próximo: E03, anotação independente, com apoio Alto. Avaliação real E05/E06 pendente; geral 29% (2/7), entrega técnica 3/3 blocos. |

| 18/10/2026 | E03 | Usuário declarou leitura própria planejada e ausência de exposição às respostas de pub-alu-02. Inventariados 28 rascunhos; preparado pacote novo na C:, com PDF conferido e ficha 0/5. Conferência mantém pendência; nenhum campo ou confirmação preenchido pelo agente. Próximo: leitura humana e anotação do primeiro campo. Geral 29% (2/7). |

| 18/10/2026 | E03 | Primeiro campo de pub-alu-02 recebido do usuário: valor da parcela, página e trecho; transcrito no pacote privado da C:, com histórico anterior preservado. Ficha 1/5 (20%); autoria, procedimento final e revisão pendentes. Próximo: número de parcelas. Geral 29% (2/7). |

| 18/10/2026 | E03 | Resposta sobre quantidade de parcelas preservada como proposta pendente: evidências apresentadas tratam de meses/vigência, insuficientes para conversão automática conforme protocolo. Registro principal continua indefinido nesse campo; 1/5 campos definidos (20%), um em confirmação. Geral 29% (2/7). |

[Índice da documentação](README.md) · [Registro das implementações](CHANGELOG.md)

| 18/10/2026 | E03 | Usuário não encontrou quantidade explícita de pagamentos e explicou sua inferência a partir da mensalidade e da vigência. Campo registrado como ausente pelo protocolo; inferência preservada no pacote privado. Ficha 2/5 (40%), confirmação final e revisão pendentes. Próximo: vencimento. Geral 29% (2/7). |

| 18/10/2026 | E03 | Vencimento relativo e duração recebidos do usuário; condições preservadas. Datas de início/fim não inferidas; complemento da vigência pendente. Ficha 4/5 campos preliminares (80%), sem revisão final. Próximo: reajuste e complemento documental. Geral 29% (2/7). |

| 18/10/2026 | E03 | Quinto campo recebido e transcrito com ambas as cláusulas e condições; observação de correção por atraso mantida separadamente. Ficha 5/5 campos preliminares (100% de preenchimento), ainda não avaliável. Complementação da vigência e revisão final pendentes. Geral 29% (2/7). |

| 18/10/2026 | E03 | Complemento integral de vigência e evidências das datas recebidos. Cinco campos preenchidos preliminarmente (100%), sem inferir início/fim. Pendentes declaração de leitura, autoria/data e revisão final. Gabarito ainda não avaliável; geral 29% (2/7). |

| 18/10/2026 | E03 | Usuário declarou ajuda de IA em pub-alu-02. Ficha reclassificada como referência assistida de desenvolvimento; cinco campos preservados, revisão humana não confirmada. Fora da avaliação independente. Preenchimento 100%; experimento 29% (2/7). |

| 18/10/2026 | E03 | Pacote separado para nova pessoa preparado na C:, com PDF conferido, ficha/JSON vazios, protocolo e instruções. ZIP conferido sem respostas preenchidas. Referência assistida anterior preservada. Leitura 0/5; geral 29% (2/7). |

| 19/10/2026 | E04 assistido | Usuário autorizou continuar sem pessoa analisando. Corrigida mistura de cláusulas/rodapé na vigência (0.1.18). Nove testes novos; 220 totais. Regressão final: 18 saídas válidas, 89/90 campos idênticos, duas falhas de leitura preservadas. Diagnóstico documenta omissões na referência e no extrator. Entrega 100%; experimento original 29%. |

| 19/10/2026 | E04 assistido | 0.1.19: condições de pagamento entre páginas e revisão excepcional agora preservadas. Dois campos parciais passam a ambíguos, sem valor inferido. Quinze testes novos; 235 totais. 18 saídas válidas, 88/90 campos idênticos e duas falhas de leitura preservadas. Entrega 100%; experimento original 29%. |

| 19/10/2026 | E04 assistido | 0.1.20: prazo por nota fiscal consolidado com requisitos documentais reconhecidos e evidências por página. Doze testes novos; 247 totais. 18 saídas válidas; um vencimento passa a encontrado, 89 campos idênticos. Encargos não viram prazo. Entrega 100%; experimento original 29%. |

| 19/10/2026 | E04 assistido | 0.1.21: reajuste periódico e revisão excepcional consolidados em regra literal, sem índice/período global. Doze testes novos; 259 totais. 18 saídas válidas; um reajuste passa a encontrado, 89 campos idênticos. Entrega 100%; experimento original 29%. |

| 20/10/2026 | E04 assistido | Diagnóstico 0.1.21 concluído: inventário de 90 campos, triagem dirigida e prioridades documentadas. 18 saídas revalidadas; extrator e referências preservados. Próximo: vigência por curso/evento em edu-05/edu-07, com Alto. Diagnóstico 100%; experimento original 29%. |

| 20/10/2026 | E04 assistido | 0.1.22: vigências por curso/evento reconhecidas em edu-05/edu-07, preservando regra literal e sem inferir datas. Doze testes novos; 271 totais. 18 saídas válidas, 88/90 campos idênticos. Próximo: divergências entre números e extenso, com Alto. Entrega 100%; experimento original 29%. |

| 20/10/2026 | E04 assistido | 0.1.23: divergência entre número e extenso identificada em edu-06; extenso não suportado em pub-alu-02 provoca abstenção. Taxas parceladas não substituem mensalidade. Dezesseis testes novos; 287 totais; 18 saídas válidas, 88/90 campos idênticos. Próximo: alternativas e tabelas, com Alto. Entrega 100%; experimento original 29%. |

| 20/10/2026 | E04 assistido | 0.1.24: alternativas e perfis escolares preservados, tabela conferida e opções de encargos separadas do plano principal. Seis campos com diagnóstico específico, sem plano escolhido. Dezesseis testes novos; 303 totais; 18 saídas válidas e 84/90 campos idênticos. Próximo: cronogramas por fase, com Alto. Entrega 100%; experimento original 29%. |

| 23/10/2026 | E04 assistido | 0.1.25: diagnóstico de cronogramas por fase salvo pelo comando de extração, com eventos e dependências sem calendário. 24 testes novos; 327 totais; 18 saídas válidas e 90/90 campos oficiais idênticos. Próximo: piloto de OCR local para contratos, com Alto. Entrega 100%; experimento original 29%. |

| 24/10/2026 | K07 · Publicação | Regras Firebase publicadas em 23/10; Netlify confirmou o commit funcional 3f58af4 em produção em 24/10. Scanner ativo após retirar identificador público da documentação. README atualizado; 129 testes + dois de integração e build aprovados. Publicação concluída; validação visual/fluxos autenticados ainda pendentes. Contratos: 29%. |
