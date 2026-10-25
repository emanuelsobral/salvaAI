import { collection, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { financialOperation } from './financialOperation';
import { normalizeContract } from '../utils/contracts.js';
import { previewContractPlan } from '../utils/contractPlan.js';
import { validateSourceReview } from '../utils/contractExtraction.js';

function userPath(uid) {
  if (typeof uid !== 'string' || !uid || uid.includes('/')) throw new Error('Entre na sua conta para acessar contratos.');
  return collection(db, 'users', uid, 'contracts');
}

export async function getContracts(uid) {
  const snapshot = await getDocs(userPath(uid));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id }))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

export async function saveContract(uid, input, { id = null, expectedRevision = null, operationId } = {}) {
  const collectionRef = userPath(uid);
  const fields = normalizeContract(input);
  const sourceReview = !id && input.sourceReview ? validateSourceReview(input.sourceReview) : null;
  if (id !== null && (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,180}$/.test(id))) throw new Error('Contrato inválido.');
  if (id !== null && (!Number.isInteger(expectedRevision) || expectedRevision < 0)) throw new Error('Atualize a lista antes de editar o contrato.');
  return financialOperation(uid, operationId, { kind: 'CONTRACT_SAVE', id, expectedRevision, fields, sourceReview }, async (transaction, operationKey) => {
    const ref = doc(collectionRef, id || `contract_${operationKey}`);
    const previous = await transaction.get(ref);
    if (id && !previous.exists()) throw new Error('Contrato não encontrado. Atualize a lista.');
    if (previous.exists() && (!id || previous.data().revision !== expectedRevision)) {
      throw new Error('Este contrato foi alterado em outra tela. Cancele a edição e atualize a lista antes de tentar novamente.');
    }
    const revision = previous.exists() ? expectedRevision + 1 : 0;
    transaction.set(ref, {
      ...fields, schemaVersion: 1, revision,
      ...(previous.data()?.commitmentPlan ? { commitmentPlan: previous.data().commitmentPlan } : {}),
      ...(previous.data()?.sourceReview ? { sourceReview: previous.data().sourceReview } : sourceReview ? { sourceReview } : {}),
      createdAt: previous.exists() ? previous.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, revision };
  });
}

export async function createContractPlan(uid, contractId, input, { expectedRevision, operationId } = {}) {
  const collectionRef = userPath(uid);
  if (typeof contractId !== 'string' || !/^[a-zA-Z0-9_-]{1,180}$/.test(contractId)) throw new Error('Contrato inválido.');
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) throw new Error('Atualize o contrato antes de gerar os compromissos.');
  const preview = previewContractPlan(input);
  const plan = {
    subscriptionId: `contract_${contractId}`, amount: preview.amount, count: preview.count,
    frequency: preview.frequency, firstDueDate: preview.firstDueDate, lastDueDate: preview.lastDueDate,
    contractRevision: expectedRevision,
  };
  return financialOperation(uid, operationId, { kind: 'CONTRACT_PLAN', contractId, plan }, async transaction => {
    const contractRef = doc(collectionRef, contractId);
    const subRef = doc(db, 'users', uid, 'subscriptions', plan.subscriptionId);
    const contractSnap = await transaction.get(contractRef);
    const subSnap = await transaction.get(subRef);
    if (!contractSnap.exists()) throw new Error('Contrato não encontrado. Atualize a lista.');
    const contract = contractSnap.data();
    if (contract.commitmentPlan || subSnap.exists()) throw new Error('Este contrato já possui um plano de compromissos. Atualize a lista para consultá-lo.');
    if (contract.revision !== expectedRevision) throw new Error('O contrato mudou em outra tela. Cancele e atualize a lista para revisar a nova versão.');
    transaction.set(subRef, {
      name: contract.title, amount: plan.amount, billingMode: 'ACCOUNT', frequency: plan.frequency,
      startDate: plan.firstDueDate, endDate: plan.lastDueDate, dueDay: Number(plan.firstDueDate.slice(-2)),
      category: 'OUTROS', isActive: true, payments: {}, contractId, installmentCount: plan.count,
      createdAt: serverTimestamp(),
    });
    transaction.update(contractRef, { commitmentPlan: plan, revision: expectedRevision + 1, updatedAt: serverTimestamp() });
    return { commitmentPlan: plan, revision: expectedRevision + 1 };
  });
}
