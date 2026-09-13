import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getOrCreateAccount } from './accountService';
import { parseCSV } from '../utils/csv';
import { sumMoney, addMoney } from '../utils/finance';

async function hash(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function importCSV(uid, csvText) {
  const parsed = parseCSV(csvText);
  if (parsed.errors.length) throw new Error(parsed.errors.join('\n'));
  const account = await getOrCreateAccount(uid, 'GENERAL');
  const accountRef = doc(db, 'users', uid, 'accounts', account.id);
  const occurrences = new Map();
  const items = await Promise.all(parsed.rows.map(async row => {
    const canonical = JSON.stringify([row.date, row.description, row.type, row.amount]);
    const occurrence = occurrences.get(canonical) || 0;
    occurrences.set(canonical, occurrence + 1);
    return {
      row, transactionRef: doc(collection(db, 'users', uid, 'transactions')),
      markerRef: doc(db, 'users', uid, 'importRows', await hash(canonical + ':' + occurrence))
    };
  }));
  return runTransaction(db, async transaction => {
    const [balance, ...markers] = await Promise.all([transaction.get(accountRef), ...items.map(item => transaction.get(item.markerRef))]);
    if (!balance.exists()) throw new Error('Conta não encontrada.');
    const pending = items.filter((_, index) => !markers[index].exists());
    const delta = sumMoney(pending.map(item => item.row.type === 'INCOME' ? item.row.amount : -item.row.amount));
    if (pending.length) transaction.update(accountRef, { balance: addMoney(balance.data().balance, delta) });
    for (const item of pending) {
      const row = item.row;
      transaction.set(item.transactionRef, {
        accountId: account.id, accountType: 'GENERAL', kind: 'REGULAR', type: row.type,
        amount: row.amount, category: row.category, transactionDate: row.date,
        description: '[' + row.category + '] ' + row.description, status: 'COMPLETED', createdAt: serverTimestamp()
      });
      transaction.set(item.markerRef, { transactionId: item.transactionRef.id, createdAt: serverTimestamp() });
    }
    const skipped = items.length - pending.length;
    return { status: 'success', insertedCount: pending.length, skippedCount: skipped, message: pending.length + ' transações importadas; ' + skipped + ' já importadas foram ignoradas. Impacto no saldo: R$ ' + delta.toFixed(2) + '.' };
  });
}
