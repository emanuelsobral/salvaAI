import { useState, useEffect, useCallback } from 'react';
import { getActiveSubscriptions, deleteSubscription } from '../../services/subscriptionService';
import { formatBRL } from '../../utils/formatters';

export default function SubsList({ uid }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getActiveSubscriptions(uid);
      setSubs(res.subs || []);
    } catch (error) {
      console.error(error);
      setError('Não foi possível carregar as assinaturas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (uid) loadData();
  }, [uid, loadData]);

  const handleDelete = async (subId) => {
    if (!window.confirm('Tem certeza que deseja cancelar (deletar) esta assinatura?')) return;
    try {
      const res = await deleteSubscription(uid, subId);
      alert(res.message);
      loadData();
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando assinaturas...</div>;
  }

  if (error) return <div className="card" role="alert"><p>{error}</p><button className="btn-primary" onClick={loadData}>Tentar novamente</button></div>;
  if (subs.length === 0) {
    return (
      <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
        Você ainda não cadastrou nenhuma assinatura recorrente.
      </div>
    );
  }

  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginTop: '2rem' }}>
      {subs.map(sub => (
        <div key={sub.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{sub.name}</h3>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Dia do vencimento: {sub.due_day}
            </div>
            <h2 style={{ color: 'var(--accent-primary)', fontSize: '1.8rem', margin: '1rem 0' }}>
              {formatBRL(sub.amount)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mês</span>
            </h2>
          </div>
          <button 
            className="btn-outline" 
            style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)', width: '100%' }}
            onClick={() => handleDelete(sub.id)}
          >
            Cortar Gasto Recorrente
          </button>
        </div>
      ))}
    </div>
  );
}
