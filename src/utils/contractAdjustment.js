import { cents, positiveMoney, localDate, validDate, sumMoney } from './finance.js';
import { recurringOccurrences } from './recurrence.js';

// Inclui pagamentos para invalidar uma prévia quando houver pagamento ou estorno.
export function contractPlanSnapshot(sub) {
  return JSON.stringify({
    revisions: sub.revisions || [], isActive: sub.isActive, cancelledOn: sub.cancelledOn || null,
    payments: Object.entries(sub.payments || {}).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, payment]) => [date, payment.transactionId, payment.paidDate, payment.amount]),
  });
}

export function previewContractAdjustment(sub, input, today = localDate()) {
  if (!sub.contractId || sub.billingMode !== 'ACCOUNT' || !sub.isActive) throw new Error('Escolha um plano de contrato ativo.');
  const revisions = sub.revisions || [];
  if (revisions.length >= 100) throw new Error('Este plano atingiu o limite de 100 reajustes.');
  const effectiveFrom = validDate(input.effectiveFrom);
  if (effectiveFrom <= today) throw new Error('Escolha uma data futura para o reajuste.');
  if (effectiveFrom < sub.startDate || effectiveFrom > sub.endDate) throw new Error('A data deve estar dentro do período de parcelas do plano.');
  if (revisions.length && effectiveFrom <= revisions.at(-1).effectiveFrom) throw new Error('Escolha uma data posterior ao último reajuste programado.');
  const lastPaid = Object.keys(sub.payments || {}).sort().at(-1);
  if (lastPaid && lastPaid >= effectiveFrom) throw new Error('Há pagamento registrado a partir desta data. Escolha uma data posterior ao último vencimento pago (' + lastPaid.split('-').reverse().join('/') + ').');
  const previousAmount = positiveMoney(revisions.at(-1)?.amount ?? sub.amount);
  let amount;
  if (input.type === 'AMOUNT') amount = positiveMoney(input.value);
  else if (input.type === 'PERCENT') {
    if (typeof input.value !== 'number' || !Number.isFinite(input.value) || input.value <= -100 || input.value > 10000
      || Math.abs(input.value * 100 - Math.round(input.value * 100)) > 0.000001) throw new Error('Informe um percentual maior que -100 e até 10000, com até duas casas decimais.');
    // Cálculo inteiro; arredondamento de meio centavo para cima.
    const scaled = BigInt(cents(previousAmount)) * BigInt(10000 + Math.round(input.value * 100));
    amount = positiveMoney(Number((scaled + 5000n) / 10000n) / 100);
  } else throw new Error('Escolha novo valor ou percentual.');
  if (amount === previousAmount) throw new Error('O reajuste não altera o valor da parcela após o arredondamento.');
  const revision = {
    effectiveFrom, amount, startDate: sub.startDate, endDate: sub.endDate, frequency: sub.frequency,
    adjustmentType: input.type, adjustmentValue: input.value, previousAmount,
  };
  const before = recurringOccurrences(sub, effectiveFrom, sub.endDate, today);
  if (!before.length) throw new Error('Não há parcelas futuras para reajustar nesta data.');
  const rows = before.map(row => ({ dueDate: row.dueDate, previousAmount: row.amount, amount }));
  return { revision, rows, previousTotal: sumMoney(rows.map(row => row.previousAmount)), total: sumMoney(rows.map(row => row.amount)), snapshot: contractPlanSnapshot(sub) };
}
