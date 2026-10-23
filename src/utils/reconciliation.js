import { cents, validDate, localDate } from './finance.js';
import { recurringOccurrences } from './recurrence.js';

const normalized = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const daysApart = (a, b) => Math.abs(Date.parse(validDate(a) + 'T12:00:00Z') - Date.parse(validDate(b) + 'T12:00:00Z')) / 86400000;
export const matchKey = item => JSON.stringify([item.subscriptionId, item.dueDate]);
export function compatibleRow(row, occurrence) {
  return row.type === 'EXPENSE' && row.date <= localDate() && cents(row.amount) === cents(occurrence.amount)
    && (daysApart(row.date, occurrence.dueDate) <= 7 || (occurrence.payment && daysApart(row.date, occurrence.payment.paidDate) <= 7));
}
export function suggestRecurringMatches(rows, subscriptions, accountType = 'GENERAL') {
  if (accountType !== 'GENERAL') return rows.map(() => []);
  return rows.map(row => {
    if (row.type !== 'EXPENSE' || row.date > localDate()) return [];
    const date = Date.parse(row.date + 'T12:00:00Z');
    const from = new Date(Math.max(Date.parse('1900-01-01T12:00:00Z'), date - 7 * 86400000)).toISOString().slice(0, 10);
    const to = new Date(Math.min(Date.parse('9999-12-31T12:00:00Z'), date + 7 * 86400000)).toISOString().slice(0, 10);
    return subscriptions.flatMap(sub => {
      const matches = recurringOccurrences(sub, from, to);
      // Pagamentos antecipados/atrasados podem ter vencimento distante da data bancária.
      for (const [dueDate, payment] of Object.entries(sub.payments || {})) {
        if ((dueDate < from || dueDate > to) && daysApart(row.date, payment.paidDate) <= 7) matches.push(...recurringOccurrences(sub, dueDate, dueDate));
      }
      return matches;
    }).filter(item => compatibleRow(row, item)).map(item => ({ ...item,
      descriptionMatch: normalized(item.name).split(/\W+/).filter(word => word.length >= 3).some(word => normalized(row.description).includes(word))
    })).sort((a, b) => Number(b.descriptionMatch) - Number(a.descriptionMatch) || daysApart(row.date, a.dueDate) - daysApart(row.date, b.dueDate));
  });
}
