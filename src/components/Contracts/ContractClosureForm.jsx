import { useEffect, useRef, useState } from 'react';
import { useOperationKey } from '../../hooks/useOperationKey';
import { previewContractClosure } from '../../utils/contractClosure';
import { localDate } from '../../utils/finance';
import { contractError } from '../../utils/contracts';
import { formatBRL } from '../../utils/formatters';

const dateBR = value => value.split('-').reverse().join('/');

export default function ContractClosureForm({ contract, uid, service, onSaved, onCancel }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(!!contract.commitmentPlan);
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const mounted = useRef(true), locked = useRef(false), heading = useRef(null);
  const operation = useOperationKey();
  useEffect(() => {
    let active = true;
    mounted.current = true; heading.current?.focus();
    if (contract.commitmentPlan) service.getContractSubscription(uid, contract.id)
      .then(value => { if (active) setSub(value); })
      .catch(failure => { if (active) setError(contractError(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [uid, contract.id, contract.commitmentPlan, service]);
  function review(event) {
    event.preventDefault(); setError(''); setConfirmed(false);
    try { setPreview(previewContractClosure(contract, sub, { closedOn: localDate(), reason })); }
    catch (failure) { setError(contractError(failure)); }
  }
  async function confirm() {
    if (!confirmed || !preview || locked.current) return;
    locked.current = true; setSaving(true); setError('');
    try {
      const input = { closedOn: preview.closure.closedOn, reason: preview.closure.reason };
      const options = { expectedRevision: contract.revision, expectedSnapshot: preview.snapshot };
      const result = await service.closeContract(uid, contract.id, input, {
        ...options, operationId: operation.keyFor({ contractId: contract.id, ...input, ...options }),
      });
      if (mounted.current) { operation.complete(); onSaved({ ...contract, ...result }); }
    } catch (failure) { if (mounted.current) setError(contractError(failure)); }
    finally { locked.current = false; if (mounted.current) setSaving(false); }
  }
  return <section className="contract-editor" aria-labelledby="closure-heading">
    <h2 id="closure-heading" ref={heading} tabIndex={-1}>{preview ? 'Revisar encerramento' : 'Encerrar contrato'}</h2>
    <p>{contract.title}</p>
    <p>O encerramento será registrado no aplicativo hoje. Isso não envia aviso à outra parte nem realiza a rescisão do contrato.</p>
    {loading ? <p role="status">Conferindo parcelas e pagamentos…</p> : preview ? <>
      <p>Data do encerramento: {dateBR(preview.closure.closedOn)}.</p>
      {preview.closure.reason ? <p className="contract-closure-reason">Motivo: {preview.closure.reason}</p> : null}
      <p>{preview.cancelled.length} parcela(s) futura(s) sem pagamento serão canceladas. Total: {formatBRL(preview.cancelledTotal)}.</p>
      {preview.cancelled.length ? <div className="contract-plan-table" role="region" aria-label="Parcelas que serão canceladas" tabIndex={0}><table>
        <thead><tr><th scope="col">Vencimento</th><th scope="col">Valor cancelado</th></tr></thead>
        <tbody>{preview.cancelled.map(row => <tr key={row.dueDate}><td>{dateBR(row.dueDate)}</td><td>{formatBRL(row.amount)}</td></tr>)}</tbody>
      </table></div> : <p>{preview.previouslyCancelled ? 'A recorrência já foi encerrada. As datas de cancelamento anteriores serão mantidas.' : 'Não há parcelas futuras sem pagamento para cancelar.'}</p>}
      <p>{preview.pending.length} parcela(s) com vencimento até hoje continuam em aberto, no total de {formatBRL(preview.pendingTotal)}. Os {preview.paid.length} pagamento(s) registrados, inclusive antecipações, serão mantidos.</p>
      <p>O saldo não muda. O cadastro e as evidências ficam disponíveis para consulta. Depois de confirmar, este contrato não poderá ser editado, reajustado ou reaberto.</p>
      <label className="contract-plan-confirm"><input type="checkbox" checked={confirmed} disabled={saving} onChange={event => setConfirmed(event.target.checked)} />Conferi as parcelas canceladas e preservadas e quero encerrar este contrato.</label>
      <div className="contract-form-actions">
        <button className="contract-secondary" disabled={saving} onClick={() => { setPreview(null); setConfirmed(false); setError(''); }}>Voltar e revisar</button>
        <button className="btn-primary" disabled={saving || !confirmed} onClick={confirm}>{saving ? 'Encerrando…' : 'Confirmar encerramento'}</button>
      </div>
    </> : <form onSubmit={review}>
      <div className="contract-fields"><label className="contract-wide">Motivo do encerramento (opcional)<textarea rows={3} maxLength={600} value={reason} onChange={event => setReason(event.target.value)} /></label></div>
      <div className="contract-form-actions"><button className="btn-primary" type="submit" disabled={!!contract.commitmentPlan && !sub}>Ver prévia do encerramento</button></div>
    </form>}
    {error ? <p className="contract-error" role="alert">{error}</p> : null}
    <button className="contract-secondary" style={{ marginTop: '1rem' }} disabled={saving} onClick={onCancel}>Cancelar encerramento</button>
  </section>;
}
