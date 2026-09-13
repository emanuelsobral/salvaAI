import { formatBRL } from '../../utils/formatters';

export default function Lighthouse({ lighthouse }) {
  if (!lighthouse) return null;

  const { status, value, total_income, total_expenses, message } = lighthouse;

  // Calcula % para as barras (máx 100%)
  const maxVal = Math.max(total_income, total_expenses, 1); // Evita / 0
  const incomePct = Math.min(100, (total_income / maxVal) * 100);
  const expensePct = Math.min(100, (total_expenses / maxVal) * 100);

  // Status mappings
  const colorMap = {
    GREEN: { css: 'green', emoji: '🟢', title: 'Excelente' },
    ORANGE: { css: 'orange', emoji: '🟠', title: 'Atenção' },
    RED: { css: 'red', emoji: '🔴', title: 'Perigo' }
  };
  
  const currentStatus = colorMap[status] || colorMap.GREEN;

  // Usamos um hack rápido para injetar markdown `**negrito**` no React.
  const formatMessage = (msg) => {
    return msg.split('**').map((chunk, i) => (
      i % 2 === 1 ? <strong key={i}>{chunk}</strong> : chunk
    ));
  };

  return (
    <div className={`card lighthouse-card span-2 ${currentStatus.css}`} style={status === 'ORANGE' ? { border: '1px solid var(--accent-orange)' } : status === 'RED' ? { border: '1px solid var(--accent-red)' } : {}}>
      <div className="lighthouse-header">
        <div className="header-title">
          <h3>Farol de Saúde Financeira {currentStatus.emoji}</h3>
        </div>
        <div style={{
          backgroundColor: `rgba(var(--accent-${currentStatus.css}-rgb, ${currentStatus.css === 'orange' ? '255, 159, 67' : currentStatus.css === 'red' ? '239, 35, 60' : '46, 204, 113'}), 0.15)`,
          color: `var(--accent-${currentStatus.css})`,
          padding: '0.4rem 1rem',
          borderRadius: '25px',
          fontSize: '0.85rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          border: `1px solid rgba(var(--accent-${currentStatus.css}-rgb, ${currentStatus.css === 'orange' ? '255, 159, 67' : currentStatus.css === 'red' ? '239, 35, 60' : '46, 204, 113'}), 0.3)`
        }}>
          {currentStatus.title}
        </div>
      </div>
      <div className="lighthouse-content">
        <div className="lighthouse-status">
          <h2 style={{ color: `var(--accent-${currentStatus.css})` }}>
            {formatBRL(value)}
          </h2>
          <p>{formatMessage(message)}</p>
        </div>
        <div className="lighthouse-chart-mock">
          <div className="bar-container">
            <span className="label">Receitas recebidas no mês</span>
            <div className="bar-bg">
              <div className="bar-fill income" style={{ width: `${incomePct}%` }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-muted)' }}>
              {formatBRL(total_income)}
            </div>
          </div>
          <div className="bar-container">
            <span className="label">Gastos do mês (inclui compras parceladas)</span>
            <div className="bar-bg">
              <div className="bar-fill expense" style={{ width: `${expensePct}%` }}></div>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-muted)' }}>
              {formatBRL(total_expenses)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
