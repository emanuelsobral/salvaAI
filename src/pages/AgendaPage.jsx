import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOperationKey } from '../hooks/useOperationKey';
import { getSubscriptions, payRecurringBill } from '../services/subscriptionService';
import { localDate, validDate } from '../utils/finance';
import { formatBRL } from '../utils/formatters';
import { AGENDA_STATUS, agendaSelection, buildAgenda, moveAgendaPeriod } from '../utils/agenda';
import ReconcileModal from '../components/Modals/ReconcileModal';
import './AgendaPage.css';

const dateBR = value => value.split('-').reverse().join('/');
const labels = { OVERDUE: 'Atrasada', TODAY: 'Vence hoje', UPCOMING: 'Próxima', PAID: 'Paga' };

function PaymentDialog({ uid, item, today, onClose, onSaved }) {
  const dialog = useRef(null), busy = useRef(false);
  const [paidDate, setPaidDate] = useState(today);
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const operation = useOperationKey();
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const save = async event => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const payload = { subId: item.subscriptionId, dueDate: item.dueDate, paidDate, amount: item.amount };
      const result = await payRecurringBill(uid, item.subscriptionId, item.dueDate, paidDate, operation.keyFor(payload), item.amount);
      operation.complete(); onSaved(result.message);
    } catch (failure) { setError(failure.message); }
    finally { busy.current = false; setSaving(false); }
  };
  return <dialog ref={dialog} className="agenda-payment" aria-labelledby="agenda-payment-title" onCancel={event => { event.preventDefault(); if (!busy.current) onClose(); }}>
    <h2 id="agenda-payment-title">Registrar pagamento</h2>
    <p>{item.name} · {formatBRL(item.amount)}</p>
    <p>Vencimento: {dateBR(item.dueDate)}</p>
    <p>Confirme apenas se já pagou. O registro desconta o valor da conta corrente no aplicativo.</p>
    <p>Se o pagamento já veio de um extrato, cancele e use Vincular extrato para evitar outro desconto.</p>
    <form onSubmit={save}>
      <div className="form-group"><label htmlFor="agenda-paid-date">Data do pagamento</label><input id="agenda-paid-date" type="date" min="1900-01-01" max={today} required value={paidDate} disabled={saving} onChange={event => setPaidDate(event.target.value)} /></div>
      {error && <p role="alert">{error} Feche esta janela e atualize a agenda se os dados mudaram.</p>}
      <div className="agenda-actions"><button type="button" className="btn-outline" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Registrando...' : 'Confirmar pagamento'}</button></div>
    </form>
  </dialog>;
}

export function AgendaWorkspace({ uid }) {
  const [params, setParams] = useSearchParams();
  const [today, setToday] = useState(localDate);
  const { date, view } = agendaSelection(params, today);
  const [filter, setFilter] = useState('ALL');
  const [data, setData] = useState({ uid: null, subs: [], loading: true, error: '' });
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const load = () => {
    setData({ uid, subs: [], loading: true, error: '' });
    setAttempt(value => value + 1);
  };
  useEffect(() => {
    if (!uid) return;
    let active = true;
    const timeout = setTimeout(() => {
      if (!active) return;
      active = false;
      setData({ uid, subs: [], loading: false, error: 'Não foi possível carregar a agenda a tempo. Confira a conexão e tente novamente.' });
    }, 15000);
    getSubscriptions(uid, { requireFresh: true }).then(result => {
      clearTimeout(timeout);
      if (active) setData({ uid, subs: result.subs, loading: false, error: '' });
    }).catch(() => {
      clearTimeout(timeout);
      if (active) setData({ uid, subs: [], loading: false, error: 'Não foi possível carregar a agenda. Confira a conexão e tente novamente.' });
    });
    return () => { active = false; clearTimeout(timeout); };
  }, [uid, attempt]);
  useEffect(() => {
    const update = () => setToday(localDate());
    const timer = setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  const result = useMemo(() => {
    if (data.uid !== uid || data.loading || data.error) return null;
    try { return { agenda: buildAgenda(data.subs, date, view, today) }; }
    catch { return { error: 'Há dados de recorrência que não puderam ser lidos. Atualize a agenda; se continuar, revise as contas recorrentes.' }; }
  }, [data, uid, date, view, today]);
  const agenda = result?.agenda;
  const error = data.error || result?.error;
  const loading = data.uid !== uid || data.loading;
  const groups = new Map();
  for (const row of agenda?.rows || []) {
    if (filter !== 'ALL' && row.agendaStatus !== filter) continue;
    if (!groups.has(row.dueDate)) groups.set(row.dueDate, []);
    groups.get(row.dueDate).push(row);
  }
  const change = (nextDate, nextView = view) => {
    try { validDate(nextDate); } catch { return; }
    setParams({ data: nextDate, visao: nextView });
  };
  const saved = text => { setSelected(null); setMessage(text); load(); };
  const previous = moveAgendaPeriod(date, view, -1), next = moveAgendaPeriod(date, view, 1);
  return <div className="agenda-page view-section active">
    <header className="topbar"><div className="greeting"><h1>Agenda de contas</h1><p>Veja o que vence e confira os pagamentos do período.</p></div><Link className="btn-outline" to="/assinaturas">Gerenciar recorrências</Link></header>
    <p className="agenda-scope">Contas recorrentes da conta corrente e parcelas de contratos. Assinaturas antigas do cartão continuam na fatura.</p>
    <section className="card agenda-controls" aria-label="Período da agenda">
      <div className="agenda-actions" role="group" aria-label="Visão da agenda">
        <button className="btn-outline" aria-pressed={view === 'semana'} onClick={() => change(date, 'semana')}>Semana</button>
        <button className="btn-outline" aria-pressed={view === 'mes'} onClick={() => change(date, 'mes')}>Mês</button>
      </div>
      <div className="form-group agenda-date"><label htmlFor="agenda-date">{view === 'mes' ? 'Mês de referência' : 'Data de referência'}</label><input id="agenda-date" type={view === 'mes' ? 'month' : 'date'} min={view === 'mes' ? '1900-01' : '1900-01-01'} max={view === 'mes' ? '9999-12' : '9999-12-31'} value={view === 'mes' ? date.slice(0, 7) : date} onChange={event => change(view === 'mes' ? event.target.value + '-01' : event.target.value)} /></div>
      <div className="agenda-actions"><button className="btn-outline" disabled={!previous} onClick={() => change(previous)}>Anterior</button><button className="btn-outline" onClick={() => { change(today); setFilter('ALL'); }}>Período atual</button><button className="btn-outline" disabled={!next} onClick={() => change(next)}>Próximo</button></div>
    </section>
    {message && <p className="agenda-message" role="status">{message}</p>}
    <div className="agenda-refresh"><p>Os filtros consideram a data de vencimento. Para datas fora do período, use Anterior ou Próximo.</p><button className="btn-outline" disabled={loading || !!selected} onClick={load}>Atualizar agenda</button></div>
    {loading ? <p role="status">Carregando agenda...</p> : error ? <div className="card" role="alert"><p>{error}</p><button className="btn-primary" onClick={load}>Tentar novamente</button></div> : agenda && <>
      <section className="agenda-summary" aria-label="Resumo do período">
        <div><h2>{dateBR(agenda.from)} a {dateBR(agenda.to)}</h2><p>{agenda.rows.length} vencimento(s) no período</p></div>
        <dl><div><dt>Pendente no período</dt><dd data-testid="agenda-pending">{formatBRL(agenda.pending)}</dd></div><div><dt>Pago nos vencimentos do período</dt><dd>{formatBRL(agenda.paid)}</dd></div></dl>
      </section>
      <div className="agenda-filters" role="group" aria-label="Situação dos vencimentos">{Object.entries(AGENDA_STATUS).map(([value, label]) => <button className="btn-outline" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} ({agenda.counts[value]})</button>)}</div>
      <p className="agenda-scope">Os totais acima incluem todas as situações do período, mesmo ao filtrar a lista.</p>
      {!groups.size && <div className="card agenda-empty"><h2>Nenhum vencimento {filter === 'ALL' ? 'neste período' : 'com este filtro'}</h2><p>{filter === 'ALL' ? 'Escolha outro período ou cadastre uma conta recorrente.' : 'Escolha Todas para ver as outras situações do período.'}</p>{filter !== 'ALL' ? <button className="btn-outline" onClick={() => setFilter('ALL')}>Limpar filtro</button> : <Link to="/assinaturas">Abrir contas recorrentes</Link>}</div>}
      {[...groups].map(([day, rows]) => <section className="agenda-day" key={day} aria-label={`Vencimentos de ${dateBR(day)}`}>
        <h2><time dateTime={day}>{dateBR(day)}</time>{day === today && <span>Hoje</span>}</h2>
        <ul>{rows.map(item => <li key={item.key} className="agenda-row" aria-label={`${item.name}, vencimento ${dateBR(item.dueDate)}`}>
          <div className="agenda-description"><h3>{item.name}</h3><span className={`agenda-status agenda-status-${item.agendaStatus.toLowerCase()}`}>{labels[item.agendaStatus]}</span>
            {item.contractId && <Link to="/contratos">Vinculado a um contrato</Link>}
            {item.payment && <p>Pago em {dateBR(item.payment.paidDate)}{item.payment.source === 'IMPORT' ? ', vinculado ao extrato.' : '.'} <Link to="/historico">Consultar no histórico</Link></p>}
          </div>
          <strong className="agenda-amount">{formatBRL(item.amount)}</strong>
          {!item.payment && <div className="agenda-actions"><button className="btn-primary" onClick={() => { setMessage(''); setSelected({ type: 'pay', item }); }}>Registrar pagamento</button><button className="btn-outline" onClick={() => { setMessage(''); setSelected({ type: 'reconcile', item }); }}>Vincular extrato</button></div>}
        </li>)}</ul>
      </section>)}
    </>}
    {selected?.type === 'pay' && <PaymentDialog uid={uid} item={selected.item} today={today} onClose={() => setSelected(null)} onSaved={saved} />}
    {selected?.type === 'reconcile' && <ReconcileModal uid={uid} occurrence={selected.item} onClose={() => setSelected(null)} onSaved={saved} />}
  </div>;
}

export default function AgendaPage() {
  const { uid } = useAuth();
  return <AgendaWorkspace key={uid} uid={uid} />;
}
