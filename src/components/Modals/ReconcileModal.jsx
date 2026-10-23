import { useEffect, useState } from 'react';
import { getReconciliationCandidates, reconcileTransaction } from '../../services/reconciliationService';
import { formatBRL } from '../../utils/formatters';

export default function ReconcileModal({ uid, occurrence, onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getReconciliationCandidates(uid, occurrence).then(data => { if (active) setItems(data); })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid, occurrence, attempt]);
  const save = async event => {
    event.preventDefault();
    if (!selected || saving) return;
    setSaving(true); setError('');
    try {
      const result = await reconcileTransaction(uid, selected, occurrence.subscriptionId, occurrence.dueDate);
      onSaved(result.message);
    } catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  };
  return <div className="modal-overlay active"><div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="reconcile-title">
    <h2 id="reconcile-title">Vincular extrato</h2>
    <p>{occurrence.name} · {formatBRL(occurrence.amount)} · vence em {occurrence.dueDate.split('-').reverse().join('/')}</p>
    <p>Escolha o pagamento já importado na conta corrente. A confirmação quita este vencimento sem alterar o saldo.</p>
    {loading ? <p role="status">Buscando lançamentos...</p> : !items.length && <p>Nenhum lançamento disponível com o mesmo valor e data até 7 dias do vencimento.</p>}
    <form onSubmit={save}>
      {!!items.length && <div className="form-group"><label htmlFor="reconcile-transaction">Lançamento do extrato</label><select id="reconcile-transaction" required value={selected} disabled={saving} onChange={event => setSelected(event.target.value)}>
        <option value="">Selecione e confira a descrição</option>
        {items.map(item => <option value={item.id} key={item.id}>{item.transactionDate.split('-').reverse().join('/')} · {item.description} · {formatBRL(item.amount)}</option>)}
      </select>{selected && <p style={{ marginTop: '0.5rem', overflowWrap: 'anywhere' }}>{items.find(item => item.id === selected)?.description} — este lançamento será vinculado sem outro desconto no saldo.</p>}</div>}
      {error && <p role="alert">{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
        <button type="button" className="btn-outline" disabled={saving} onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-outline" disabled={loading || saving} onClick={() => { setLoading(true); setError(''); setSelected(''); setAttempt(value => value + 1); }}>Atualizar lista</button>
        <button className="btn-primary" type="submit" disabled={!selected || loading || saving}>{saving ? 'Vinculando...' : 'Confirmar vínculo'}</button>
      </div>
    </form>
  </div></div>;
}
