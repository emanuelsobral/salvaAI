import { collection, doc, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getOrCreateAccount } from './accountService';
import { parseCSV } from '../utils/csv';
import { parseOFX } from '../utils/ofx';
import { inferPaymentMethod } from '../utils/transactionDetails';
import { sanitizeStatementDescription } from '../utils/statementPrivacy';
import { suggestCategory, getHistoryCategories } from '../utils/categories';
import { digest, transactionIdentity, normalizeMerchant } from '../utils/transactionIdentity';
import { sumMoney, addMoney } from '../utils/finance';

const bankFingerprint = row => digest(JSON.stringify([row.date, row.type, row.amount, row.externalId, row.source, sanitizeStatementDescription(row.description)]));

async function hash(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function importCSV(uid, csvText) {
  return importParsed(uid, parseCSV(csvText));
}

export async function importStatement(uid, text, format, options = {}) {
  if (!['CSV', 'OFX'].includes(format)) throw new Error('Formato de extrato inválido.');
  return importParsed(uid, format === 'OFX' ? parseOFX(text) : parseCSV(text), options);
}

export async function reviewStatement(uid, rows) {
  const [existing, preferences] = await Promise.all(['transactions', 'categoryPreferences'].map(name => getDocs(collection(db, 'users', uid, name))));
  const matches = new Map();
  for (const item of existing.docs) {
    const data = item.data();
    if (data.status !== 'COMPLETED' || (data.accountType || 'GENERAL') !== 'GENERAL' || (data.kind && data.kind !== 'REGULAR')) continue;
    const key = data.importIdentity || transactionIdentity(data);
    matches.set(key, [...(matches.get(key) || []), item]);
  }
  const prefs = new Map(preferences.docs.map(item => [item.id, item.data()]));
  const seen = new Map();
  return Promise.all(rows.map(async row => {
    const key = transactionIdentity(row), occurrence = seen.get(key) || 0;
    seen.set(key, occurrence + 1);
    const preference = prefs.get(await digest(row.type + ':' + normalizeMerchant(row.description)));
    const importSource = row.source ? await digest(row.source) : '';
    const compatible = (matches.get(key) || []).filter(item => !importSource || !item.data().importSource || item.data().importSource === importSource);
    return { description: sanitizeStatementDescription(row.description), category: preference?.category || suggestCategory(sanitizeStatementDescription(row.description), row.type), paymentMethod: inferPaymentMethod(row.description), duplicateId: compatible[occurrence]?.id || null };
  }));
}

async function importParsed(uid, parsed, options = {}) {
  if (parsed.errors.length) throw new Error(parsed.errors.join('\n'));
  const account = await getOrCreateAccount(uid, 'GENERAL');
  const accountRef = doc(db, 'users', uid, 'accounts', account.id);
  const review = await reviewStatement(uid, parsed.rows);
  if (options.selectedIndices && (!Array.isArray(options.selectedIndices) || new Set(options.selectedIndices).size !== options.selectedIndices.length || options.selectedIndices.some(index => !Number.isInteger(index) || index < 0 || index >= parsed.rows.length))) throw new Error('Seleção de linhas inválida.');
  const occurrences = new Map();
  const unifiedOccurrences = new Map();
  const items = await Promise.all(parsed.rows.map(async row => {
    const index = parsed.rows.indexOf(row);
    const canonical = JSON.stringify([row.date, row.description, row.type, row.amount]);
    const occurrence = occurrences.get(canonical) || 0;
    occurrences.set(canonical, occurrence + 1);
    const unified = transactionIdentity(row), ordinal = unifiedOccurrences.get(unified) || 0;
    unifiedOccurrences.set(unified, ordinal + 1);
    const correction = options.corrections?.[index] || {};
    const description = sanitizeStatementDescription(correction.description ?? review[index].description);
    const category = correction.category || review[index].category;
    if (!getHistoryCategories(row.type).some(item => item.value === category)) throw new Error('Categoria inválida para o tipo de movimentação.');
    return {
      index, row, description, category, duplicateId: options.keepDuplicates?.includes(index) ? null : review[index].duplicateId,
      sharedRef: doc(db, 'users', uid, 'importRows', await hash('unified:' + account.id + ':' + (row.source || '') + ':' + unified + ':' + ordinal + (options.keepDuplicates?.includes(index) ? ':' + options.batchId : ''))),
      transactionRef: doc(collection(db, 'users', uid, 'transactions')),
      markerRef: doc(db, 'users', uid, 'importRows', await hash(row.externalId ? JSON.stringify(['OFX', row.source, row.externalId]) : canonical + ':' + occurrence))
    };
  }));
  const selected = items.filter(item => !options.selectedIndices || options.selectedIndices.includes(item.index));
  if (!selected.length) throw new Error('Selecione pelo menos um lançamento.');
  if (selected.length > 150) throw new Error('Selecione até 150 lançamentos por importação.');
  return runTransaction(db, async transaction => {
    const [balance, ...states] = await Promise.all([transaction.get(accountRef), ...selected.map(async item => ({ marker: await transaction.get(item.markerRef), shared: await transaction.get(item.sharedRef), duplicate: item.duplicateId ? await transaction.get(doc(db, 'users', uid, 'transactions', item.duplicateId)) : null }))]);
    for (const [index, state] of states.entries()) {
      const marker = state.marker;
      if (marker.exists() && selected[index].row.externalId) {
        const row = selected[index].row, previous = marker.data().fingerprint;
        const current = 'v2:' + await bankFingerprint(row);
        const legacy = [JSON.stringify(row), await digest(JSON.stringify(row))];
        if (previous !== current && !legacy.includes(previous)) {
          // Categorias antigas eram inferidas da descrição completa, incluindo o nome do banco.
          const categories = [...new Set([...getHistoryCategories('INCOME'), ...getHistoryCategories('EXPENSE')].map(item => item.value))];
          const candidates = await Promise.all(categories.map(category => digest(JSON.stringify({ ...row, category }))));
          if (!candidates.includes(previous)) throw new Error('O banco reutilizou um identificador com dados diferentes. Concilie o extrato antes de importar.');
        }
      }
    }
    if (!balance.exists()) throw new Error('Conta não encontrada.');
    const pending = selected.filter((_, index) => !states[index].marker.exists() && !states[index].shared.exists() && !states[index].duplicate?.exists());
    const delta = sumMoney(pending.map(item => item.row.type === 'INCOME' ? item.row.amount : -item.row.amount));
    if (pending.length) transaction.update(accountRef, { balance: addMoney(balance.data().balance, delta) });
    for (const item of pending) {
      const row = item.row;
      const { description, category } = item;
      transaction.set(item.transactionRef, {
        accountId: account.id, accountType: 'GENERAL', kind: 'REGULAR', type: row.type,
        amount: row.amount, category, transactionDate: row.date,
        paymentMethod: inferPaymentMethod(row.description), originalDescription: sanitizeStatementDescription(row.description),
        importIdentity: transactionIdentity(row),
        ...(row.source ? { importSource: await digest(row.source) } : {}),
        description, status: 'COMPLETED', createdAt: serverTimestamp()
      });
      transaction.set(item.markerRef, { transactionId: item.transactionRef.id, ...(row.externalId ? { fingerprint: 'v2:' + await bankFingerprint(row) } : {}), createdAt: serverTimestamp() });
      transaction.set(item.sharedRef, { transactionId: item.transactionRef.id, createdAt: serverTimestamp() });
    }
    const skipped = selected.length - pending.length;
    return { status: 'success', insertedCount: pending.length, skippedCount: skipped, message: pending.length + ' transações importadas; ' + skipped + ' já importadas foram ignoradas. Impacto no saldo: R$ ' + delta.toFixed(2) + '.' };
  });
}
