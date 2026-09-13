# Evolução do AgentFinanceiro para o SalvaAI

[Índice](README.md) · [Arquitetura](arquitetura-salva-ai.md) · [Mudanças desta rodada](CHANGELOG.md)

## 1. O que mudou na proposta

O AgentFinanceiro era uma aplicação local: a interface abria no navegador e consumia uma API Python em `localhost:8000`. A API usava SQLAlchemy para ler e gravar o SQLite em `database/finance.db`.

O SalvaAI é uma aplicação React executada no navegador. O login é feito pelo Firebase Authentication; os serviços JavaScript acessam o Firestore diretamente, usando o UID da sessão. O backend Python não participa desse fluxo. A integração Gemini também parte do navegador.

O objetivo funcional permanece: separar saldo livre, benefícios e caixinhas; registrar receitas e despesas; acompanhar parcelas e assinaturas; apresentar a situação financeira e a projeção dos compromissos.

## 2. Modernização técnica

| Dimensão | Legado | SalvaAI inicial | SalvaAI revisado |
|---|---|---|---|
| Interface | HTML + CSS + `frontend/js/main.js` | React com páginas e componentes JSX | Mantém React; melhora estados de erro, pagamento e importação |
| Navegação | Mostra/esconde seções por eventos do DOM | React Router com `/`, `/historico`, `/assinaturas` e `/login` | Mantém rotas; remonta conteúdo autenticado quando muda o UID |
| Execução | `.bat`, Uvicorn e arquivo `index.html` | Servidor Vite em desenvolvimento e build estático | Adiciona comandos de testes e documentação operacional |
| Backend | FastAPI com rotas REST | Serviços JavaScript no navegador | Operações financeiras encapsuladas e cálculos puros separados do acesso a dados |
| Persistência | SQLite + SQLAlchemy | Firestore por usuário | Mantém documentos existentes e adiciona vínculos, competências e marcadores de operação |
| Identidade | Rotas usam usuário fixo `1` | Firebase Auth: Google e e-mail/senha | Chave Gemini passa a ser separada por UID no navegador |
| Validação | Modelos Pydantic, com várias restrições financeiras ausentes | Validação concentrada nos formulários | Valores/datas/tipos validados também nos serviços; regras Firestore locais |
| Dinheiro | `Decimal`/`Numeric(15,2)`, com conversões para float | Cálculos JavaScript em reais | Cálculos principais em centavos; persistência continua em reais por compatibilidade |
| Gravações | Transações SQL; alguns fluxos fazem commits separados | `addDoc` e atualização do saldo em chamadas separadas | Transações Firestore para gravar os efeitos financeiros juntos |
| Repetição de comandos | Sem identidade persistente de operação | Sem proteção persistente | `operations` e `importRows`; quitação de assinatura por competência |
| Gráficos | Chart.js via CDN e instâncias manipuladas pelo script | Chart.js + react-chartjs-2 via dependências npm | Módulo de gráficos carregado sob demanda |
| Qualidade | Sem suíte encontrada | Lint, sem suíte de testes | Testes de domínio, falhas, concorrência e emulador |
| Documentação | Proposta de arquitetura | README padrão do Vite | Guias de evolução, arquitetura, regras, dados, operação e pendências |

**Atenção à comparação:** parte dos bugs do SalvaAI inicial já existia no legado; parte resultava do transporte das gravações SQL para chamadas separadas do Firestore. Modernizar a tecnologia não corrigia automaticamente as regras financeiras.

## 3. Matriz funcional

| Função | Legado | Situação atual |
|---|---|---|
| Login e cadastro | Modelo `User` existe, mas não há fluxo de autenticação real nas rotas revisadas | Google, e-mail/senha, cadastro, nome de exibição e logout via Firebase |
| Conta corrente, VR e VA | Busca/cria conta por tipo | Preservado; novas contas padrão têm ID determinístico; duplicidades detectadas bloqueiam novas movimentações |
| Receita/despesa | Débito/crédito e registro no histórico | Preservado; saldo e histórico são atômicos; valores negativos/zero são rejeitados |
| Histórico global | Junta transações e parcelas | Preservado; erro de consulta fica visível; exclusão tem regras de estorno |
| Exclusão de transação | Estorna um documento isolado | Transação comum: estorno atômico. Transferência: estorna os dois lados. Pagamento novo: reabre seus itens |
| Compra parcelada | Um registro por parcela; primeira fatura no mês da compra ou seguinte | Preservado; 1 a 24 parcelas; centavos distribuídos sem perder o total; gravação conjunta |
| Pagamento de fatura | Soma parcelas pendentes e todas as assinaturas ativas | Soma apenas itens ainda não quitados; registra os vínculos e evita nova cobrança das mesmas assinaturas |
| Detalhes de fatura | Endpoint e modal com itens de cada mês | Serviço existe; ainda não está conectado a um modal de itens na interface atual |
| Caixinhas e metas | Criação e aporte da conta geral | Preservado; saldo verificado dentro da transação; duas movimentações ligadas por IDs |
| Resgate livre de caixinha | Sem fluxo dedicado | Continua sem fluxo dedicado; estornar um aporte completo não equivale a um resgate parcial |
| Assinaturas | Criação, listagem e exclusão física | Criação/listagem mantidas; cancelamento preserva o documento e pagamentos anteriores |
| Importação CSV | Parser Python, categorias por regex, linhas problemáticas ignoradas | Prévia, aspas e tabulações, centavos brasileiros, erro por linha, gravação atômica e deduplicação de importações novas |
| Farol | Rota efetiva subtrai pendências do saldo, sem descontar a fatura na cor | Subtrai fatura atual, parcelas atrasadas e despesas pendentes da conta livre até o mês |
| Projeção de 12 meses | Desconta parcelas e assinaturas; a rota inclui parcelas pagas | Desconta somente parcelas pendentes e assinaturas não quitadas; explicita ausência de receitas futuras presumidas |
| Receitas/despesas e categorias | Totais históricos com mistura de pagamento, consumo e transferência | Indicadores do mês, com transferência excluída e pagamento da fatura sem dupla contagem |
| Alertas | Dia do mês e proximidade de vencimento | Considera quitação, virada de mês e vencimento 29–31 em meses curtos |
| Tema e menu móvel | Já existiam | Preservados; não são funcionalidades novas da modernização |
| Alertas/confirmadores personalizados | `window.customAlert` e `window.customConfirm` | Existe `ModalProvider`, mas os fluxos ainda usam predominantemente `alert`/`confirm` nativos |
| Conselheiro Gemini | Não encontrado | Adicionado no SalvaAI inicial; modelo atualizado nesta rodada |
| Chat financeiro | Não encontrado | Adicionado no SalvaAI inicial; agora consulta dados atualizados por pergunta e usa pares de mensagens válidos |
| Leitura de recibos | Não encontrada | Adicionada no SalvaAI inicial; agora valida a resposta e não pede valores aproximados |
| Integração com bancos/pagamento bancário | Não encontrada | Não existe; “pagar fatura” registra uma baixa interna, sem transferir dinheiro no banco |

## 4. De endpoints a funções

O SalvaAI não mantém os endpoints FastAPI. O quadro mapeia responsabilidades equivalentes, não URLs disponíveis no novo aplicativo.

| Endpoint anterior | Função/estrutura atual | Arquivo atual |
|---|---|---|
| `GET /` | Sem endpoint equivalente; inicialização do app e tratamento de erro na interface | `src/main.jsx`, `src/App.jsx` |
| `POST /api/transactions/` | `createTransaction(uid, payload)` | `src/services/transactionService.js` |
| `GET /api/transactions/all` | `getAllTransactions(uid)` | `src/services/transactionService.js` |
| `DELETE /api/transactions/{txn_id}` | `deleteTransaction(uid, txnId)` | `src/services/transactionService.js` |
| `GET /api/dashboard/` | `getDashboardData(uid)` + `calculateDashboard(data, now)` | `src/services/dashboardService.js`, `src/utils/dashboard.js` |
| `POST /api/cards/transaction` | `createCardTransaction(uid, payload)` | `src/services/cardService.js` |
| `POST /api/cards/pay_invoice` | `payInvoice(uid, month, year, operationId)` | `src/services/cardService.js` |
| `GET /api/cards/invoice_details` | `getInvoiceDetails(uid)` | `src/services/cardService.js` |
| `POST /api/goals/create` | `createGoal(uid, payload)` | `src/services/goalService.js` |
| `POST /api/goals/deposit` | `depositToGoal(uid, goalId, value, operationId)` | `src/services/goalService.js` |
| `POST /api/import/` | `importCSV(uid, csvText)` | `src/services/importService.js` |
| `POST /api/subs/create` | `createSubscription(uid, payload)` | `src/services/subscriptionService.js` |
| `GET /api/subs/` | `getActiveSubscriptions(uid)` | `src/services/subscriptionService.js` |
| `DELETE /api/subs/{sub_id}` | `deleteSubscription(uid, subId)`; agora cancela em vez de apagar | `src/services/subscriptionService.js` |

Fontes: [rotas registradas no FastAPI](../backend/app.py), [rotas antigas](../backend/api/), [serviços atuais](../salva-ai/src/services/).

## 5. De manipulação do DOM a componentes

| Responsabilidade anterior em `frontend/js/main.js` | Estrutura React equivalente |
|---|---|
| `DOMContentLoaded`, listeners e alternância de seções | `main.jsx`, `App.jsx`, páginas e `Sidebar` |
| `loadDashboard()` | `DashboardPage` + `getDashboardData()` |
| Preenchimento de saldos, farol, alertas e metas | `BalanceCards`, `Lighthouse`, `NotificationsBanner`, `GoalsList` |
| `renderChartsDinamicamente()` | `Charts` com componentes de react-chartjs-2 |
| `renderizar12MesesReal()` | `YearProjectionDrawer` |
| `loadAllTransactions()` | `HistoryPage` + `GlobalHistory` |
| `loadSubsView()` | `SubscriptionsPage` + `SubsList` |
| Formulários e listeners de submit | `TransactionModal`, `CardTransactionModal`, `GoalModal`, `ImportModal`, `SubModal` |
| `atualizarCategorias()` | Opções JSX nos formulários e utilitários de categorias; a unificação ainda está pendente |
| Alertas globais | `ModalSystem`; adoção nos fluxos ainda incompleta |

## 6. Diferenças que não devem ser confundidas com entregas

- Não foi escrita nem executada uma migração automática de `finance.db` para Firestore.
- Não foram implementados orçamento por categoria, edição geral de transações, múltiplos cartões com seletor, resgate parcial, Open Finance ou importação OFX.
- `closingDay`, `dueDay` e `creditLimit` existem no cartão, mas não determinam automaticamente a primeira fatura nem impõem limite de crédito.
- O módulo antigo `backend/core/financial_health.py` usa consultas simuladas e margem de 10%; a rota antiga do dashboard não o chama. Ele é uma referência conceitual, não a regra efetiva do legado.
- O `database/schema.sql` e `docs/project_architecture.md` são referências históricas, não descrições exatas de todos os arquivos e estruturas em uso.
- A proteção das regras atuais foi testada localmente. Sua presença na pasta não altera as regras publicadas na nuvem.
