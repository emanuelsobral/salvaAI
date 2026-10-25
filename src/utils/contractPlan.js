import { positiveMoney, validDate, sumMoney } from './finance.js';
import { FREQUENCIES } from './recurrence.js';

// Calendário explícito; não interpreta vencimentos em texto nem infere parcelas pela vigência.
export function previewContractPlan(input) {
  const amount = positiveMoney(input.amount);
  const count = input.count;
  if (!Number.isInteger(count) || count < 1 || count > 1200) throw new Error('Informe de 1 a 1200 parcelas.');
  if (!Object.hasOwn(FREQUENCIES, input.frequency)) throw new Error('Escolha a frequência dos vencimentos.');
  const firstDueDate = validDate(input.firstDueDate);
  const start = new Date(firstDueDate + 'T12:00:00Z');
  const dates = Array.from({ length: count }, (_, index) => {
    let next;
    if (input.frequency === 'WEEKLY') next = new Date(start.getTime() + index * 7 * 86400000);
    else {
      next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index * (input.frequency === 'YEARLY' ? 12 : 1), 1, 12));
      const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0, 12)).getUTCDate();
      next.setUTCDate(Math.min(start.getUTCDate(), lastDay));
    }
    if (next.getUTCFullYear() > 9999) throw new Error('O calendário ultrapassa o ano 9999. Reduza a quantidade de parcelas.');
    return validDate(next.toISOString().slice(0, 10));
  });
  return {
    amount, count, frequency: input.frequency, firstDueDate, lastDueDate: dates.at(-1),
    rows: dates.map((dueDate, index) => ({ number: index + 1, dueDate, amount })),
    total: sumMoney(dates.map(() => amount)),
  };
}
