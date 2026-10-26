import { validDate, localDate, positiveMoney } from './finance.js';

export const FREQUENCIES = { WEEKLY: 'Semanal', MONTHLY: 'Mensal', YEARLY: 'Anual' };
export const isRecurringAccount = sub => sub.billingMode === 'ACCOUNT';
const iso = date => date.toISOString().slice(0, 10);
const utc = value => new Date(value + 'T12:00:00Z');

export function validateSchedule({ frequency, startDate, endDate }) {
  if (!Object.hasOwn(FREQUENCIES, frequency)) throw new Error('Frequência inválida.');
  validDate(startDate);
  if (endDate) {
    validDate(endDate);
    if (endDate < startDate) throw new Error('O término deve ser igual ou posterior ao primeiro vencimento.');
  }
}

// O dia original é preservado: 31/jan → 28/fev → 31/mar; 29/fev volta nos anos bissextos.
function scheduleOccurrences(sub, from, to, today) {
  if (!isRecurringAccount(sub)) return [];
  validateSchedule(sub);
  validDate(from);
  validDate(to);
  const first = from > sub.startDate ? from : sub.startDate;
  const last = sub.endDate && sub.endDate < to ? sub.endDate : to;
  if (first > last) return [];
  const start = utc(sub.startDate), lower = utc(first);
  const dates = [];
  if (sub.frequency === 'WEEKLY') {
    const step = 7 * 86400000;
    let time = start.getTime() + Math.max(0, Math.ceil((lower - start) / step)) * step;
    const end = utc(last).getTime();
    for (; time <= end; time += step) dates.push(iso(new Date(time)));
  } else {
    const step = sub.frequency === 'YEARLY' ? 12 : 1;
    const distance = (lower.getUTCFullYear() - start.getUTCFullYear()) * 12 + lower.getUTCMonth() - start.getUTCMonth();
    for (let index = Math.max(0, Math.floor(distance / step)); ; index++) {
      const month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index * step, 1, 12));
      if (month.getUTCFullYear() > 9999) break;
      const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0, 12)).getUTCDate();
      month.setUTCDate(Math.min(start.getUTCDate(), lastDay));
      const dueDate = iso(month);
      if (dueDate > last) break;
      if (dueDate >= first) dates.push(dueDate);
    }
  }
  return dates.filter(date => sub.isActive || sub.payments?.[date] || (sub.cancelledOn && date <= sub.cancelledOn)).map(dueDate => {
    const payment = sub.payments?.[dueDate];
    return { subscriptionId: sub.id, name: sub.name, category: sub.category, dueDate,
      ...(sub.contractId ? { contractId: sub.contractId } : {}),
      amount: payment?.amount ?? sub.amount, payment,
      status: payment ? 'PAID' : dueDate < today ? 'OVERDUE' : 'PENDING' };
  });
}

export function recurringSchedules(sub) {
  return [{ effectiveFrom: sub.startDate, startDate: sub.startDate, endDate: sub.endDate || null, frequency: sub.frequency, amount: sub.amount }, ...(sub.revisions || [])];
}

export function effectiveSchedule(sub, date = localDate()) {
  return recurringSchedules(sub).filter(item => item.effectiveFrom <= date).at(-1) || recurringSchedules(sub)[0];
}

export function earliestRevisionDate(sub, today = localDate()) {
  const after = [sub.revisions?.at(-1)?.effectiveFrom, ...Object.keys(sub.payments || {})].filter(Boolean).sort().at(-1);
  if (after === '9999-12-31') return null;
  const following = after ? iso(new Date(utc(after).getTime() + 86400000)) : today;
  return [today, sub.startDate, following].sort().at(-1);
}

export function recurringOccurrences(sub, from, to, today = localDate()) {
  if (!isRecurringAccount(sub)) return [];
  validDate(from); validDate(to);
  const schedules = recurringSchedules(sub);
  return schedules.flatMap((schedule, index) => {
    const next = schedules[index + 1]?.effectiveFrom;
    const until = next ? iso(new Date(utc(next).getTime() - 86400000)) : to;
    const lower = from > schedule.effectiveFrom ? from : schedule.effectiveFrom;
    const upper = until < to ? until : to;
    if (lower > upper) return [];
    return scheduleOccurrences({ ...sub, ...schedule }, lower, upper, today);
  });
}

// Somente acrescenta versões: os campos originais e os pagamentos não são reescritos.
export function prepareRecurringRevision(sub, payload, today = localDate()) {
  if (sub.contractId) throw new Error('Use Reajustar parcelas na tela Contratos para alterar o valor deste plano.');
  if (!isRecurringAccount(sub) || !sub.isActive) throw new Error('Só é possível editar contas recorrentes ativas da conta corrente.');
  const revisions = sub.revisions || [];
  if (!Number.isInteger(payload.expected_revision) || payload.expected_revision !== revisions.length) throw new Error('A recorrência foi alterada em outra tela. Feche e atualize a lista antes de editar.');
  const effectiveFrom = validDate(payload.effective_from);
  if (effectiveFrom < today) throw new Error('A alteração deve começar hoje ou em uma data futura.');
  const latest = revisions.at(-1)?.effectiveFrom;
  if (effectiveFrom < sub.startDate || (latest && effectiveFrom <= latest)) throw new Error('Escolha uma data posterior à última alteração e não anterior ao início da conta.');
  const prior = recurringSchedules(sub).at(-1);
  const revision = { effectiveFrom, amount: positiveMoney(payload.amount), frequency: payload.keep_calendar ? prior.frequency : payload.frequency, startDate: payload.keep_calendar ? prior.startDate : payload.start_date, endDate: payload.end_date || null };
  validateSchedule(revision);
  if (!payload.keep_calendar && revision.startDate < effectiveFrom) throw new Error('O primeiro vencimento novo não pode ser anterior à data da alteração.');
  if (revision.endDate && revision.endDate < effectiveFrom) throw new Error('O término não pode ser anterior à data da alteração.');
  const lastPaid = Object.keys(sub.payments || {}).sort().at(-1);
  if (lastPaid && lastPaid >= effectiveFrom) throw new Error('Há pagamento registrado a partir desta data. Escolha uma data posterior ao último vencimento pago (' + lastPaid.split('-').reverse().join('/') + ').');
  return revision;
}
