import { useOperationKey } from '../../hooks/useOperationKey';
import { useState } from 'react';
import { createSubscription } from '../../services/subscriptionService';
import { localDate } from '../../utils/finance';

const emptyForm = () => ({ name: '', amount: '', frequency: 'MONTHLY', start_date: localDate(), end_date: '', category: 'ASSINATURAS' });

export default function SubModal({ uid, isOpen, onClose, onRefresh }) {
  const operation = useOperationKey();
  const [formData, setFormData] = useState(emptyForm);
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
        amount: parseFloat(formData.amount)
      });
      setFormData(emptyForm());
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
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="recurring-title" style={{ position: 'relative' }}>
        <button className="btn-close" aria-label="Fechar" disabled={loading} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem' }} onClick={onClose}>×</button>
        <h2 id="recurring-title">Nova conta recorrente</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recurring-name">Nome da conta</label>
            <input id="recurring-name" type="text" name="name" maxLength="500" required placeholder="Ex: Aluguel, Internet..." value={formData.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="recurring-amount">Valor por vencimento (R$)</label>
            <input id="recurring-amount" type="number" min="0.01" max="1000000000" step="0.01" name="amount" required value={formData.amount} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="recurring-frequency">Frequência</label>
            <select id="recurring-frequency" name="frequency" value={formData.frequency} onChange={handleChange}>
              <option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensal</option><option value="YEARLY">Anual</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="recurring-start">Primeiro vencimento</label>
            <input id="recurring-start" type="date" name="start_date" min="1900-01-01" max="9999-12-31" required value={formData.start_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="recurring-end">Término (opcional)</label>
            <input id="recurring-end" type="date" name="end_date" min={formData.start_date} max="9999-12-31" value={formData.end_date} onChange={handleChange} />
            <small style={{ color: 'var(--text-muted)' }}>Inclui vencimentos até esta data. Em meses mais curtos, usa o último dia do mês.</small>
          </div>

          <div className="form-group">
            <label htmlFor="recurring-category">Categoria</label>
            <select id="recurring-category" name="category" value={formData.category} onChange={handleChange}>
              <option value="ASSINATURAS">Assinaturas e Nuvem</option>
              <option value="MORADIA">Moradia (Aluguel/Condomínio)</option>
              <option value="SAUDE">Saúde (Plano/Academia)</option>
              <option value="EDUCAÇÃO">Educação (Faculdade/Cursos)</option>
            </select>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>O saldo da conta corrente só será descontado quando você registrar o pagamento. O aplicativo não paga boletos nem faz débitos bancários.</p>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
