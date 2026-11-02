import ModalFrame from '../UI/ModalFrame';
import { useModal } from '../../hooks/useModal';
import { useOperationKey } from '../../hooks/useOperationKey';
import { localDate } from '../../utils/finance';
import { useState, useRef } from 'react';
import { createTransaction } from '../../services/transactionService';
import { extractReceiptData } from '../../services/aiService';
import { getHistoryCategories } from '../../utils/categories';

export default function TransactionModal({ uid, isOpen, onClose, onRefresh }) {
  const { showAlert } = useModal();
  const operation = useOperationKey();
  const [formData, setFormData] = useState({
    transaction_type: 'EXPENSE',
    amount: '',
    date: localDate(),
    source_account: 'GENERAL',
    category: 'OUTROS_SAIDA',
    scheduled: false,
    recurrence_count: 1,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value, ...(name === 'transaction_type' ? { category: value === 'INCOME' ? 'OUTROS_ENTRADA' : 'OUTROS_SAIDA' } : {}) }));
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
      showAlert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScanReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) {
      showAlert('Use uma imagem JPG, PNG ou WebP de até 3 MB.');
      e.target.value = '';
      return;
    }


    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onerror = () => { setScanning(false); showAlert('Não foi possível ler a imagem.'); };
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        try {
          const aiData = await extractReceiptData(base64Data, file.type);
          
          setFormData(prev => ({
            ...prev,
            transaction_type: 'EXPENSE',
            amount: aiData.amount ?? '',
            date: aiData.date ?? '',
            description: aiData.description ?? '',
            category: aiData.category || 'OUTROS'
          }));
        } catch (err) {
          showAlert(err.message);
        } finally {
          setScanning(false);
          // reset file input
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch {
      showAlert('Erro ao ler a imagem localmente.');
      setScanning(false);
    }
  };

  return (
    <ModalFrame onClose={loading || scanning ? undefined : onClose}>
      <div className="modal-content" style={{ position: 'relative' }}>
        <button className="btn-close" aria-label="Fechar modal" style={{ position: 'absolute', right: '1.5rem', top: '1.5rem' }} onClick={onClose}>&times;</button>
        <h2>Nova Movimentação Dinheiro</h2>
        
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleScanReceipt}
          />
          <button 
            type="button" 
            className="btn-outline-sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning || loading}
            style={{ width: '100%', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {scanning ? (
              <>
                <div className="spinner" style={{ width: '15px', height: '15px', borderWidth: '2px' }}></div>
                Lendo Cupom Fiscal com IA...
              </>
            ) : (
              '📸 Escanear Cupom Fiscal com IA'
            )}
          </button>
        </div>

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
          <div className="form-group"><label><input type="checkbox" checked={formData.scheduled} onChange={event => setFormData(current => ({ ...current, scheduled: event.target.checked }))} /> Agendar sem alterar o saldo agora</label><small>Datas futuras são agendadas automaticamente. Confirme o pagamento ou recebimento no histórico.</small></div>
          <div className="form-group"><label htmlFor="recurrence-count">Repetição mensal</label><input id="recurrence-count" type="number" name="recurrence_count" min="1" max="60" required value={formData.recurrence_count} onChange={handleChange} /><small>1 para lançamento único; de 2 a 60 para criar ocorrências mensais independentes, todas pendentes.</small></div>

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
              {getHistoryCategories(formData.transaction_type).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <input type="text" name="description" required placeholder="Ex: Mercado, Uber..." value={formData.description} onChange={handleChange} />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || scanning}>
            {loading ? 'Processando...' : 'Processar Movimentação'}
          </button>
        </form>
      </div>
    </ModalFrame>
  );
}
