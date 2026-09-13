import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { calculateDashboard } from '../utils/dashboard';

export async function getDashboardData(uid) {
  const names = ['accounts', 'transactions', 'cardTransactions', 'subscriptions', 'invoices'];
  const snapshots = await Promise.all(names.map(name => getDocs(collection(db, 'users', uid, name))));
  const [accounts, transactions, cards, subscriptions, invoices] = snapshots.map(snap => snap.docs.map(item => ({ id: item.id, ...item.data() })));
  return calculateDashboard({ accounts, transactions, cards, subscriptions, invoices });
}
