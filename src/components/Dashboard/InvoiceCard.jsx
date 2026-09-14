import { formatBRL } from '../../utils/formatters';

export default function InvoiceCard({ total, month, year, onPay, onViewDetails, paying = false, requiresReconciliation = false }) {
  return (
    <div className="card" style={{ marginTop: '1.8rem', background: 'linear-gradient(135deg, rgba(181, 23, 158, 0.05), rgba(114, 9, 183, 0.05))', border: '1px solid rgba(181, 23, 158, 0.2)' }}>
      <div className="invoice-layout" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
            Fatura Corrente (Cartão + Assinaturas)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Vencimento do mês atual: {String(month).padStart(2, '0')}/{year}
          </p>
        </div>
        
        <div className="invoice-summary" style={{ textAlign: 'right' }}>
          <h2 style={{ color: 'var(--accent-purple)', fontSize: '2.2rem', marginBottom: '0.5rem' }}>
            {formatBRL(total)}
          </h2>
          <div className="invoice-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button 
              className="btn-outline-sm" 
              onClick={onViewDetails}
              style={{ color: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}
            >
              Ver projeção
            </button>
            <button 
              className="btn-purple" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={onPay}
              disabled={total <= 0 || paying || requiresReconciliation}
            >
              {paying ? 'Pagando...' : requiresReconciliation ? 'Conciliação necessária' : 'Pagar Fatura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
