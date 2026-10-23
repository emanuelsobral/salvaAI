# Contas recorrentes — 12/10/2026

Contas com frequência semanal, mensal ou anual são calculadas no próprio aplicativo, sem IA. Os registros ficam no Firestore do usuário.

## Como usar

1. Abra **Contas recorrentes** e clique em **Nova conta recorrente**.
2. Informe nome, valor por vencimento, frequência, primeiro vencimento, categoria e, se necessário, a data de término.
3. Consulte os vencimentos por mês ou marque **Todos os atrasados** para ver pendências anteriores.
4. Após pagar a conta, clique em **Registrar pagamento**, confira a data e confirme. O aplicativo desconta o valor da conta corrente e registra a despesa no histórico.
5. Para desfazer um registro, exclua o pagamento no histórico. O saldo será devolvido e o vencimento reaberto, desde que não seja um vencimento futuro cancelado.

O aplicativo não efetua pagamentos bancários, não agenda débitos no banco e não envia notificações fora da aplicação. O cadastro e a passagem do vencimento não movimentam o saldo. Se já importou o pagamento, use **Vincular extrato** em vez de registrar outra despesa. Durante a importação, também é possível aproveitar pagamentos recorrentes já registrados. Veja o [guia de conciliação](conciliacao-extratos.md).

## Calendário e estados

- **Semanal:** repete a cada sete dias a partir do primeiro vencimento.
- **Mensal:** preserva o dia inicial. Dia 31 vira o último dia nos meses mais curtos e volta ao dia 31 nos seguintes.
- **Anual:** preserva mês e dia; 29 de fevereiro vira 28 nos anos comuns e volta a 29 nos bissextos.
- **Término:** inclui vencimentos na própria data de término; sem término, a recorrência continua.
- **Pendente:** sem pagamento, com vencimento hoje ou depois.
- **Atrasado:** sem pagamento, com vencimento anterior à data local atual.
- **Pago:** possui um pagamento vinculado, inclusive quando registrado antecipadamente.

**Encerrar recorrência** cancela vencimentos futuros ainda não pagos. Preserva pendências até hoje e todos os pagamentos, incluindo antecipados. Repetir o encerramento não muda sua data. Para alterar valor, frequência ou término, use **Editar recorrência** conforme o [guia de edição](edicao-recorrencias.md).

## Saldo, fatura e projeção

As novas contas são pagas pela conta corrente e não entram na fatura do cartão. As assinaturas já existentes continuam com a cobrança mensal pela fatura; não há migração automática entre as modalidades.

O painel desconta os vencimentos não pagos até o fim do mês do saldo disponível projetado. A projeção de 12 meses respeita frequência e término; atrasados entram no primeiro mês. Vencimentos pagos deixam de ser descontados da projeção, pois já reduziram o saldo real. O gráfico de gastos considera pagamentos realizados no mês e vencimentos do mês ainda não pagos, além dos gastos que já compunham o painel.

## Implementação

- Coleção existente: `users/{uid}/subscriptions/{id}`. Novos campos: `billingMode: ACCOUNT`, `frequency`, `startDate`, `endDate`, `payments` e, no encerramento, `cancelledOn`. `dueDay` é mantido para compatibilidade com as regras existentes.
- `payments` associa cada data de vencimento a `transactionId`, `paidDate` e `amount`.
- Cada pagamento gera uma transação `RECURRING_PAYMENT`, com `subscriptionId` e `dueDate` para permitir estorno.
- Pagamento, atualização do saldo, vínculo e registro de idempotência são gravados em uma transação Firestore. Chamadas concorrentes consultam o vínculo antes de debitar.
- As ocorrências são calculadas por calendário; não há geração antecipada de documentos, agendador ou chamadas a provedores de IA.
- A autorização continua pelas regras existentes de propriedade do usuário. Esta etapa não amplia essas regras para validar todo o protocolo financeiro contra um cliente modificado.

Os testes de `tests/recurrence.test.js` cobrem calendário, pagamento concorrente, falha atômica, estorno, cancelamento, compatibilidade com faturas e projeção. `tests/firebase.integration.js` também exercita cadastro, pagamento concorrente, estorno e encerramento com as regras reais no emulador.
