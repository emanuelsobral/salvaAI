import { useOperationKey } from '../../hooks/useOperationKey';
import { localDate } from '../../utils/finance';
import { useState } from 'react';
import { createTransaction } from '../../services/transactionService';

export default function TransactionModal({ uid, isOpen, onClose, onRefresh }) {
  const operation = useOperationKey();
  const [formData, setFormData] = useState({
    transaction_type: 'EXPENSE',
    amount: '',
    date: localDate(),
    source_account: 'GENERAL',
    category: 'OUTROS',
    description: ''
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
      await createTransaction(uid, {
        ...formData,
        operation_id: operation.keyFor(formData),
        amount: parseFloat(formData.amount)
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

  return (
    <div className="modal-overlay active">
      <div className="modal-content" style={{ position: 'relative' }}>
        <button className="btn-close" style={{ position: 'absolute', right: '1.5rem', top: '1.5rem' }} onClick={onClose}>&times;</button>
        <h2>Nova Movimentação Dinheiro</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group toggle-group">
            <label className={`toggle-btn expense ${formData.transaction_type === 'EXPENSE' ? 'active' : ''}`}>
              <input type="radio" name="transaction_type" value="EXPENSE" checked={formData.transaction_type === 'EXPENSE'} onChange={handleChange} />
              Saída 💸
            </label>
            <label className={`toggle-btn income ${formData.transaction_type === 'INCOME' ? 'active' : ''}`}>
              <input type="radio" name="transaction_type" value="INCOME" checked={formData.transaction_type === 'INCOME'} onChange={handleChange} />
              Entrada 💰
            </label>
          </div>

          <div className="form-group">
            <label>Valor (R$)</label>
            <input type="number" min="0.01" step="0.01" name="amount" required value={formData.amount} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Data</label>
            <input type="date" name="date" required value={formData.date} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Origem / Destino</label>
            <select name="source_account" value={formData.source_account} onChange={handleChange}>
              <option value="GENERAL">Conta Corrente / Livre</option>
              <option value="VR">Vale Refeição (VR)</option>
              <option value="VA">Vale Alimentação (VA)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              {formData.transaction_type === 'EXPENSE' ? (
                <>
                  <option value="MORADIA">Moradia</option>
                  <option value="ALIMENTACAO">Alimentação</option>
                  <option value="TRANSPORTE">Transporte</option>
                  <option value="SAUDE">Saúde</option>
                  <option value="LAZER">Lazer</option>
                  <option value="OUTROS">Outros Gastos</option>
                </>
              ) : (
                <>
                  <option value="SALARIO">Salário</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="RENDIMENTO">Rendimento / Juros</option>
                  <option value="OUTROS">Outras Entradas</option>
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <input type="text" name="description" required placeholder="Ex: Mercado, Uber..." value={formData.description} onChange={handleChange} />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Processando...' : 'Processar Movimentação'}
          </button>
        </form>
      </div>
    </div>
  );
}
