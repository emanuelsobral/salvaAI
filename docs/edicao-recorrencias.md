# Edição de recorrências — 12/10/2026

É possível alterar valor, frequência, calendário e término das contas recorrentes da conta corrente. Cada edição acrescenta uma condição válida a partir da data escolhida. Os registros anteriores e pagamentos são preservados, sem movimentar o saldo na edição.

## Como usar

1. Abra **Contas recorrentes** e clique em **Editar recorrência** no cartão da conta.
2. Escolha **Aplicar a partir de** e o novo valor por vencimento.
3. Para apenas reajustar o valor, deixe **Manter o calendário anterior** marcado. Isso preserva o dia original, inclusive dia 31 e 29 de fevereiro.
4. Para mudar frequência ou dia, desmarque essa opção e informe a nova frequência e o primeiro vencimento do novo calendário.
5. Informe o novo término ou deixe vazio para continuar sem término.
6. Confira a prévia **Antes / Depois** e confirme. A prévia mostra até cinco vencimentos dentro dos próximos 12 meses a partir da alteração.

O cartão mostra as condições em vigor hoje, avisa quando há mudanças futuras e permite consultar o **Histórico de condições**. A projeção, os totais, pagamentos e conciliação usam a condição aplicável a cada vencimento.

## Exemplo

Uma conta de R$ 100 vence todo dia 31. Um reajuste para R$ 150, válido a partir de 1º de fevereiro, com o calendário preservado, mantém janeiro em R$ 100. Fevereiro passa a R$ 150 no último dia do mês e março volta a vencer no dia 31.

Se a alteração em vez disso definir frequência semanal com primeiro vencimento em 3 de fevereiro, os vencimentos anteriores a 1º de fevereiro permanecem. A partir dessa data o calendário antigo é substituído por 3, 10, 17 de fevereiro e assim por diante, respeitando o término escolhido. Não são criados vencimentos entre a vigência da alteração e o primeiro vencimento novo.

## Proteções e limites

- A data da alteração deve ser hoje ou futura, não anterior ao início da conta.
- Cada nova condição deve começar depois da última alteração cadastrada. Edições não apagam nem reordenam condições anteriores, inclusive mudanças já agendadas.
- A data deve ser posterior ao último vencimento pago. Isso preserva pagamentos antecipados e seus vínculos com extratos. O formulário já sugere a primeira data permitida.
- O término não pode preceder a vigência ou o primeiro vencimento novo.
- Contas encerradas e assinaturas antigas pagas na fatura não aceitam esta edição.
- Nome e categoria permanecem os mesmos nesta etapa.
- Uma conta ativa cujo término já passou pode receber nova condição para cobranças futuras, mantendo o intervalo sem cobranças.
- A edição não altera saldos. O registro do pagamento usa o valor da condição daquele vencimento.
- Se outra tela alterar a recorrência, uma edição baseada na versão antiga será recusada. Feche o formulário e atualize a página para carregar as condições atuais.
- Se o valor mudar enquanto a confirmação de pagamento estiver aberta, o pagamento será recusado até que a lista seja atualizada.

## Persistência e compatibilidade

Os campos originais de `subscriptions` são mantidos. O array `revisions` recebe objetos com `effectiveFrom`, `amount`, `frequency`, `startDate` e `endDate`. Cada condição vale de sua vigência até antes da próxima, limitada também pelo seu término. Para preservar o calendário, `startDate` mantém a data usada como referência pela condição anterior, mesmo quando precede `effectiveFrom`.

`editRecurringSubscription(uid, subId, payload)` recebe `effective_from`, `amount`, `frequency`, `start_date`, `end_date`, `keep_calendar`, `expected_revision` e `operation_id`. A operação lê a versão atual e grava a nova condição e o marcador de idempotência na mesma transação Firestore. Uma repetição com a mesma operação não acrescenta outra condição.

`recurringOccurrences` aplica os intervalos das versões. `prepareRecurringRevision` valida a edição; `earliestRevisionDate` determina a primeira data permitida; `effectiveSchedule` seleciona as condições vigentes. `payRecurringBill` também aceita `expectedAmount` para detectar uma confirmação desatualizada.

Não é necessária migração dos cadastros existentes. Esta etapa não acrescenta novas regras Firestore além das já preparadas para a conciliação. Antes de disponibilizar a versão, publique as regras pendentes da conciliação e atualize a aplicação. Clientes anteriores à edição não interpretam `revisions`; recarregue as sessões abertas para usar o código novo.

## Validação

- 79 testes locais aprovados, incluindo nove cenários de edição em `tests/recurrence-edit.test.js`.
- Dois testes de integração com Firestore Emulator aprovados, incluindo edição simultânea, detecção de versão antiga e pagamento reajustado.
- Build aprovado; lint sem erros, com cinco avisos de React existentes. O build mantém o aviso de tamanho do bundle.
- Navegador validado em 320, 390 e 1280 pixels, com dados fictícios: prévia, preservação do calendário, histórico, troca para semanal e nova tentativa após falha.
- Nenhum deploy ou alteração de dados de produção foi executado.
