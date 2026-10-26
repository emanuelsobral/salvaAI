# Saldos, cartões e projeções

O SalvaAI registra as movimentações que você informa e calcula os indicadores a partir desses dados. Os valores são em reais, com até duas casas decimais.

## Contas e caixinhas

A Conta corrente representa o saldo livre. Vale Refeição e Vale Alimentação guardam benefícios; caixinhas separam dinheiro para metas. Benefícios e caixinhas não aumentam a disponibilidade do farol.

Receitas aumentam o saldo, e despesas o reduzem. No cadastro manual, informe um valor positivo e escolha o tipo da movimentação. Despesas e pagamentos de fatura podem deixar o saldo livre negativo; um aporte em caixinha exige saldo suficiente.

Ao transferir R$ 200 de uma conta com R$ 1.000 para uma caixinha vazia, a conta fica com R$ 800 e a caixinha com R$ 200. O patrimônio permanece em R$ 1.000, e o aporte não aumenta receitas ou gastos.

Excluir qualquer lado de uma transferência vinculada estorna os dois registros. A caixinha precisa ter saldo para devolver o aporte integral. Transferências antigas sem vínculo explícito têm exclusão bloqueada até conciliação.

## Compras parceladas

O cadastro aceita de 1 a 24 parcelas, cada uma com pelo menos R$ 0,01. A diferença de centavos fica nas primeiras parcelas: R$ 100 em três vezes resulta em R$ 33,34, R$ 33,33 e R$ 33,33.

A opção de lançar no mês atual usa o mês da data da compra. Se não for marcada, a primeira parcela vai para o mês seguinte, inclusive na virada do ano. Dia de fechamento, vencimento e limite do cartão ainda não determinam esse cálculo.

Excluir uma parcela pendente remove apenas aquela parcela. Para excluir uma já paga, primeiro estorne o pagamento correspondente. Não há ação para excluir a compra parcelada inteira de uma vez.

## Faturas e pagamentos

A fatura soma as parcelas pendentes do mês e as assinaturas antigas ativas, já iniciadas e ainda não quitadas naquela competência. As novas contas recorrentes são pagas pela conta corrente, conforme o [guia de recorrências](contas-recorrentes.md).

Registrar o pagamento desconta o valor da Conta corrente e quita as parcelas e assinaturas incluídas. Repetir a mesma operação não gera outro débito. Se uma nova compra entrar depois, um pagamento adicional considera apenas o que ainda estiver pendente.

O estorno devolve o valor à conta e reabre os itens daquele pagamento, preservando outros pagamentos do mês. Registros antigos sem vínculos podem bloquear o estorno ou um novo pagamento da competência até conciliação.

O pagamento aceita até 400 documentos entre parcelas candidatas e assinaturas ativas. Cancelar uma assinatura antiga retira sua previsão ativa, preservando o histórico; cobranças anteriores que não foram registradas precisam de conciliação. Não há pagamento automático no banco.

## Farol financeiro

O farol parte do saldo da Conta corrente e desconta os compromissos pendentes considerados pelo painel: parcelas atrasadas, fatura atual, despesas pendentes até o mês e contas recorrentes não pagas até o fim do mês.

| Disponibilidade calculada | Cor |
|---|---|
| Menor que R$ 0 | Vermelho |
| De R$ 0 a R$ 500, inclusive | Laranja |
| Acima de R$ 500 | Verde |

Com R$ 1.000 em conta e R$ 2.000 de fatura pendente, sem outros compromissos, a disponibilidade é de menos R$ 1.000. O indicador usa os registros do aplicativo e não prevê renda futura.

## Projeção e gráficos

A projeção começa no mês atual e cobre 12 meses. Desconta compromissos pendentes conforme o calendário; atrasados entram no saldo inicial ou no primeiro mês, conforme o tipo. Pagamentos já registrados reduziram o saldo real e não são descontados novamente como pendências.

A simulação não presume novos salários, rendimentos, compras, juros ou correção monetária. Recorrências respeitam frequência e término; planos de contratos confirmados também entram na projeção.

Os gráficos do mês excluem transferências de receitas e gastos. Pagamentos de fatura não são contados como outra compra: uma compra de R$ 100 quitada pela fatura continua representando R$ 100 de gastos.

Nas compras de cartão, o mês da compra reúne o valor das parcelas, pagas ou não, e não apenas a parcela que vence naquele mês. Assinaturas antigas incluem cobranças registradas e valores ativos ainda não quitados. Contas recorrentes consideram pagamentos do mês e vencimentos daquele mês ainda não pagos.

Os gastos incluem movimentações de benefícios; o farol usa apenas a Conta corrente. Pagamentos antigos sem detalhamento de assinaturas podem exigir conciliação dos números históricos.

## Datas e correções

As datas seguem o calendário local do navegador. O aplicativo não fixa globalmente o fuso de São Paulo. Confira as datas ao registrar operações ou importar arquivos.

Um estorno preserva os marcadores da operação original, impedindo que uma tentativa antiga recrie o lançamento. Se quiser fazer outra movimentação, registre uma nova operação.

Para arquivos bancários, consulte [importação de extratos](importacao-extratos.md) e [conciliação](conciliacao-extratos.md).

[Voltar aos guias](README.md)
