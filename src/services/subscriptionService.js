/**
 * Subscription Service - Gerencia assinaturas/despesas recorrentes.
 * Substitui routes_subs.py (61 linhas Python).
 * 
 * Firestore Path: users/{uid}/subscriptions/{docId}
 * 
 * Documento:
 * {
 *   name: string,       // "Netflix", "Academia", etc.
 *   amount: number,     // Valor mensal
 *   dueDay: number,     // Dia do vencimento (1-31)
 *   category: string,   // "Streaming", "Saúde", etc.
 *   isActive: boolean,  // true = ativa
 *   createdAt: Timestamp
 * }
 */

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { financialOperation } from './financialOperation';
import { positiveMoney, requiredText, localDate } from '../utils/finance';

const subsRef = (uid) => collection(db, 'users', uid, 'subscriptions');

/**
 * Cria uma nova assinatura ativa.
 * Equivale a POST /api/subs/create
 */
export async function createSubscription(uid, payload) {
  const name = requiredText(payload.name, 'Nome');
  const amount = positiveMoney(payload.amount);
  const { due_day, category } = payload;
  if (!Number.isInteger(due_day) || due_day < 1 || due_day > 31) throw new Error('Dia de vencimento inválido.');
  
  const ref = doc(subsRef(uid));
  return financialOperation(uid, payload.operation_id, { kind: 'SUBSCRIPTION', name, amount, due_day, category: category || 'ASSINATURAS' }, async transaction => {
  transaction.set(ref, {
    name,
    amount,
    startMonth: localDate().slice(0, 7),
    dueDay: due_day,
    category: category || 'Outros',
    isActive: true,
    createdAt: serverTimestamp()
  });
  
  return {
    status: 'success',
    message: 'Assinatura cadastrada. Os pagamentos são registrados manualmente na fatura.'
  };
  });
}

/**
 * Lista todas as assinaturas ativas.
 * Equivale a GET /api/subs/
 */
export async function getActiveSubscriptions(uid) {
  const q = query(subsRef(uid), where('isActive', '==', true));
  const snap = await getDocs(q);
  
  return {
    status: 'success',
    subs: snap.docs.map(d => ({
      id: d.id,
      name: d.data().name,
      amount: d.data().amount,
      due_day: d.data().dueDay
    }))
  };
}

/**
 * Deleta (desativa) uma assinatura.
 * Equivale a DELETE /api/subs/{sub_id}
 */
export async function deleteSubscription(uid, subId) {
  const ref = doc(db, 'users', uid, 'subscriptions', subId);
  await updateDoc(ref, { isActive: false, cancelledAt: serverTimestamp() });
  
  return {
    status: 'success',
    message: 'Assinatura cancelada. O histórico dos pagamentos foi preservado.'
  };
}

/**
 * Retorna o total mensal de assinaturas ativas.
 */
export async function getActiveSubscriptionsTotal(uid) {
  const q = query(subsRef(uid), where('isActive', '==', true));
  const snap = await getDocs(q);
  
  let total = 0;
  const subs = [];
  snap.docs.forEach(d => {
    const data = d.data();
    total += data.amount || 0;
    subs.push({ id: d.id, ...data });
  });
  
  return { total, subs };
}
