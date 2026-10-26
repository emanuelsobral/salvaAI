# Contas recorrentes

Cadastre contas semanais, mensais ou anuais para acompanhar vencimentos e pagamentos. O calendário é calculado pelo aplicativo, sem IA, e os registros ficam na sua conta do Firestore.

## Cadastrar e pagar

1. Abra Contas recorrentes e escolha Nova conta recorrente.
2. Informe nome, valor por vencimento, frequência, primeiro vencimento, categoria e, se necessário, término.
3. Consulte os vencimentos por mês ou use Todos os atrasados para ver pendências anteriores.
4. Depois de pagar a conta, escolha Registrar pagamento, confira a data e confirme. O aplicativo desconta o valor da conta corrente e registra a despesa no histórico.
5. Para estornar, exclua o pagamento no histórico. O valor volta ao saldo e o vencimento reabre, exceto se for um vencimento futuro cancelado.

O cadastro e a passagem do vencimento não alteram o saldo. O SalvaAI não paga boletos, agenda débitos no banco ou envia notificações fora da aplicação.

Se o pagamento já foi importado, use Vincular extrato para evitar uma segunda despesa. Durante a importação também é possível aproveitar pagamentos registrados anteriormente. Consulte a [conciliação de extratos](conciliacao-extratos.md).

## Calendário

| Frequência | Regra |
|---|---|
| Semanal | Repete a cada sete dias a partir do primeiro vencimento. |
| Mensal | Mantém o dia inicial. O dia 31 passa para o último dia de meses curtos e volta ao dia 31 nos seguintes. |
| Anual | Mantém mês e dia. O dia 29 de fevereiro passa para 28 em anos comuns e volta a 29 nos bissextos. |

A data de término inclui os vencimentos daquele dia. Sem término, a recorrência continua.

Um vencimento fica pendente quando ainda não foi pago e vence hoje ou depois. Se a data já passou, ele aparece como atrasado. Um pagamento vinculado marca o vencimento como pago, inclusive quando registrado antecipadamente.

## Editar ou encerrar

Use Editar recorrência para mudar valor, frequência ou término, conforme o [guia de edição](edicao-recorrencias.md).

Encerrar recorrência cancela vencimentos futuros sem pagamento e preserva as pendências até hoje e todos os pagamentos, inclusive os antecipados. Repetir o encerramento mantém a primeira data registrada.

Planos criados por contratos têm condições próprias. Consulte o [guia de contratos](contratos.md) antes de alterá-los.

## Saldo e projeção

As novas contas recorrentes são pagas pela conta corrente e não entram na fatura do cartão. As assinaturas antigas continuam na fatura, sem migração automática entre modalidades.

O painel desconta do saldo projetado os vencimentos não pagos até o fim do mês. A projeção de 12 meses respeita frequência e término; os atrasados entram no primeiro mês. Vencimentos pagos saem da projeção porque o pagamento já reduziu o saldo real.

O gráfico de gastos considera pagamentos feitos no mês e vencimentos daquele mês ainda não pagos, além dos demais gastos do painel. Os registros de pagamento e seus vínculos são gravados junto com a atualização do saldo, para impedir débito duplicado em tentativas simultâneas.

[Voltar aos guias](README.md)
