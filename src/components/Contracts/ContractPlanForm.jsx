import { useEffect, useRef, useState } from 'react';
import { useOperationKey } from '../../hooks/useOperationKey';
import { previewContractPlan } from '../../utils/contractPlan';
import { contractError } from '../../utils/contracts';
import { FREQUENCIES } from '../../utils/recurrence';
import { formatBRL } from '../../utils/formatters';

const dateBR = value => value.split('-').reverse().join('/');

export default function ContractPlanForm({ contract, uid, service, onSaved, onCancel }) {
  const [fields, setFields] = useState({ amount: contract.amount ?? '', count: contract.installments ?? '', frequency: '', firstDueDate: '' });
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  const heading = useRef(null);
  const operation = useOperationKey();
  useEffect(() => { mounted.current = true; heading.current?.focus(); return () => { mounted.current = false; }; }, []);
  const change = event => setFields(previous => ({ ...previous, [event.target.name]: event.target.value }));
  function review(event) {
    event.preventDefault();
    setError('');
    try { setPreview(previewContractPlan({ ...fields, amount: Number(fields.amount), count: Number(fields.count) })); setConfirmed(false); }
    catch (failure) { setError(contractError(failure)); }
  }
  async function confirm() {
    if (!confirmed || !preview || locked.current) return;
    locked.current = true; setSaving(true); setError('');
    try {
      const input = { amount: preview.amount, count: preview.count, frequency: preview.frequency, firstDueDate: preview.firstDueDate };
      const result = await service.createContractPlan(uid, contract.id, input, {
        expectedRevision: contract.revision,
        operationId: operation.keyFor({ contractId: contract.id, revision: contract.revision, ...input }),
      });
      if (mounted.current) { operation.complete(); onSaved({ ...contract, ...result }); }
    } catch (failure) { if (mounted.current) setError(contractError(failure)); }
    finally { locked.current = false; if (mounted.current) setSaving(false); }
  }
  return <section className="contract-editor" aria-labelledby="plan-heading">
    <h2 id="plan-heading" ref={heading} tabIndex={-1}>{preview ? 'Revisar compromissos' : 'Planejar compromissos'}</h2>
    <p><strong>{contract.title}</strong></p>
    <p>Defina um plano de parcelas iguais. Datas e frequência precisam ser escolhidas; a regra escrita não é interpretada automaticamente.</p>
    {contract.dueRule ? <p><strong>Vencimento no cadastro:</strong> {contract.dueRule}</p> : null}
    {preview ? <>
      <p className="contract-plan-total">{preview.count} parcela(s) de {formatBRL(preview.amount)} · Total: <strong>{formatBRL(preview.total)}</strong></p>
      <p>{FREQUENCIES[preview.frequency]} · De {dateBR(preview.firstDueDate)} até {dateBR(preview.lastDueDate)}.</p>
      <p>Nos meses sem o dia escolhido, o vencimento vai para o último dia do mês. O plano não calcula juros, carência, reajustes ou dias úteis.</p>
      {(contract.startDate && preview.firstDueDate < contract.startDate) || (contract.endDate && preview.lastDueDate > contract.endDate) ? <p className="contract-notice">Há vencimentos fora da vigência informada. Confira se o contrato prevê esses pagamentos antes de confirmar.</p> : null}
      <div className="contract-plan-table" role="region" aria-label="Prévia dos vencimentos" tabIndex={0}>
        <table><thead><tr><th scope="col">Parcela</th><th scope="col">Vencimento</th><th scope="col">Valor</th></tr></thead>
          <tbody>{preview.rows.map(row => <tr key={row.number}><td>{row.number}</td><td>{dateBR(row.dueDate)}</td><td>{formatBRL(row.amount)}</td></tr>)}</tbody>
        </table>
      </div>
      <label className="contract-plan-confirm"><input type="checkbox" checked={confirmed} disabled={saving} onChange={event => setConfirmed(event.target.checked)} />Conferi os valores e vencimentos e verifiquei que não cadastrei estas contas anteriormente.</label>
      <p>A confirmação adiciona os vencimentos às contas recorrentes e à projeção. O saldo só muda ao registrar o pagamento. Nesta versão, só é possível confirmar um plano por contrato.</p>
      <div className="contract-form-actions"><button type="button" className="contract-secondary" disabled={saving} onClick={() => { setPreview(null); setError(''); }}>Voltar e ajustar</button><button type="button" className="btn-primary" disabled={saving || !confirmed} onClick={confirm}>{saving ? 'Confirmando…' : 'Confirmar compromissos'}</button></div>
    </> : <form onSubmit={review}>
      <div className="contract-fields">
        <label>Valor de cada parcela (R$)<input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" max="1000000000" required value={fields.amount} onChange={change} /></label>
        <label>Quantidade de parcelas<input name="count" type="number" inputMode="numeric" step="1" min="1" max="1200" required value={fields.count} onChange={change} /></label>
        <label>Primeiro vencimento<input name="firstDueDate" type="date" min="1900-01-01" max="9999-12-31" required value={fields.firstDueDate} onChange={change} /></label>
        <label>Frequência<select aria-label="Frequência" name="frequency" value={fields.frequency} onChange={change} required><option value="">Selecione</option>{Object.entries(FREQUENCIES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      </div>
      <div className="contract-form-actions"><button className="btn-primary" type="submit">Ver prévia</button></div>
    </form>}
    {error ? <p className="contract-error" role="alert">{error}</p> : null}
    <button className="contract-secondary" style={{ marginTop: '1rem' }} disabled={saving} onClick={onCancel}>Cancelar planejamento</button>
  </section>;
}
