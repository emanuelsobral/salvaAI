/**
 * Account Service - Gerencia contas isoladas (GENERAL, VR, VA, CAIXINHA).
 * Substitui as queries de `models.Account` do SQLAlchemy.
 * 
 * Firestore Path: users/{uid}/accounts/{docId}
 * 
 * Documento:
 * {
 *   name: string,          // "Conta Corrente", "Vale Refeição", etc.
 *   type: string,          // "GENERAL" | "VR" | "VA" | "CAIXINHA"
 *   balance: number,       // Saldo atual (positivo ou negativo)
 *   goalAmount: number|null, // Meta (apenas CAIXINHA)
 *   createdAt: Timestamp
 * }
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  runTransaction,
  updateDoc,
  query,
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

const accountsRef = (uid) => collection(db, 'users', uid, 'accounts');

/**
 * Busca todas as contas do usuário.
 */
export async function getAccounts(uid) {
  const snap = await getDocs(accountsRef(uid));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Busca contas agrupadas por tipo e retorna saldos.
 * @returns {{ GENERAL: number, VR: number, VA: number, CAIXINHA: number }}
 */
export async function getBalancesByType(uid) {
  const accounts = await getAccounts(uid);
  const balances = { GENERAL: 0, VR: 0, VA: 0, CAIXINHA: 0 };
  
  for (const acc of accounts) {
    if (acc.type in balances) {
      balances[acc.type] += acc.balance || 0;
    }
  }
  
  return balances;
}

/**
 * Busca ou cria automaticamente a conta do tipo especificado.
 * Equivale ao padrão `db.query(Account).filter(type==X).first() or create` do Python.
 */
export async function getOrCreateAccount(uid, type) {
  if (!['GENERAL', 'VR', 'VA'].includes(type)) throw new Error('Tipo de conta inválido.');
  const q = query(accountsRef(uid), where('type', '==', type));
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    if (snap.docs.length > 1) throw new Error('Contas duplicadas: concilie os saldos antes de movimentar.');
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  
  // Nomes padrão por tipo
  const names = {
    GENERAL: 'Conta Corrente',
    VR: 'Vale Refeição',
    VA: 'Vale Alimentação',
    CAIXINHA: 'Caixinha'
  };
  
  const ref = doc(accountsRef(uid), type);
  return runTransaction(db, async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists()) return { id: existing.id, ...existing.data() };
    const data = { name: names[type], type, balance: 0, goalAmount: null };
    transaction.set(ref, { ...data, createdAt: serverTimestamp() });
    return { id: ref.id, ...data };
  });
}

/**
 * Atualiza o saldo de uma conta (incrementa/decrementa atomicamente).
 */
export async function updateBalance(uid, accountId, delta) {
  const ref = doc(db, 'users', uid, 'accounts', accountId);
  await updateDoc(ref, { balance: increment(delta) });
}

/**
 * Busca contas do tipo CAIXINHA com dados de progresso.
 */
export async function getCaixinhas(uid) {
  const q = query(accountsRef(uid), where('type', '==', 'CAIXINHA'));
  const snap = await getDocs(q);
  
  return snap.docs.map(d => {
    const data = d.data();
    const balance = data.balance || 0;
    const target = data.goalAmount || 0;
    const progress = target > 0 ? Math.min(100, (balance / target) * 100) : 0;
    
    return {
      id: d.id,
      name: data.name,
      balance,
      target,
      progress_percent: progress
    };
  });
}

/**
 * Busca uma conta específica por ID.
 */
export async function getAccountById(uid, accountId) {
  const ref = doc(db, 'users', uid, 'accounts', accountId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
