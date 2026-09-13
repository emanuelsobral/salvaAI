import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useOperationKey } from '../hooks/useOperationKey';
import { useAuth } from '../hooks/useAuth';
import { getDashboardData } from '../services/dashboardService';
import { payInvoice } from '../services/cardService';
import { getGreeting } from '../utils/formatters';

// Componentes
import BalanceCards from '../components/Dashboard/BalanceCards';
import Lighthouse from '../components/Dashboard/Lighthouse';
import GoalsList from '../components/Dashboard/GoalsList';
const Charts = lazy(() => import('../components/Dashboard/Charts'));
import TransactionTable from '../components/Dashboard/TransactionTable';
import NotificationsBanner from '../components/Dashboard/NotificationsBanner';
import InvoiceCard from '../components/Dashboard/InvoiceCard';
import AIAdvisor from '../components/Dashboard/AIAdvisor';

// Modais
import TransactionModal from '../components/Modals/TransactionModal';
import CardTransactionModal from '../components/Modals/CardTransactionModal';
import GoalModal from '../components/Modals/GoalModal';
import ImportModal from '../components/Modals/ImportModal';

// Drawers
import YearProjectionDrawer from '../components/Drawers/YearProjectionDrawer';

export default function DashboardPage() {
  const { user, displayName } = useAuth();
  
  // Estado de Dados
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const paymentLock = useRef(false);
  const operation = useOperationKey();

  // Estados dos Modais
  const [isTxnModalOpen, setTxnModalOpen] = useState(false);
  const [isCardModalOpen, setCardModalOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isProjectionDrawerOpen, setProjectionDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const dashboardData = await getDashboardData(user.uid);
      setData(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Não foi possível carregar o painel. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePayInvoice = async () => {
    if (!data || paymentLock.current || data.invoice_requires_reconciliation) return;
    if (!window.confirm(`Confirma o pagamento unificado da fatura corrente no valor de R$ ${data.curr_invoice.toFixed(2)}? O valor será debitado do seu Saldo Livre.`)) return;
    
    paymentLock.current = true;
    setPaying(true);
    try {
      const res = await payInvoice(user.uid, data.curr_month, data.curr_year, operation.keyFor([data.curr_month, data.curr_year]));
      operation.complete();
      alert(res.message);
      loadData();
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      paymentLock.current = false;
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div id="view-dashboard" className="view-section active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h2 style={{ color: 'var(--text-muted)' }}>Carregando seus dados financeiros...</h2>
      </div>
    );
  }

  if (error) return <div className="card" role="alert"><p>{error}</p><button className="btn-primary" onClick={loadData}>Tentar novamente</button></div>;
  if (!data) return null;

  return (
    <div id="view-dashboard" className="view-section active">
      <header className="topbar">
        <div className="greeting">
          <h1>{getGreeting()}, {displayName} 👋</h1>
          <p>Aqui está o resumo e a projeção da sua saúde financeira.</p>
        </div>
        <div className="actions">
          <button className="btn-outline" style={{ borderColor: '#00f5d4', color: '#00f5d4' }} onClick={() => setImportModalOpen(true)}>
            📥 Smart Paste (Lote)
          </button>
          <button className="btn-purple" onClick={() => setCardModalOpen(true)}>
            💳 Cartão de Crédito
          </button>
          <button className="btn-primary" onClick={() => setTxnModalOpen(true)}>
            + Nova Transação
          </button>
        </div>
      </header>

      <NotificationsBanner notifications={data.notifications} />
      
      <AIAdvisor data={data} />
      
      <BalanceCards balances={data.balances} />

      <InvoiceCard 
        total={data.curr_invoice} 
        month={data.curr_month} 
        year={data.curr_year} 
        onPay={handlePayInvoice}
        paying={paying}
        requiresReconciliation={data.invoice_requires_reconciliation}
        onViewDetails={() => setProjectionDrawerOpen(true)}
      />

      <div className="dashboard-grid" style={{ marginTop: '1.8rem' }}>
        <Lighthouse lighthouse={data.lighthouse} />
        <GoalsList goals={data.goals} onOpenGoalModal={() => setGoalModalOpen(true)} />
      </div>

      <Suspense fallback={<p>Carregando gráficos...</p>}><Charts charts={data.charts} /></Suspense>

      <TransactionTable transactions={data.recent_transactions} />

      {/* Renderização de Modais e Drawers Ocultos na Árvore */}
      {isTxnModalOpen && <TransactionModal uid={user.uid} isOpen={isTxnModalOpen} onClose={() => setTxnModalOpen(false)} onRefresh={loadData} />}
      {isCardModalOpen && <CardTransactionModal uid={user.uid} isOpen={isCardModalOpen} onClose={() => setCardModalOpen(false)} onRefresh={loadData} />}
      {isGoalModalOpen && <GoalModal uid={user.uid} goals={data.goals} isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} onRefresh={loadData} />}
      {isImportModalOpen && <ImportModal uid={user.uid} isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onRefresh={loadData} />}
      
      <YearProjectionDrawer isOpen={isProjectionDrawerOpen} onClose={() => setProjectionDrawerOpen(false)} projection={data.projection_12m} />
    </div>
  );
}
