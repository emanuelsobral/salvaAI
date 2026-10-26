import { collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { financialOperation } from './financialOperation';
import { normalizeContract } from '../utils/contracts.js';
import { previewContractPlan } from '../utils/contractPlan.js';
import { validateSourceReview } from '../utils/contractExtraction.js';
import { contractPlanSnapshot, previewContractAdjustment } from '../utils/contractAdjustment.js';
import { previewContractClosure } from '../utils/contractClosure.js';

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
    if (previous.data()?.closure) throw new Error('Contratos encerrados ficam disponíveis apenas para consulta.');
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
    if (contract.closure) throw new Error('Não é possível criar um plano para um contrato encerrado.');
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

function planRefs(uid, contractId) {
  const collectionRef = userPath(uid);
  if (typeof contractId !== 'string' || !/^[a-zA-Z0-9_-]{1,180}$/.test(contractId)) throw new Error('Contrato inválido.');
  return { contractRef: doc(collectionRef, contractId), subRef: doc(db, 'users', uid, 'subscriptions', `contract_${contractId}`) };
}

export async function getContractSubscription(uid, contractId) {
  const { subRef } = planRefs(uid, contractId);
  const snapshot = await getDoc(subRef);
  if (!snapshot.exists() || snapshot.data().contractId !== contractId) throw new Error('Plano não encontrado. Atualize a lista de contratos.');
  return { ...snapshot.data(), id: snapshot.id };
}

export async function adjustContractPlan(uid, contractId, input, { expectedRevision, expectedSnapshot, operationId } = {}) {
  const { contractRef, subRef } = planRefs(uid, contractId);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0 || typeof expectedSnapshot !== 'string') throw new Error('Reabra o reajuste para revisar o plano atualizado.');
  const fields = { type: input.type, value: input.value, effectiveFrom: input.effectiveFrom };
  return financialOperation(uid, operationId, { kind: 'CONTRACT_ADJUSTMENT', contractId, expectedRevision, expectedSnapshot, ...fields }, async transaction => {
    const contractSnap = await transaction.get(contractRef);
    const subSnap = await transaction.get(subRef);
    if (!contractSnap.exists() || !subSnap.exists()) throw new Error('Contrato ou plano não encontrado.');
    const contract = contractSnap.data(), sub = subSnap.data();
    if (contract.closure) throw new Error('Não é possível reajustar um contrato encerrado.');
    if (contract.commitmentPlan?.subscriptionId !== subRef.id || sub.contractId !== contractId) throw new Error('O plano não pertence a este contrato.');
    if (contract.revision !== expectedRevision || contractPlanSnapshot(sub) !== expectedSnapshot) throw new Error('O contrato, o plano ou os pagamentos mudaram em outra tela. Cancele e reabra o reajuste para conferir a nova prévia.');
    const preview = previewContractAdjustment({ ...sub, id: subRef.id }, fields);
    transaction.update(subRef, { revisions: [...(sub.revisions || []), preview.revision], updatedAt: serverTimestamp() });
    transaction.update(contractRef, { revision: expectedRevision + 1, updatedAt: serverTimestamp() });
    return { revision: expectedRevision + 1 };
  });
}

export async function closeContract(uid, contractId, input, { expectedRevision, expectedSnapshot, operationId } = {}) {
  const { contractRef, subRef } = planRefs(uid, contractId);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0 || !(expectedSnapshot === null || typeof expectedSnapshot === 'string')) throw new Error('Reabra o encerramento para conferir os dados atuais.');
  const fields = { closedOn: input.closedOn, reason: input.reason };
  return financialOperation(uid, operationId, { kind: 'CONTRACT_CLOSE', contractId, expectedRevision, expectedSnapshot, ...fields }, async transaction => {
    const contractSnap = await transaction.get(contractRef);
    if (!contractSnap.exists()) throw new Error('Contrato não encontrado. Atualize a lista.');
    const contract = { ...contractSnap.data(), id: contractId };
    let sub = null;
    if (contract.commitmentPlan) {
      const subSnap = await transaction.get(subRef);
      if (!subSnap.exists()) throw new Error('Plano não encontrado. Atualize a lista.');
      sub = { ...subSnap.data(), id: subRef.id };
    }
    if (contract.revision !== expectedRevision || (sub ? contractPlanSnapshot(sub) : null) !== expectedSnapshot) throw new Error('O contrato, o plano ou os pagamentos mudaram em outra tela. Cancele e reabra o encerramento para revisar a prévia.');
    const preview = previewContractClosure(contract, sub, fields);
    if (sub?.isActive) transaction.update(subRef, { isActive: false, cancelledOn: preview.closure.closedOn, cancelledAt: serverTimestamp() });
    transaction.update(contractRef, { closure: preview.closure, revision: expectedRevision + 1, updatedAt: serverTimestamp() });
    return { closure: preview.closure, revision: expectedRevision + 1 };
  });
}
