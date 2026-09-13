import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import SubsList from '../components/Subscriptions/SubsList';
import SubModal from '../components/Modals/SubModal';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Hack simples pra forçar recarregamento da lista

  return (
    <div id="view-subs" className="view-section active">
      <header className="topbar">
        <div className="greeting">
          <h1>Minhas Assinaturas 📦</h1>
          <p>Gerencie pagamentos recorrentes como Netflix, Academia, Internet e nuvem.</p>
        </div>
        <div className="actions">
          <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Nova Assinatura</button>
        </div>
      </header>

      {/* Usamos key pra forçar o componente filho a remontar (e recarregar do banco) */}
      <SubsList key={refreshKey} uid={user?.uid} />

      <SubModal 
        uid={user?.uid} 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onRefresh={() => setRefreshKey(old => old + 1)}
      />
    </div>
  );
}
