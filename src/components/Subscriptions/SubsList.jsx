import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSubscriptions, deleteSubscription, payRecurringBill } from '../../services/subscriptionService';
import { formatBRL } from '../../utils/formatters';
import { localDate, sumMoney } from '../../utils/finance';
import { FREQUENCIES, isRecurringAccount, recurringOccurrences, effectiveSchedule, recurringSchedules } from '../../utils/recurrence';
import { useOperationKey } from '../../hooks/useOperationKey';
import ReconcileModal from '../Modals/ReconcileModal';
import { undoReconciliation } from '../../services/reconciliationService';
import EditRecurringModal from '../Modals/EditRecurringModal';

const dateBR = value => value?.split('-').reverse().join('/') || 'Sem término';
const labels = { PAID: 'Pago', OVERDUE: 'Atrasado', PENDING: 'Pendente' };

export default function SubsList({ uid }) {
  const [allSubs, setSubs] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const contractFilter = searchParams.get('contrato');
  const subs = contractFilter ? allSubs.filter(sub => sub.contractId === contractFilter) : allSubs;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => {
    const initial = searchParams.get('mes');
    return /^(19[0-9]{2}|[2-9][0-9]{3})-(0[1-9]|1[0-2])$/.test(initial || '') ? initial : localDate().slice(0, 7);
  });
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reconciling, setReconciling] = useState(null);
  const [editing, setEditing] = useState(null);
  const [paidDate, setPaidDate] = useState(localDate);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const operation = useOperationKey();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSubscriptions(uid);
      setSubs(res.subs || []);
    } catch {
      setError('Não foi possível carregar as contas. Tente novamente.');
    } finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { if (uid) loadData(); }, [uid, loadData]);

  const handleDelete = async sub => {
    if (busy.current || !window.confirm(isRecurringAccount(sub)
      ? 'Encerrar esta conta? Vencimentos até hoje e pagamentos registrados serão preservados. Vencimentos futuros sem pagamento serão cancelados.'
      : 'Cancelar esta assinatura na fatura? O histórico de pagamentos será preservado.')) return;
    busy.current = true;
    setSaving(true);
    try {
      const result = await deleteSubscription(uid, sub.id);
      setMessage(result.message);
      await loadData();
    } catch (error) { setMessage(error.message); }
    finally { busy.current = false; setSaving(false); }
  };

  const handlePay = async event => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      const payload = { subId: selected.subscriptionId, dueDate: selected.dueDate, paidDate, amount: selected.amount };
      const result = await payRecurringBill(uid, payload.subId, payload.dueDate, paidDate, operation.keyFor(payload), selected.amount);
      operation.complete();
      setSelected(null);
      setMessage(result.message);
      await loadData();
    } catch (error) { setMessage(error.message); }
    finally { busy.current = false; setSaving(false); }
  };
  const unlink = async item => {
    if (busy.current || !window.confirm('Desvincular este pagamento? O lançamento do extrato e o saldo serão preservados; o vencimento voltará a ficar em aberto.')) return;
    busy.current = true; setSaving(true);
    try {
      await undoReconciliation(uid, item.payment.transactionId);
      setMessage('Vínculo desfeito. Lançamento e saldo preservados.');
      await loadData();
    } catch (failure) { setMessage(failure.message); }
    finally { busy.current = false; setSaving(false); }
  };

  const today = localDate();
  const from = onlyOverdue ? '1900-01-01' : month + '-01';
  const [year, monthNumber] = month.split('-').map(Number);
  const to = onlyOverdue ? today : localDate(new Date(year, monthNumber, 0, 12));
  const occurrences = subs.flatMap(sub => recurringOccurrences(sub, from, to, today))
    .filter(item => !onlyOverdue || item.status === 'OVERDUE')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name));
  const pending = sumMoney(occurrences.filter(item => item.status !== 'PAID').map(item => item.amount));

  return <>
    {contractFilter && <p>Exibindo apenas compromissos deste contrato. <button className="btn-outline" onClick={() => setSearchParams({})}>Ver todas as contas</button></p>}
    <p style={{ color: 'var(--text-muted)' }}>Registre os pagamentos feitos pela conta corrente. As assinaturas antigas continuam sendo pagas pela fatura do cartão.</p>
    {message && <p role="status">{message}</p>}
    <div className="card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0, flex: '1 1 180px', minWidth: 0 }}><label htmlFor="recurring-month">Vencimentos do mês</label><input id="recurring-month" type="month" min="1900-01" max="9999-12" value={month} disabled={onlyOverdue} onChange={event => { if (/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(event.target.value) && Number(event.target.value.slice(0, 4)) >= 1900) setMonth(event.target.value); }} /></div>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><input style={{ width: 'auto' }} type="checkbox" checked={onlyOverdue} onChange={event => setOnlyOverdue(event.target.checked)} />Todos os atrasados</label>
      </div>
      <h2 style={{ margin: '1rem 0' }}>A pagar: {formatBRL(pending)}</h2>
      {loading ? <p role="status">Carregando contas...</p> : error ? <div role="alert"><p>{error}</p><button className="btn-primary" onClick={loadData}>Tentar novamente</button></div> : <>
        {!occurrences.length && <p>Nenhum vencimento neste período.</p>}
        {occurrences.map(item => <div key={item.subscriptionId + item.dueDate} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ flex: '1 1 160px', minWidth: 0, overflowWrap: 'anywhere' }}>
            <strong>{item.name}</strong>
            {item.contractId && <p><a href="/contratos">Vinculado a um contrato</a></p>}
            <p>Vence em {dateBR(item.dueDate)} · {labels[item.status]}</p>
            {item.payment && <small style={{ color: 'var(--text-muted)' }}>Pago em {dateBR(item.payment.paidDate)}. Para estornar, exclua o pagamento no histórico.</small>}
          </div>
          <strong>{formatBRL(item.amount)}</strong>
          {!item.payment && <button className="btn-primary" disabled={saving} onClick={() => { setPaidDate(today); setMessage(''); setSelected(item); }}>Registrar pagamento</button>}
          {!item.payment && <button className="btn-outline" disabled={saving} onClick={() => setReconciling(item)}>Vincular extrato</button>}
          {item.payment?.source === 'IMPORT' && <button className="btn-outline" disabled={saving} onClick={() => unlink(item)}>Desvincular extrato</button>}
        </div>)}
      </>}
    </div>
    <h2 style={{ marginTop: '2rem' }}>Contas cadastradas</h2>
    {!loading && !error && !subs.length && <p>Você ainda não cadastrou contas recorrentes.</p>}
    <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', marginTop: '1rem' }}>
      {subs.map(sub => <div key={sub.id} className="card" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <h3>{sub.name}</h3>
        <p>{formatBRL(isRecurringAccount(sub) ? effectiveSchedule(sub, today).amount : sub.amount)} · {isRecurringAccount(sub) ? FREQUENCIES[effectiveSchedule(sub, today).frequency] : 'Mensal, na fatura do cartão'}</p>
        {isRecurringAccount(sub) ? <>
          <p>Primeiro vencimento da regra atual: {dateBR(effectiveSchedule(sub, today).startDate)}. Término: {dateBR(effectiveSchedule(sub, today).endDate)}.</p>
          {sub.revisions?.some(item => item.effectiveFrom > today) && <p>Há alterações futuras agendadas.</p>}
          {!!sub.revisions?.length && <details style={{ marginTop: '0.75rem' }}><summary>Histórico de condições</summary>{recurringSchedules(sub).map((item, index) => <p key={index} style={{ marginTop: '0.5rem' }}>Desde {dateBR(item.effectiveFrom)}: {formatBRL(item.amount)} · {FREQUENCIES[item.frequency]}. Primeiro vencimento: {dateBR(item.startDate)}. Término: {dateBR(item.endDate)}.</p>)}</details>}
          {sub.contractId ? <p>Plano fixo de {sub.installmentCount} parcela(s), vinculado a um contrato. Reajustes e troca do calendário ainda não estão disponíveis.</p> : sub.isActive && <button className="btn-outline" disabled={saving} style={{ marginTop: '1rem', width: '100%' }} onClick={() => setEditing(sub)}>Editar recorrência</button>}
        </> : <p>Dia do vencimento: {sub.dueDay}</p>}
        {!sub.isActive ? <p>Encerrada{sub.cancelledOn ? ' em ' + dateBR(sub.cancelledOn) : ''}</p>
          : <button className="btn-outline" disabled={saving} style={{ marginTop: '1rem', width: '100%' }} onClick={() => handleDelete(sub)}>Encerrar recorrência</button>}
      </div>)}
    </div>
    {reconciling && <ReconcileModal uid={uid} occurrence={reconciling} onClose={() => setReconciling(null)} onSaved={message => { setReconciling(null); setMessage(message); loadData(); }} />}
    {editing && <EditRecurringModal uid={uid} subscription={editing} onClose={() => setEditing(null)} onSaved={message => { setEditing(null); setMessage(message); loadData(); }} />}
    {selected && <div className="modal-overlay active"><div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <h2 id="payment-title">Registrar pagamento</h2>
      <p>{selected.name} · {formatBRL(selected.amount)}</p>
      <p>Vencimento: {dateBR(selected.dueDate)}</p>
      <p>Confirme apenas se já pagou esta conta. O valor será descontado do saldo da conta corrente no aplicativo.</p>
      <p>Se já importou esse pagamento, cancele e use “Vincular extrato” para evitar outro desconto.</p>
      <form onSubmit={handlePay}>
        <div className="form-group"><label htmlFor="payment-date">Data do pagamento</label><input id="payment-date" type="date" min="1900-01-01" max={today} required value={paidDate} onChange={event => setPaidDate(event.target.value)} /></div>
        {message && <p role="alert">{message}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button type="button" className="btn-outline" disabled={saving} onClick={() => setSelected(null)}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Registrando...' : 'Confirmar pagamento'}</button>
        </div>
      </form>
    </div></div>}
  </>;
}
