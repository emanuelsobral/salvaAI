import { useOperationKey } from '../../hooks/useOperationKey';
import { localDate } from '../../utils/finance';
import { useState } from 'react';
import { createCardTransaction } from '../../services/cardService';

export default function CardTransactionModal({ uid, isOpen, onClose, onRefresh }) {
  const operation = useOperationKey();
  const [formData, setFormData] = useState({
    amount_total: '',
    installments: 1,
    purchase_date: localDate(),
    category: 'OUTROS',
    description: '',
    current_month: true
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await createCardTransaction(uid, {
        ...formData,
        operation_id: operation.keyFor(formData),
        amount_total: parseFloat(formData.amount_total),
        installments: parseInt(formData.installments, 10)
      });
      alert(res.message);
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
      <div className="modal-content" style={{ border: '1px solid rgba(181, 23, 158, 0.3)', position: 'relative' }}>
        <button className="btn-close" style={{ position: 'absolute', right: '1.5rem', top: '1.5rem' }} onClick={onClose}>×</button>
        <h2 style={{ color: 'var(--accent-purple)' }}>Nova Compra no Cartão 💳</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Valor Total (R$)</label>
            <input type="number" min="0.01" step="0.01" name="amount_total" required value={formData.amount_total} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Número de Parcelas</label>
            <input type="number" min="1" max="24" name="installments" required value={formData.installments} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Data da Compra</label>
            <input type="date" name="purchase_date" required value={formData.purchase_date} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="LAZER">Lazer e Viagens</option>
              <option value="ELETRONICOS">Eletrônicos</option>
              <option value="VESTUARIO">Vestuário</option>
              <option value="SAUDE">Saúde / Farmácia</option>
              <option value="ALIMENTACAO">Alimentação</option>
              <option value="OUTROS">Outros Gastos</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <input type="text" name="description" required placeholder="Ex: Notebook novo, Jantar..." value={formData.description} onChange={handleChange} />
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" name="current_month" id="chkCurrentMonth" checked={formData.current_month} onChange={handleChange} />
            <label htmlFor="chkCurrentMonth" style={{ margin: 0 }}>Lançar primeira parcela na fatura atual?</label>
          </div>

          <button type="submit" className="btn-purple" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Lançando...' : 'Lançar no Fluxo Futuro'}
          </button>
        </form>
      </div>
    </div>
  );
}
