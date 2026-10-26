import { useEffect, useRef, useState } from 'react';
import { useOperationKey } from '../../hooks/useOperationKey';
import { previewContractAdjustment } from '../../utils/contractAdjustment';
import { localDate } from '../../utils/finance';
import { contractError } from '../../utils/contracts';
import { formatBRL } from '../../utils/formatters';

const dateBR = value => value.split('-').reverse().join('/');

export default function ContractAdjustmentForm({ contract, uid, service, onSaved, onCancel }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState({ type: 'AMOUNT', value: '', effectiveFrom: '' });
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const mounted = useRef(true), locked = useRef(false), heading = useRef(null);
  const operation = useOperationKey();
  useEffect(() => {
    let active = true;
    mounted.current = true;
    heading.current?.focus();
    service.getContractSubscription(uid, contract.id).then(value => { if (active) setSub(value); })
      .catch(failure => { if (active) setError(contractError(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [uid, contract.id, service]);
  function change(event) {
    const { name, value } = event.target;
    setFields(previous => ({ ...previous, [name]: value, ...(name === 'type' ? { value: '' } : {}) }));
    setPreview(null); setConfirmed(false); setError('');
  }
  function review(event) {
    event.preventDefault(); setError(''); setConfirmed(false);
    try { setPreview(previewContractAdjustment(sub, { ...fields, value: Number(fields.value) })); }
    catch (failure) { setError(contractError(failure)); }
  }
  async function confirm() {
    if (!confirmed || !preview || locked.current) return;
    locked.current = true; setSaving(true); setError('');
    try {
      const input = { type: preview.revision.adjustmentType, value: preview.revision.adjustmentValue, effectiveFrom: preview.revision.effectiveFrom };
      const options = { expectedRevision: contract.revision, expectedSnapshot: preview.snapshot };
      const result = await service.adjustContractPlan(uid, contract.id, input, {
        ...options, operationId: operation.keyFor({ contractId: contract.id, ...input, ...options }),
      });
      if (mounted.current) { operation.complete(); onSaved({ ...contract, ...result }); }
    } catch (failure) { if (mounted.current) setError(contractError(failure)); }
    finally { locked.current = false; if (mounted.current) setSaving(false); }
  }
  return <section className="contract-editor" aria-labelledby="adjustment-heading">
    <h2 id="adjustment-heading" ref={heading} tabIndex={-1}>{preview ? 'Revisar reajuste' : 'Reajustar parcelas'}</h2>
    <p>{contract.title}</p>
    {loading ? <p role="status">Carregando plano e pagamentos…</p> : sub ? <>
      <p>Informe o valor acordado ou um percentual. O sistema não consulta índices de reajuste. Datas e quantidade de parcelas serão mantidas.</p>
      {contract.adjustmentRule ? <p>Regra no cadastro: {contract.adjustmentRule}</p> : null}
      {sub.revisions?.length ? <details className="contract-adjustment-history"><summary>Reajustes registrados ({sub.revisions.length})</summary><ul>{sub.revisions.map(revision => <li key={revision.effectiveFrom}>
        A partir de {dateBR(revision.effectiveFrom)}: {formatBRL(revision.previousAmount)} para {formatBRL(revision.amount)}{revision.adjustmentType === 'PERCENT' ? ` (${revision.adjustmentValue}%)` : ''}.
      </li>)}</ul></details> : null}
      {!sub.isActive ? <p className="contract-notice">Este plano foi encerrado e não pode receber reajustes.</p> : preview ? <>
        <p>A partir de {dateBR(preview.revision.effectiveFrom)}, {preview.rows.length} parcela(s) passam de {formatBRL(preview.revision.previousAmount)} para {formatBRL(preview.revision.amount)}.</p>
        <p>Total das parcelas afetadas: {formatBRL(preview.previousTotal)} → {formatBRL(preview.total)}.</p>
        <div className="contract-plan-table" role="region" aria-label="Prévia do reajuste" tabIndex={0}><table>
          <thead><tr><th scope="col">Vencimento</th><th scope="col">Antes</th><th scope="col">Depois</th></tr></thead>
          <tbody>{preview.rows.map(row => <tr key={row.dueDate}><td>{dateBR(row.dueDate)}</td><td>{formatBRL(row.previousAmount)}</td><td>{formatBRL(row.amount)}</td></tr>)}</tbody>
        </table></div>
        <p>O reajuste altera apenas os valores futuros mostrados acima. Pagamentos e vencimentos anteriores serão preservados. O valor original do cadastro e o saldo não mudam.</p>
        <label className="contract-plan-confirm"><input type="checkbox" checked={confirmed} disabled={saving} onChange={event => setConfirmed(event.target.checked)} />Conferi a data e os valores do reajuste.</label>
        <div className="contract-form-actions">
          <button className="contract-secondary" disabled={saving} onClick={() => { setPreview(null); setConfirmed(false); setError(''); }}>Voltar e ajustar</button>
          <button className="btn-primary" disabled={saving || !confirmed} onClick={confirm}>{saving ? 'Confirmando…' : 'Confirmar reajuste'}</button>
        </div>
      </> : <form onSubmit={review}>
        <p>Valor após o último reajuste programado: {formatBRL(sub.revisions?.at(-1)?.amount ?? sub.amount)}. Escolha uma data futura, posterior aos reajustes já registrados e aos vencimentos pagos, inclusive antecipações.</p>
        <div className="contract-fields">
          <label>Forma do reajuste<select name="type" value={fields.type} onChange={change}><option value="AMOUNT">Novo valor em reais</option><option value="PERCENT">Percentual sobre o valor anterior</option></select></label>
          <label>{fields.type === 'AMOUNT' ? 'Novo valor da parcela (R$)' : 'Percentual de reajuste (%)'}<input name="value" type="number" inputMode="decimal" required min={fields.type === 'AMOUNT' ? '0.01' : '-99.99'} max={fields.type === 'AMOUNT' ? '1000000000' : '10000'} step="0.01" value={fields.value} onChange={change} /></label>
          <label>Aplicar a partir de<input name="effectiveFrom" type="date" required min={localDate()} max={sub.endDate} value={fields.effectiveFrom} onChange={change} /></label>
        </div>
        <div className="contract-form-actions"><button className="btn-primary" type="submit">Ver prévia do reajuste</button></div>
      </form>}
    </> : null}
    {error ? <p className="contract-error" role="alert">{error}</p> : null}
    <button className="contract-secondary" style={{ marginTop: '1rem' }} disabled={saving} onClick={onCancel}>Cancelar reajuste</button>
  </section>;
}
