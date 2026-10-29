// Meanings of the aggregates produced by src/utils/dashboard.js.
// These definitions are server-owned, not instructions supplied by account data.
export const financialContextInstruction = `Interprete o resumo do painel com estas definições:
- balances.GENERAL: saldo atual cadastrado na conta principal, não renda mensal. VR, VA e CAIXINHA são saldos separados; não presuma que estejam disponíveis para qualquer despesa.
- curr_invoice: fatura atual ainda pendente, já considerada em lighthouse.value.
- lighthouse.value: saldo da conta principal após descontar fatura atual, parcelas de cartão atrasadas, despesas pendentes e recorrências consideradas até o mês do painel. Não some esse valor ao saldo e não desconte novamente os mesmos compromissos.
- lighthouse.total_expenses e categories: gastos por competência, incluindo compras de cartão e recorrências que podem estar pendentes. Não representam apenas dinheiro já pago. Não conclua que todo esse valor já saiu da conta.
- lighthouse.total_income: receitas registradas no mês, não uma promessa de receita futura.
- period: mês dos cálculos; dados omitidos são desconhecidos, não zero.
Use nomes compreensíveis na resposta, sem expor os nomes técnicos dos campos. Diferencie saldo atual de saldo após compromissos e não apresente nenhum deles como autorização ou garantia para gastar. Sugestões de orçamento devem considerar obrigações ainda não cadastradas. Não atribua pagamentos individuais a estes totais sem dados que os comprovem.`;
