import { useOperationKey } from '../../hooks/useOperationKey';
import { useState } from 'react';
import { createGoal, depositToGoal } from '../../services/goalService';

export default function GoalModal({ uid, goals, isOpen, onClose, onRefresh }) {
  const operation = useOperationKey();
  const [activeTab, setActiveTab] = useState('DEPOSIT'); // 'DEPOSIT' | 'CREATE'
  
  // Create state
  const [createData, setCreateData] = useState({ name: '', target_value: '' });
  
  // Deposit state
  const [depositData, setDepositData] = useState({ goal_id: '', amount: '' });
  
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await createGoal(uid, {
        operation_id: operation.keyFor(createData),
        name: createData.name,
        target_value: parseFloat(createData.target_value)
      });
      operation.complete();
      onRefresh();
      onClose();
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await depositToGoal(uid, depositData.goal_id, parseFloat(depositData.amount), operation.keyFor(depositData));
      if (res.status === 'error') {
        alert(res.message);
      } else {
        operation.complete();
      onRefresh();
        onClose();
      }
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content" style={{ position: 'relative' }}>
        <button className="btn-close" style={{ position: 'absolute', right: '1.5rem', top: '1.5rem' }} onClick={onClose}>×</button>
        <h2>Cofres & Caixinhas 🗃️</h2>
        
        <div className="form-group toggle-group" style={{ marginBottom: '1.5rem' }}>
          <label className={`toggle-btn ${activeTab === 'DEPOSIT' ? 'active' : ''}`}>
            <input type="radio" checked={activeTab === 'DEPOSIT'} onChange={() => setActiveTab('DEPOSIT')} />
            Fazer Aporte
          </label>
          <label className={`toggle-btn ${activeTab === 'CREATE' ? 'active' : ''}`}>
            <input type="radio" checked={activeTab === 'CREATE'} onChange={() => setActiveTab('CREATE')} />
            Criar Caixinha
          </label>
        </div>

        {activeTab === 'DEPOSIT' && (
          <form onSubmit={handleDepositSubmit}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              O dinheiro será transferido da sua Conta Corrente Livre.
            </p>
            <div className="form-group">
              <label>Selecione a Caixinha</label>
              <select required value={depositData.goal_id} onChange={(e) => setDepositData({...depositData, goal_id: e.target.value})}>
                <option value="">Selecione...</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.name} (Atual: R$ {g.balance})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Valor do Aporte (R$)</label>
              <input type="number" min="0.01" step="0.01" required value={depositData.amount} onChange={(e) => setDepositData({...depositData, amount: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || !depositData.goal_id}>
              {loading ? 'Transferindo...' : 'Transferir Dinheiro'}
            </button>
          </form>
        )}

        {activeTab === 'CREATE' && (
          <form onSubmit={handleCreateSubmit}>
            <div className="form-group">
              <label>Nome da Caixinha</label>
              <input type="text" required placeholder="Ex: Viagem Europa" value={createData.name} onChange={(e) => setCreateData({...createData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Meta de Dinheiro (R$)</label>
              <input type="number" min="0.01" step="0.01" required value={createData.target_value} onChange={(e) => setCreateData({...createData, target_value: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Nova Caixinha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
