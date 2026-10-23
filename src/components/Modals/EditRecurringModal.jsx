import { useState, useRef } from 'react';
import { editRecurringSubscription } from '../../services/subscriptionService';
import { earliestRevisionDate, recurringSchedules, recurringOccurrences, prepareRecurringRevision, FREQUENCIES } from '../../utils/recurrence';
import { useOperationKey } from '../../hooks/useOperationKey';
import { formatBRL } from '../../utils/formatters';

const dateBR = value => value.split('-').reverse().join('/');

export default function EditRecurringModal({ uid, subscription, onClose, onSaved }) {
  const prior = recurringSchedules(subscription).at(-1);
  const minimum = earliestRevisionDate(subscription);
  const [form, setForm] = useState(() => ({ amount: String(prior.amount), frequency: prior.frequency,
    effective_from: minimum || '', start_date: minimum || '', end_date: prior.endDate && prior.endDate >= minimum ? prior.endDate : '', keep_calendar: true }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const operation = useOperationKey();
  const payload = { ...form, amount: Number(form.amount), start_date: form.keep_calendar ? prior.startDate : form.start_date, expected_revision: subscription.revisions?.length || 0 };
  let before = [], after = [], validation = '';
  try {
    const revision = prepareRecurringRevision(subscription, payload);
    const end = new Date(Math.min(Date.parse(form.effective_from + 'T12:00:00Z') + 366 * 86400000, Date.parse('9999-12-31T12:00:00Z'))).toISOString().slice(0, 10);
    before = recurringOccurrences(subscription, form.effective_from, end).slice(0, 5);
    after = recurringOccurrences({ ...subscription, revisions: [...(subscription.revisions || []), revision] }, form.effective_from, end).slice(0, 5);
  } catch (failure) { validation = failure.message; }
  const change = event => {
    const { name, value, checked, type } = event.target;
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };
  const submit = async event => {
    event.preventDefault();
    if (busy.current || validation) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const result = await editRecurringSubscription(uid, subscription.id, { ...payload, operation_id: operation.keyFor(payload) });
      operation.complete(); onSaved(result.message);
    } catch (failure) { setError(failure.message); }
    finally { busy.current = false; setSaving(false); }
  };
  return <div className="modal-overlay active"><div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="edit-recurring-title">
    <h2 id="edit-recurring-title">Editar recorrência</h2>
    <p style={{ overflowWrap: 'anywhere', margin: '0.75rem 0' }}>{subscription.name}</p>
    <p>As novas condições substituem os vencimentos a partir da data escolhida. Cobranças anteriores e pagamentos registrados serão preservados.</p>
    {!minimum ? <p role="alert">Não há data disponível após a última alteração ou pagamento registrado.</p> : <form onSubmit={submit}>
      <div className="form-group"><label htmlFor="edit-effective">Aplicar a partir de</label><input id="edit-effective" type="date" name="effective_from" min={minimum} max="9999-12-31" required value={form.effective_from} disabled={saving} onChange={change} />
        <small style={{ color: 'var(--text-muted)' }}>Primeira data permitida: {dateBR(minimum)}. Alterações já agendadas e vencimentos pagos precisam ficar antes desta data.</small>
      </div>
      <div className="form-group"><label htmlFor="edit-amount">Novo valor por vencimento (R$)</label><input id="edit-amount" type="number" name="amount" min="0.01" max="1000000000" step="0.01" required value={form.amount} disabled={saving} onChange={change} /></div>
      <label style={{ display: 'flex', gap: '0.5rem' }}><input style={{ width: 'auto' }} type="checkbox" name="keep_calendar" checked={form.keep_calendar} disabled={saving} onChange={change} />Manter o calendário anterior</label>
      {form.keep_calendar ? <p style={{ marginBottom: '1rem' }}>{FREQUENCIES[prior.frequency]}, seguindo o calendário iniciado em {dateBR(prior.startDate)}. Os dias 29–31 continuam se ajustando aos meses mais curtos.</p> : <>
        <div className="form-group"><label htmlFor="edit-frequency">Nova frequência</label><select id="edit-frequency" name="frequency" value={form.frequency} disabled={saving} onChange={change}>{Object.entries(FREQUENCIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="form-group"><label htmlFor="edit-first">Primeiro vencimento do novo calendário</label><input id="edit-first" type="date" name="start_date" min={form.effective_from} max="9999-12-31" required value={form.start_date} disabled={saving} onChange={change} /></div>
      </>}
      <div className="form-group"><label htmlFor="edit-end">Novo término (opcional)</label><input id="edit-end" type="date" name="end_date" min={form.keep_calendar ? form.effective_from : form.start_date} max="9999-12-31" value={form.end_date} disabled={saving} onChange={change} /></div>
      {validation ? <p role="alert">{validation}</p> : <div aria-live="polite" style={{ marginBottom: '1rem' }}>
        <h3>Confira os próximos vencimentos</h3>
        <p>Até cinco vencimentos nos próximos 12 meses, a partir da alteração.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
          {[['Antes', before], ['Depois', after]].map(([label, rows]) => <div key={label}><strong>{label}</strong>{!rows.length && <p>Sem vencimentos neste intervalo.</p>}{rows.map(item => <p key={item.dueDate}>{dateBR(item.dueDate)} · {formatBRL(item.amount)}</p>)}</div>)}
        </div>
      </div>}
      {error && <p role="alert">{error}</p>}
      <button className="btn-primary" style={{ width: '100%' }} type="submit" disabled={saving || !!validation}>{saving ? 'Salvando...' : 'Confirmar alteração'}</button>
    </form>}
    <button type="button" className="btn-outline" style={{ width: '100%', marginTop: '0.75rem' }} disabled={saving} onClick={onClose}>Cancelar</button>
  </div></div>;
}
