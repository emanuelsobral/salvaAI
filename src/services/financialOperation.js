import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// O marcador sobrevive aos estornos: repetir uma requisição antiga não recria a movimentação.
export async function financialOperation(uid, operationId, payload, execute) {
  const id = operationId || crypto.randomUUID();
  if (typeof uid !== 'string' || !uid || !/^[a-zA-Z0-9_-]{1,160}$/.test(id)) {
    throw new Error('Usuário ou identificador da operação inválido.');
  }
  const ref = doc(db, 'users', uid, 'operations', id);
  const fingerprint = JSON.stringify(payload);
  return runTransaction(db, async transaction => {
    const previous = await transaction.get(ref);
    if (previous.exists()) {
      if (previous.data().fingerprint !== fingerprint) throw new Error('Identificador já utilizado por outra operação.');
      return previous.data().result;
    }
    const result = await execute(transaction, id);
    transaction.set(ref, { fingerprint, result, createdAt: serverTimestamp() });
    return result;
  });
}
