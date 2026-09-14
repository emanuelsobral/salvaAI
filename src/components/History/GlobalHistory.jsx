import { useState, useEffect, useCallback } from 'react';
import { getAllTransactions, deleteTransaction } from '../../services/transactionService';
import { formatBRL } from '../../utils/formatters';

export default function GlobalHistory({ uid }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

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
    if (deleting || !window.confirm('Confirma o estorno? Transferências serão revertidas nas duas contas. Pagamentos de fatura terão seus itens reabertos.')) return;
    setDeleting(txnId);

    try {
      const res = await deleteTransaction(uid, txnId);
      alert(res.message);
      loadData();
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setDeleting(null);
    }
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
              <th style={{ padding: '1rem', textAlign: 'center' }}>Origem / Fundo</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Impacto (R$)</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Excluir</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Nenhuma transação encontrada no seu histórico.
                </td>
              </tr>
            ) : (
              transactions.map(t => {
                const isIncome = t.type === 'INCOME';
                const amountColor = isIncome ? 'var(--accent-green)' : 'var(--text-main)';
                const prefix = isIncome ? '+' : '-';

                return (
                  <tr className="transaction-row" key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="transaction-date" style={{ padding: '1rem', paddingLeft: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.date}</td>
                    <td className="transaction-description" style={{ padding: '1rem', fontWeight: 500 }}>{t.description}</td>
                    <td className="transaction-account" style={{ padding: '1rem', textAlign: 'center' }}>{getAccountBadge(t.account_type)}</td>
                    <td className="transaction-amount" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: amountColor }}>
                      {prefix} {formatBRL(t.amount)}
                    </td>
                    <td className="transaction-delete" style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        className="btn-outline-sm"
                        style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)', padding: '0.3rem 0.6rem' }}
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting !== null}
                      >
                        Apagar
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
