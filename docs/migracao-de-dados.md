# Modelo de dados e migração SQLite → Firestore

[Índice](README.md) · [Regras financeiras](regras-financeiras.md) · [Pendências](pendencias.md)

## 1. Estado da migração

**Não existe, nesta entrega, um importador completo do SQLite para Firestore. Nenhum dado real foi migrado.** O CSV importa apenas movimentações normais da conta GENERAL e não substitui uma migração de usuários, contas, metas, cartões, parcelas e pagamentos.

A compatibilidade adicionada nesta rodada atende documentos que já existem no SalvaAI inicial. Ela não deve ser confundida com compatibilidade automática com as tabelas SQLite.

## 2. Correspondência das entidades

| Legado: tabela/modelo | SalvaAI | Conversão necessária |
|---|---|---|
| `users` / `User` | Firebase Authentication e caminho `users/{uid}` | Mapear ID inteiro para UID; não transportar o `password_hash` demonstrativo |
| `accounts` / `Account` | `users/{uid}/accounts/{id}` | `goal_amount` → `goalAmount`; preservar tipos, nomes e saldos |
| `categories` / `Category` | Campo `category`, prefixo da descrição e catálogos JS | Não existe coleção de categorias; revisar valores e categorias sem uso |
| `transactions` / `Transaction` | `users/{uid}/transactions/{id}` | Remapear `account_id`; converter datas e nomes de campos; classificar natureza da operação |
| `credit_cards` / `CreditCard` | `users/{uid}/creditCards/{id}` | `closing_day` → `closingDay`, `due_day` → `dueDay`, `credit_limit` → `creditLimit` |
| `credit_card_transactions` / `CreditCardTransaction` | `users/{uid}/cardTransactions/{id}` | Remapear cartão; preservar mês/ano, número de parcela e situação |
| `subscriptions` / `Subscription` | `users/{uid}/subscriptions/{id}` | `due_day` → `dueDay`, `is_active` → `isActive`; definir competência inicial |
| Sem equivalente | `users/{uid}/invoices/{YYYY-MM}` | Vínculos de quitação das assinaturas por competência |
| Sem equivalente | `users/{uid}/operations/{operationId}` | Identidade persistente de operações novas |
| Sem equivalente | `users/{uid}/importRows/{hash}` | Identidade persistente de linhas importadas pelo novo parser |

Os IDs `txn_...` e `ctxn_...` são identificadores de apresentação no histórico. O prefixo não faz parte do ID real do documento.

## 3. Estrutura atual dos documentos

### Contas

```js
{
  name: 'Conta Corrente',
  type: 'GENERAL', // GENERAL | VR | VA | CAIXINHA
  balance: 1000.00,
  goalAmount: null, // positivo para metas novas
  createdAt: Timestamp
}
```

Novas contas padrão usam IDs GENERAL/VR/VA. Contas antigas com ID aleatório são reutilizadas se houver exatamente uma do tipo. Duplicidades não são mescladas automaticamente. Caixinhas possuem IDs próprios, pois podem existir várias.

### Movimentação normal

```js
{
  accountId: 'GENERAL', accountType: 'GENERAL',
  type: 'EXPENSE', amount: 25.50,
  transactionDate: '2026-09-13',
  category: 'ALIMENTACAO', description: '[ALIMENTACAO] Mercado',
  kind: 'REGULAR', status: 'COMPLETED', createdAt: Timestamp
}
```

Uma transferência usa a mesma coleção, com `kind: 'TRANSFER'`, `transferId` e `peerTransactionId`. O tipo continua INCOME/EXPENSE para representar o movimento de cada conta; `kind` diferencia a natureza financeira.

Um pagamento novo usa `kind: 'INVOICE_PAYMENT'` e acrescenta:

```js
{
  invoiceKey: '2026-09',
  cardTransactionIds: ['parcela-a'],
  subscriptionIds: ['assinatura-a'],
  subscriptionCharges: [
    { id: 'assinatura-a', name: 'Streaming', category: 'ASSINATURAS', amount: 50.00 }
  ]
}
```

`subscriptionCharges` preserva o valor/nome/categoria do momento do pagamento, mesmo após cancelamento da assinatura.

### Cartões e parcelas

O cartão contém `name`, `closingDay`, `dueDay`, `creditLimit` e `createdAt`. A criação automática usa `PRIMARY`, fechamento 5, vencimento 10 e limite informativo de R$ 5.000.

Cada parcela contém `creditCardId`, `purchaseId`, `category`, `description`, `amount`, `purchaseDate`, `invoiceMonth`, `invoiceYear`, `installmentNumber`, `totalInstallments`, `status`, `createdAt`. Ao pagar, recebe `paymentId`; ao estornar, volta a PENDING com `paymentId: null`.

### Assinaturas

Campos: `name`, `amount`, `dueDay`, `category`, `isActive`, `startMonth`, `createdAt`. Cancelamento adiciona `cancelledAt`. Documentos antigos sem `startMonth` continuam sendo considerados iniciados para cálculo; não se inventa uma data histórica de início.

### Competência de fatura

```js
// users/{uid}/invoices/2026-09
{
  subscriptionPayments: { 'assinatura-a': 'id-da-transacao-de-pagamento' },
  updatedAt: Timestamp
}
```

O documento representa quitações de assinaturas, não um extrato bancário completo nem uma fatura fechada imutável. Parcelas mantêm a situação nos próprios documentos. Podem existir vários pagamentos na mesma competência.

### Marcadores

`operations` contém `fingerprint` (JSON do conteúdo validado), `result` e `createdAt`. `importRows` contém `transactionId` e `createdAt`. Esses documentos não são removidos por estornos/exclusões e não devem ser reconstruídos arbitrariamente na migração.

## 4. Compatibilidade com o SalvaAI inicial

- Valores continuam em reais; nomes de campos usados pelas telas são preservados.
- Descrições com `[CATEGORIA]` continuam sendo reconhecidas.
- Transferências antigas sem `peerTransactionId` têm a exclusão bloqueada.
- Pagamentos antigos reconhecidos por `[CARTAO] Fatura Paga MM/YYYY` não recebem vínculos inventados. Estorno e novo pagamento nessa competência exigem conciliação.
- Parcelas pagas antigas não podem ser apagadas como se fossem pendentes.
- Contas duplicadas não são somadas e substituídas silenciosamente por uma nova conta para movimentação.
- A chave Gemini antiga, compartilhada no navegador, não é reutilizada automaticamente por outro UID. É necessário configurá-la novamente; salvar remove a entrada global antiga.

## 5. Plano de migração do banco antigo

1. **Preservar as origens.** Parar gravações no legado, copiar `database/finance.db` e exportar o Firestore de destino antes de qualquer mesclagem. O ZIP criado nesta rodada é backup de código, não do banco.
2. **Inventariar somente para leitura.** Identificar tabelas/colunas reais, quantidades, contas, somas, categorias, estados e documentos já existentes no destino. A fonte de verdade é o banco real, conferido com os modelos ORM; o `schema.sql` não basta.
3. **Vincular o proprietário.** Confirmar qual UID recebe os dados do usuário legado `1`. Criar/autenticar esse usuário pelo Firebase, sem importar a senha demonstrativa.
4. **Definir IDs estáveis e mapa de origem.** Registrar correspondência de cada ID SQLite para o Firestore e a identidade do lote de migração. Uma nova execução deve reconhecer o lote anterior.
5. **Conciliar os saldos.** Comparar saldo armazenado por conta com movimentações efetivamente concluídas. Registrar saldos de abertura e divergências antes de decidir ajustes.
6. **Reconstruir vínculos apenas com evidência.** Associar as duas pernas de transferências e os itens dos pagamentos quando forem unívocos. Mesma data/valor, isoladamente, não comprova vínculo.
7. **Converter em homologação.** Migrar contas/cartões antes das referências dependentes. Preservar datas de compra e competências das parcelas; valores em reais com precisão de centavos.
8. **Escolher uma estratégia de saldo.** Importar saldos finais e histórico sem reaplicar débitos, ou reconstruir desde saldos de abertura. Nunca importar o saldo final e depois executar `createTransaction()` para todo o histórico, pois isso movimentaria o saldo novamente.
9. **Validar.** Comparar quantidades, somas por conta, faturas por competência, parcelas, pagamentos e metas. Toda divergência deve ter explicação registrada.
10. **Fazer a transição.** Só após validar a cópia, aplicar ao destino escolhido, guardar o relatório e impedir que versões antigas continuem gravando formatos incompatíveis.

O importador e o relatório automatizado de conciliação ainda precisam ser implementados. Não se deve corrigir o histórico real apenas a partir de correspondência aproximada de descrições.

## 6. Reversão

Antes de migrar, definir como restaurar dados e código juntos. Repor somente o código antigo não restaura o Firestore e pode reintroduzir pagamentos repetidos. Uma importação de dados deve ter inventário dos documentos criados/alterados e backup verificável do estado anterior.
