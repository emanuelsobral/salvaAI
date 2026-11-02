import { sumMoney, isInvestment, isTransfer } from './finance.js';
export function summarizeHistory(rows) {
  const completed = rows.filter(row => row.status === 'COMPLETED' && row.account_type !== 'CARTAO' && !isTransfer(row));
  const income = sumMoney(completed.filter(row => row.type === 'INCOME').map(row => row.amount));
  const investments = sumMoney(completed.filter(row => row.type === 'EXPENSE' && isInvestment(row)).map(row => row.amount));
  const expenses = sumMoney(completed.filter(row => row.type === 'EXPENSE' && !isInvestment(row)).map(row => row.amount));
  return { income, expenses, investments, difference: sumMoney([income, -expenses, -investments]) };
}
export const searchText = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
