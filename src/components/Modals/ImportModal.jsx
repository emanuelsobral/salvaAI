import { useState } from 'react';
import { importCSV } from '../../services/importService';
import { parseCSV } from '../../utils/csv';
import { formatBRL } from '../../utils/formatters';

export default function ImportModal({ uid, isOpen, onClose, onRefresh }) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const preview = csvText.trim() ? parseCSV(csvText) : null;

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (loading || !preview || preview.errors.length) return;
    
    setLoading(true);
    try {
      const res = await importCSV(uid, csvText);
      alert(res.message);
      onRefresh();
      onClose();
    } catch (error) {
      alert(`Erro na importação: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content" style={{ maxWidth: '600px', position: 'relative' }}>
        <button className="btn-close" style={{ position: 'absolute', right: '1.5rem', top: '1.5rem' }} onClick={onClose}>×</button>
        <h2>📥 Smart Paste (Massa)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Cole os dados da sua planilha Excel ou extrato bancário. 
          Revise os dados antes de importar. As categorias são sugeridas por palavras-chave. Registros idênticos já importados serão ignorados.
        </p>

        <div className="form-group">
          <label>Formato Esperado: Data, Descrição, Valor</label>
          <textarea 
            rows="8" 
            placeholder="Exemplo:&#10;25/12/2026, Mercado Livre, -150.00&#10;26/12/2026, Salário, 5000.00"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid var(--border-color)', 
              color: 'var(--text-main)', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        </div>

        {preview && (
          <div aria-live="polite" style={{ maxHeight: 220, overflow: 'auto' }}>
            {preview.errors.length > 0 ? (
              <div role="alert" style={{ color: 'var(--accent-red)' }}>{preview.errors.map((error, index) => <p key={index}>{error}</p>)}</div>
            ) : (
              <>
                <p>{preview.rows.length} transações · impacto previsto: {formatBRL(preview.total)} (antes de ignorar duplicatas)</p>
                <table style={{ width: '100%' }}>
                  <thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead>
                  <tbody>{preview.rows.slice(0, 10).map((row, index) => <tr key={index}><td>{row.date.split('-').reverse().join('/')}</td><td>{row.description}</td><td>{formatBRL(row.type === 'EXPENSE' ? -row.amount : row.amount)}</td></tr>)}</tbody>
                </table>
                {preview.rows.length > 10 && <p>Mostrando as 10 primeiras linhas.</p>}
              </>
            )}
          </div>
        )}
        <button 
          className="btn-outline" 
          style={{ width: '100%', borderColor: '#00f5d4', color: '#00f5d4', marginTop: '1rem' }} 
          onClick={handleSubmit}
          disabled={loading || !preview || preview.errors.length > 0}
        >
          {loading ? 'Importando...' : 'Confirmar importação'}
        </button>
      </div>
    </div>
  );
}
