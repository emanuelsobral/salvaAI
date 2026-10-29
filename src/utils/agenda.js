import { localDate, positiveMoney, sumMoney, validDate } from './finance.js';
import { isRecurringAccount, recurringOccurrences, recurringSchedules, validateSchedule } from './recurrence.js';

export const AGENDA_STATUS = { ALL: 'Todas', OVERDUE: 'Atrasadas', TODAY: 'Hoje', UPCOMING: 'Próximas', PAID: 'Pagas' };
const utc = value => new Date(value + 'T12:00:00Z');
const iso = date => date.toISOString().slice(0, 10);
const minimum = '1900-01-01', maximum = '9999-12-31';

export function agendaSelection(params, today = localDate()) {
  let date = params.get('data') || today;
  try { validDate(date); } catch { date = today; }
  return { date, view: params.get('visao') === 'semana' ? 'semana' : 'mes' };
}

export function agendaPeriod(date, view) {
  validDate(date);
  if (!['mes', 'semana'].includes(view)) throw new Error('Visão de agenda inválida.');
  const day = utc(date);
  if (view === 'mes') return { from: date.slice(0, 7) + '-01', to: iso(new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 0, 12))) };
  const monday = new Date(day);
  monday.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: monday.getUTCFullYear() < 1900 ? minimum : iso(monday), to: sunday.getUTCFullYear() > 9999 ? maximum : iso(sunday) };
}

export function moveAgendaPeriod(date, view, step) {
  const period = agendaPeriod(date, view);
  if (![1, -1].includes(step)) throw new Error('Direção inválida.');
  const target = utc(period.from);
  if (view === 'mes') target.setUTCMonth(target.getUTCMonth() + step);
  else target.setUTCDate(target.getUTCDate() + 7 * step);
  return target.getUTCFullYear() < 1900 || target.getUTCFullYear() > 9999 ? null : iso(target);
}

export function buildAgenda(subscriptions, date, view, today = localDate()) {
  validDate(today);
  const period = agendaPeriod(date, view);
  const seen = new Set();
  for (const sub of subscriptions.filter(isRecurringAccount)) {
    for (const schedule of recurringSchedules(sub)) {
      validateSchedule(schedule); validDate(schedule.effectiveFrom); positiveMoney(schedule.amount);
    }
  }
  const rows = subscriptions.flatMap(sub => recurringOccurrences(sub, period.from, period.to, today)).map(item => {
    const key = JSON.stringify([item.subscriptionId, item.dueDate]);
    if (seen.has(key)) throw new Error('Há vencimentos repetidos. Atualize a agenda antes de registrar pagamentos.');
    seen.add(key);
    const status = item.payment ? 'PAID' : item.dueDate < today ? 'OVERDUE' : item.dueDate === today ? 'TODAY' : 'UPCOMING';
    return { ...item, key, agendaStatus: status };
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name) || a.subscriptionId.localeCompare(b.subscriptionId));
  const counts = Object.fromEntries(Object.keys(AGENDA_STATUS).map(status => [status, status === 'ALL' ? rows.length : rows.filter(row => row.agendaStatus === status).length]));
  return { ...period, rows, counts, pending: sumMoney(rows.filter(row => !row.payment).map(row => row.amount)), paid: sumMoney(rows.filter(row => row.payment).map(row => row.amount)) };
}
