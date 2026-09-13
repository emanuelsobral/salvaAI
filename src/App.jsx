/**
 * App.jsx - Componente raiz do SalvaAI.
 * Gerencia: Auth guard, roteamento SPA, providers globais.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ModalProvider } from './components/UI/ModalSystem';

import Sidebar from './components/Layout/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AIChatWidget from './components/Chat/AIChatWidget';

import './styles/global.css';

/**
 * Layout autenticado com Sidebar + conteúdo principal.
 */
function AuthenticatedLayout() {
  const { uid } = useAuth();
  return (
    <div className="app-container" key={uid}>
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/assinaturas" element={<SubscriptionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AIChatWidget />
    </div>
  );
}

/**
 * Guard: Redireciona para login se não autenticado.
 */
function AppRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          Carregando SalvaAI...
        </p>
      </div>
    );
  }

  return (
    <Routes>
      {isAuthenticated ? (
        <Route path="/*" element={<AuthenticatedLayout />} />
      ) : (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
          <AppRouter />
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
