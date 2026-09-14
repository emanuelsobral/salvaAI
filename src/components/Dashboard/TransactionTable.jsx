import { formatBRL } from '../../utils/formatters';

export default function TransactionTable({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="card" style={{ marginTop: '1.8rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Últimas Movimentações Globais</h3>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
          O banco está vazio. Nenhuma transação registrada.
        </div>
      </div>
    );
  }

  const getAccountBadge = (type) => {
    switch (type) {
      case 'VR': return <span style={{ background: 'rgba(131,56,236,0.1)', color: 'var(--accent-purple)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>VR Refeição</span>;
      case 'VA': return <span style={{ background: 'rgba(252,163,17,0.1)', color: 'var(--accent-orange)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>VA Food</span>;
      case 'CAIXINHA': return <span style={{ background: 'rgba(56,176,0,0.1)', color: 'var(--accent-green)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Cofre 🗃️</span>;
      case 'CARTAO': return <span style={{ background: 'linear-gradient(135deg, rgba(181, 23, 158, 0.1), rgba(114, 9, 183, 0.1))', color: '#b5179e', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(181,23,158,0.2)' }}>💳 Fatura</span>;
      default: return <span style={{ background: 'rgba(52,152,219,0.1)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Conta Livre</span>;
    }
  };

  return (
    <div className="card" style={{ marginTop: '1.8rem', overflowX: 'auto' }}>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Últimas Movimentações Globais</h3>
      <table className="responsive-transactions" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
        <tbody>
          {transactions.map(t => {
            const isIncome = t.type === 'INCOME';
            const amountColor = isIncome ? 'var(--accent-green)' : 'var(--text-main)';
            const prefix = isIncome ? '+' : '-';

            return (
              <tr className="transaction-row" key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td className="transaction-date" style={{ padding: '1rem', paddingLeft: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.date}</td>
                <td className="transaction-description" style={{ padding: '1rem', fontWeight: 500 }}>{t.description}</td>
                <td className="transaction-account" style={{ padding: '1rem', textAlign: 'center' }}>
                  {getAccountBadge(t.account_type)}
                </td>
                <td className="transaction-amount" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: amountColor }}>
                  {prefix} {formatBRL(t.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
