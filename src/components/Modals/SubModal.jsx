import { useOperationKey } from '../../hooks/useOperationKey';
import { useState } from 'react';
import { createSubscription } from '../../services/subscriptionService';

export default function SubModal({ uid, isOpen, onClose, onRefresh }) {
  const operation = useOperationKey();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    due_day: 10,
    category: 'ASSINATURAS'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await createSubscription(uid, {
        ...formData,
        operation_id: operation.keyFor(formData),
        amount: parseFloat(formData.amount),
        due_day: parseInt(formData.due_day, 10)
      });
      setFormData({ name: '', amount: '', due_day: 10, category: 'ASSINATURAS' });
      operation.complete();
      onRefresh();
      onClose();
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
        <h2>Novo Custo Recorrente 📦</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Serviço</label>
            <input type="text" name="name" required placeholder="Ex: Netflix, Academia..." value={formData.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Valor Mensal (R$)</label>
            <input type="number" min="0.01" step="0.01" name="amount" required value={formData.amount} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Dia do Vencimento</label>
            <input type="number" min="1" max="31" name="due_day" required value={formData.due_day} onChange={handleChange} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Este valor será adicionado à fatura do cartão deste dia.
            </span>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="ASSINATURAS">Assinaturas e Nuvem</option>
              <option value="MORADIA">Moradia (Aluguel/Condomínio)</option>
              <option value="SAUDE">Saúde (Plano/Academia)</option>
              <option value="EDUCAÇÃO">Educação (Faculdade/Cursos)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Assinatura'}
          </button>
        </form>
      </div>
    </div>
  );
}
