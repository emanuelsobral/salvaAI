import { formatBRL } from '../../utils/formatters';

export default function BalanceCards({ balances }) {
  const { GENERAL = 0, CAIXINHA = 0, VR = 0, VA = 0 } = balances || {};

  return (
    <div className="dashboard-grid balances-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      <div className="card balance-card general">
        <h3>Conta Corrente 🏦</h3>
        <h2>{formatBRL(GENERAL)}</h2>
        <p>Saldo livre na conta principal.</p>
      </div>
      <div className="card balance-card caixinha">
        <h3>Caixinhas 🗃️</h3>
        <h2>{formatBRL(CAIXINHA)}</h2>
        <p>Total guardado nos seus cofres.</p>
      </div>
      <div className="card balance-card benefit vr">
        <h3>Saldo Refeição (VR)</h3>
        <h2>{formatBRL(VR)}</h2>
        <p>Uso exclusivo para restaurantes.</p>
      </div>
      <div className="card balance-card benefit va">
        <h3>Saldo Alimentação (VA)</h3>
        <h2>{formatBRL(VA)}</h2>
        <p>Uso exclusivo para supermercados.</p>
      </div>
    </div>
  );
}
