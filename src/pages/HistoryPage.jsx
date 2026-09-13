import { useAuth } from '../hooks/useAuth';
import GlobalHistory from '../components/History/GlobalHistory';

export default function HistoryPage() {
  const { user } = useAuth();

  return (
    <div id="view-transactions" className="view-section active">
      <header className="topbar">
        <div className="greeting">
          <h1>Todas as Transações 💸</h1>
          <p>Histórico massivo auditável. Exclua algo errado e o saldo será estornado pro lugar certo.</p>
        </div>
      </header>

      <GlobalHistory uid={user?.uid} />
    </div>
  );
}
