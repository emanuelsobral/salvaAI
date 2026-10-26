import { localDate, validDate, sumMoney } from './finance.js';
import { recurringOccurrences } from './recurrence.js';
import { contractPlanSnapshot } from './contractAdjustment.js';

export function previewContractClosure(contract, sub, input, today = localDate()) {
  if (contract.closure) throw new Error('Este contrato já foi encerrado. Atualize a lista.');
  const closedOn = validDate(input.closedOn);
  if (closedOn !== today) throw new Error('A data mudou desde a prévia. Cancele e reabra o encerramento para conferir os vencimentos.');
  if (typeof input.reason !== 'string' || input.reason.trim().length > 600) throw new Error('O motivo deve ter até 600 caracteres.');
  const subscriptionId = contract.commitmentPlan?.subscriptionId ?? null;
  if (subscriptionId ? (!sub || sub.id !== subscriptionId || sub.contractId !== contract.id) : sub != null) throw new Error('O plano do contrato não pôde ser conferido. Atualize a lista.');
  const rows = sub ? recurringOccurrences(sub, sub.startDate, sub.endDate, today) : [];
  const cancelled = rows.filter(row => !row.payment && row.dueDate > closedOn);
  const pending = rows.filter(row => !row.payment && row.dueDate <= closedOn);
  const paid = rows.filter(row => row.payment);
  return {
    closure: { closedOn, reason: input.reason.trim(), subscriptionId },
    cancelled, pending, paid,
    cancelledTotal: sumMoney(cancelled.map(row => row.amount)),
    pendingTotal: sumMoney(pending.map(row => row.amount)),
    snapshot: sub ? contractPlanSnapshot(sub) : null,
    previouslyCancelled: !!sub && !sub.isActive,
  };
}
