import { formatBRL } from '../../utils/formatters';

export default function YearProjectionDrawer({ isOpen, onClose, projection }) {
  if (!isOpen) return null;

  return (
    <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className={`drawer-content ${isOpen ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="btn-close" onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>&times;</button>
        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Projeção 12 Meses 🔮</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Simulação com o saldo atual e compromissos cadastrados. Inclui assinaturas e parcelas pendentes; não pressupõe novos salários ou compras. Parcelas atrasadas já são descontadas do saldo inicial.
        </p>

        <div className="timeline-list" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', paddingRight: '10px' }}>
          {!projection || projection.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Sem dados de projeção.</div>
          ) : (
            projection.map((item, idx) => {
              const colorClass = item.c; // 'green', 'orange', 'red'
              
              return (
                <div key={idx} className={`timeline-item ${colorClass}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="timeline-month" style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                      Mês: <span style={{ color: `var(--accent-${colorClass})` }}>{item.label}</span>
                    </div>
                    <div className="timeline-value" style={{ fontSize: '1.2rem' }}>
                      {formatBRL(item.v)}
                    </div>
                  </div>
                  
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Faturas + Assinaturas:</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>
                      {item.fatura_prevista > 0 ? '-' : ''} {formatBRL(item.fatura_prevista)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
