/**
 * Sidebar - Navegação lateral SPA com toggle de tema.
 * Inclui menu mobile (hamburger) com overlay.
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AiSettingsModal from '../Modals/AiSettingsModal';

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const { displayName, logout } = useAuth();

  const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Botão Hamburger Mobile */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      {/* Overlay escuro */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="logo">
          <h2>Salva<span>AI</span></h2>
        </div>

        <nav>
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={closeMobile}
          >
            📊 Visão Geral
          </NavLink>
          <NavLink
            to="/historico"
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={closeMobile}
          >
            📋 Histórico Global
          </NavLink>
          <NavLink
            to="/assinaturas"
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={closeMobile}
          >
            📦 Assinaturas
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info" style={{ marginBottom: '1rem', padding: '0.6rem', borderRadius: 10, background: 'var(--bg-app)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Logado como</p>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </p>
          </div>

          <p>Modo de Exibição</p>
          <div className="theme-toggle" onClick={toggleTheme}>
            <span className="icon">🌓</span> Trocar Tema
          </div>
          
          <div className="theme-toggle" onClick={() => setAiModalOpen(true)} style={{ marginTop: '0.5rem', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
            <span className="icon">✨</span> Configurar IA
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.7rem',
              borderRadius: 8,
              border: '1px solid var(--accent-red)',
              background: 'rgba(239, 35, 60, 0.08)',
              color: 'var(--accent-red)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            🚪 Sair da Conta
          </button>
        </div>
      </aside>

      {aiModalOpen && <AiSettingsModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />}
    </>
  );
}
