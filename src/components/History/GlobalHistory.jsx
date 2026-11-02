import { useState, useEffect, useCallback } from 'react';
import ModalFrame from '../UI/ModalFrame';
import { useModal } from '../../hooks/useModal';
import { completeScheduled, cancelRecurrence } from '../../services/scheduleService';
import { summarizeHistory, searchText } from '../../utils/history';
import { getAllTransactions, deleteTransaction, editTransaction } from '../../services/transactionService';
import { PAYMENT_METHODS } from '../../utils/transactionDetails';
import { formatBRL } from '../../utils/formatters';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CARD_CATEGORIES, getHistoryCategories } from '../../utils/categories';

const categoryLabels = Object.fromEntries([...CARD_CATEGORIES, ...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(item => [item.value, item.label]));
categoryLabels.OUTROS = 'Outros';

export default function GlobalHistory({ uid }) {
  const { showConfirm } = useModal();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timeout);
  }, [notice]);
  const invalidPeriod = !!(startDate && endDate && startDate > endDate);
  const categories = [...new Set(transactions.filter(item => !type || item.type === type).map(item => item.category || 'OUTROS'))].sort((a, b) => (categoryLabels[a] || a).localeCompare(categoryLabels[b] || b, 'pt-BR'));
  const editCategories = editing ? getHistoryCategories(editing.type) : [];
  const validEditCategory = editCategories.some(item => item.value === editing?.category);
  const filtered = invalidPeriod ? [] : transactions.filter(item =>
    (!type || item.type === type) &&
    (!startDate || item.dt >= startDate) &&
    (!endDate || item.dt <= endDate) &&
    (!category || (item.category || 'OUTROS') === category) &&
    (!statusFilter || item.status === statusFilter) &&
    (!search || searchText(item.title || item.description || '').includes(searchText(search)))
  );
  const totals = summarizeHistory(filtered);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllTransactions(uid);
      setTransactions(res.transactions || []);
    } catch (error) {
      console.error(error);
      setError('Não foi possível carregar o histórico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (uid) loadData();
  }, [uid, loadData]);

  const handleDelete = async (txnId) => {
    if (deleting) return;
    setDeleting(txnId);
    setDeleteError('');

    try {
      const res = await deleteTransaction(uid, txnId);
      setDeleteTarget(null);
      setNotice(res.message);
      loadData();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleting(null);
    }
  };

  const saveEdit = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setEditError('');
    try {
      await editTransaction(uid, editing.id, { ...editing, amount: Number(editing.amount) });
      setEditing(null); setNotice('Movimentação atualizada com sucesso.');
      await loadData();
    } catch (error) { setEditError(error.message); }
    finally { setSaving(false); }
  };

  const scheduleAction = async (row, cancel = false) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const confirmed = await showConfirm(cancel ? 'Cancelar as ocorrências futuras ainda pendentes desta série? As já concluídas serão preservadas.' : 'Confirmar esta movimentação agora? O saldo da conta será atualizado uma única vez.', { title: cancel ? 'Parar recorrência' : 'Confirmar movimentação' });
      if (!confirmed) return;
      if (cancel) await cancelRecurrence(uid, row.recurrenceId); else await completeScheduled(uid, row.id);
      setNotice(cancel ? 'Recorrência interrompida. Histórico preservado.' : 'Movimentação confirmada e saldo atualizado.');
      await loadData();
    } catch (error) { setError(error.message); }
    finally { setActionBusy(false); }
  };

  const getAccountBadge = (type) => {
    switch (type) {
      case 'VR': return <span style={{ background: 'rgba(131,56,236,0.1)', color: 'var(--accent-purple)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>VR Refeição</span>;
      case 'VA': return <span style={{ background: 'rgba(252,163,17,0.1)', color: 'var(--accent-orange)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>VA Food</span>;
      case 'CAIXINHA': return <span style={{ background: 'rgba(56,176,0,0.1)', color: 'var(--accent-green)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Cofre 🗃️</span>;
      case 'CARTAO': return <span style={{ background: 'linear-gradient(135deg, rgba(181, 23, 158, 0.1), rgba(114, 9, 183, 0.1))', color: '#b5179e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>💳 Fatura</span>;
      default: return <span style={{ background: 'rgba(52,152,219,0.1)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Conta Livre</span>;
    }
  };

  return (
    <div className="card recent-transactions-card" style={{ marginTop: '2rem', overflow: 'auto' }}>
      {notice && <div className="history-result-notice" role="status"><span aria-hidden="true">✓</span><p>{notice}</p><button type="button" className="btn-close" aria-label="Fechar mensagem" onClick={() => setNotice('')}>×</button></div>}
      {deleteTarget && <ModalFrame className="history-edit-overlay" onClose={deleting ? undefined : () => setDeleteTarget(null)}>
        <div className="modal-content history-edit-modal history-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-transaction-title">
          <span className="history-delete-icon" aria-hidden="true">×</span>
          <h2 id="delete-transaction-title">Apagar movimentação?</h2>
          <div className="history-delete-summary"><strong>{deleteTarget.title}</strong><span>{formatBRL(deleteTarget.amount)} · {deleteTarget.date}</span></div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>O lançamento será excluído e seu efeito no saldo será estornado. Transferências entre contas serão revertidas nos dois lados. Pagamentos de fatura terão seus itens reabertos.</p>
          {deleteError && <div className="import-error" role="alert"><strong>Não foi possível apagar</strong><p>{deleteError}</p></div>}
          <div className="history-edit-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" className="btn-outline" autoFocus disabled={!!deleting} onClick={() => setDeleteTarget(null)}>Cancelar</button>
            <button type="button" className="history-confirm-delete" disabled={!!deleting} onClick={() => handleDelete(deleteTarget.id)}>{deleting ? 'Apagando…' : 'Confirmar exclusão'}</button>
          </div>
        </div>
      </ModalFrame>}
      {editing && <ModalFrame className="history-edit-overlay" onClose={saving ? undefined : () => setEditing(null)}><form className="modal-content history-edit-modal" onSubmit={saveEdit} role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title">
        <h2 id="edit-transaction-title">Editar movimentação</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>O saldo será ajustado pela diferença do valor. Em compras parceladas, a edição altera apenas esta parcela.</p>
        <div className="form-group"><label htmlFor="edit-description">Título</label><textarea id="edit-description" rows={3} autoFocus required maxLength={500} value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} disabled={saving} /></div>
        <div className="form-group"><label htmlFor="edit-amount">Valor (R$)</label><input id="edit-amount" type="number" min="0.01" max="1000000000" step="0.01" required value={editing.amount} onChange={event => setEditing({ ...editing, amount: event.target.value })} disabled={saving} /></div>
        <div className="form-group"><label htmlFor="edit-category">Categoria de {editing.type === 'INCOME' ? 'entrada' : 'saída'}</label><select id="edit-category" required value={validEditCategory ? editing.category : ''} onChange={event => setEditing({ ...editing, category: event.target.value })} disabled={saving}><option value="" disabled>Selecione uma categoria</option>{editCategories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{!validEditCategory && <small>A categoria anterior não corresponde a este tipo de movimentação. Selecione uma para corrigir.</small>}</div>
        <div className="form-group"><label htmlFor="edit-method">Meio de pagamento / transferência</label><select id="edit-method" value={editing.paymentMethod} onChange={event => setEditing({ ...editing, paymentMethod: event.target.value })} disabled={saving}>{Object.entries(PAYMENT_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="form-group"><label><input type="checkbox" checked={!!editing.rememberCategory} disabled={saving} onChange={event => setEditing({ ...editing, rememberCategory: event.target.checked })} /> Usar esta categoria nas próximas importações desta pessoa ou estabelecimento</label></div>
        {editError && <p role="alert" style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>{editError}</p>}
        <div className="history-edit-actions"><button type="button" className="btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button></div>
      </form></ModalFrame>}
      <div className="history-filters" aria-label="Filtros do histórico">
        <div className="form-group"><label htmlFor="history-type">Movimentação</label><select id="history-type" value={type} onChange={event => { setType(event.target.value); setCategory(''); }}><option value="">Todas</option><option value="INCOME">Apenas entradas</option><option value="EXPENSE">Apenas saídas</option></select></div>
        <div className="form-group"><label htmlFor="history-start">Data inicial</label><input id="history-start" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></div>
        <div className="form-group"><label htmlFor="history-end">Data final</label><input id="history-end" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></div>
        <div className="form-group"><label htmlFor="history-category">Categoria</label><select id="history-category" value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas as categorias</option>{categories.map(value => <option key={value} value={value}>{categoryLabels[value] || value.replaceAll('_', ' ')}</option>)}</select></div>
        <button className="btn-outline" onClick={() => { setType(''); setStartDate(''); setEndDate(''); setCategory(''); setSearch(''); setStatusFilter(''); }}>Limpar filtros</button>
      </div>
      <div className="history-search-row"><div className="form-group"><label htmlFor="history-search">Buscar título ou pessoa</label><input id="history-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Digite um nome ou descrição" /></div><div className="form-group"><label htmlFor="history-status">Situação</label><select id="history-status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Todas</option><option value="COMPLETED">Concluídas</option><option value="PENDING">Pendentes</option><option value="PAID">Parcelas pagas</option><option value="CANCELLED">Canceladas</option></select></div></div>
      {!loading && !error && <><div className="history-totals">{[['Entradas', totals.income], ['Saídas', totals.expenses], ['Aplicações', totals.investments], ['Diferença', totals.difference]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{formatBRL(value)}</strong></div>)}</div><p className="history-summary-help">Totais dos filtros: movimentações concluídas em conta, incluindo benefícios. Aplicações ficam separadas das saídas. Parcelas do cartão e transferências internas não são somadas novamente.</p></>}
      {invalidPeriod && <p role="alert" style={{ color: 'var(--accent-red)', marginBottom: '1rem' }}>A data final deve ser igual ou posterior à data inicial.</p>}
      {!loading && !error && <p aria-live="polite" style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '1rem' }}>{filtered.length} de {transactions.length} movimentações</p>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando histórico...</div>
      ) : error ? (
        <div role="alert"><p>{error}</p><button className="btn-primary" onClick={loadData}>Tentar novamente</button></div>
      ) : (
        <table className="responsive-transactions" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem', paddingLeft: 0 }}>Data Real</th>
              <th style={{ padding: '1rem' }}>Descrição Cadastrada</th>
              <th style={{ padding: '1rem' }}>Categoria</th>
              <th style={{ padding: '1rem' }}>Meio</th>
              <th style={{ padding: '1rem' }}>Situação</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Conta</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Impacto (R$)</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Nenhuma transação encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtered.map(t => {
                const isIncome = t.type === 'INCOME';
                const amountColor = isIncome ? 'var(--accent-green)' : 'var(--text-main)';
                const prefix = isIncome ? '+' : '-';

                return (
                  <tr className="transaction-row" key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="transaction-date" style={{ padding: '1rem', paddingLeft: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.date}</td>
                    <td className="transaction-description" style={{ padding: '1rem', fontWeight: 500 }}>{t.title}</td>
                    <td className="transaction-category" style={{ padding: '1rem' }}><span className="history-category-badge">{categoryLabels[t.category] || t.category.replaceAll('_', ' ')}</span></td>
                    <td className="transaction-method" style={{ padding: '1rem', color: 'var(--text-muted)' }}>{PAYMENT_METHODS[t.paymentMethod] || PAYMENT_METHODS.OTHER}</td>
                    <td className="transaction-status" style={{ padding: '1rem' }}><span className={`status-badge status-${t.status?.toLowerCase()}`}>{{ COMPLETED: 'Concluída', PENDING: 'Pendente', PAID: 'Paga', CANCELLED: 'Cancelada' }[t.status] || 'Concluída'}</span>{t.recurrenceId && <small>Recorrente</small>}</td>
                    <td className="transaction-account" style={{ padding: '1rem', textAlign: 'center' }}>{getAccountBadge(t.account_type)}</td>
                    <td className="transaction-amount" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: amountColor }}>
                      {prefix} {formatBRL(t.amount)}
                    </td>
                    <td className="transaction-delete" style={{ padding: '1rem', textAlign: 'center' }}>
                      {t.status === 'PENDING' && t.account_type !== 'CARTAO' && <button className="history-edit-button" disabled={actionBusy} onClick={() => scheduleAction(t)}>Confirmar</button>}
                      {t.recurrenceId && t.status === 'PENDING' && <button className="history-edit-button" disabled={actionBusy} onClick={() => scheduleAction(t, true)}>Parar série</button>}
                      <button className="history-edit-button" disabled={deleting !== null || !t.editable} title={!t.editable ? 'Estorne a operação vinculada antes de editar.' : 'Editar movimentação'} onClick={() => { setEditError(''); setNotice(''); setEditing({ ...t, description: t.title }); }}><span aria-hidden="true">✎</span> Editar</button>
                      <button
                        className="history-edit-button history-delete-button"
                        onClick={() => { setDeleteError(''); setNotice(''); setDeleteTarget(t); }}
                        disabled={deleting !== null}
                      >
                        <span aria-hidden="true">×</span> Apagar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
