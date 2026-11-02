/**
 * Sidebar - Navegação lateral SPA com toggle de tema.
 * Inclui menu mobile (hamburger) com overlay.
 */

import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { displayName, logout } = useAuth();
  const userName = displayName.includes('@') ? displayName.split('@')[0] : displayName.trim().split(/\s+/)[0];
  const userBadge = <span className="brand-user" title={displayName} aria-label={`Usuário: ${displayName}`}>{userName}</span>;
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    const focusable = () => [...menu.querySelectorAll('a, button')].filter(el => el.getClientRects().length);
    // Espera o menu sair de visibility:hidden antes de mover o foco.
    const frame = requestAnimationFrame(() => focusable()[0]?.focus());
    const handleKey = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!menu.contains(document.activeElement)) { event.preventDefault(); first?.focus(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', handleKey); trigger?.focus(); };
  }, [mobileOpen]);

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
      <header className="mobile-topbar">
      <div className="brand-identity"><span className="mobile-brand">Salva<span>AI</span></span>{userBadge}</div>
      <button
        ref={triggerRef}
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        aria-controls="app-sidebar"
      >
        ☰
      </button>
      </header>

      {/* Overlay escuro */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <aside id="app-sidebar" ref={menuRef} className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Menu principal">
        <div className="logo">
          <div className="brand-identity"><h2>Salva<span>AI</span></h2>{userBadge}</div>
          <button className="btn-close mobile-menu-close" onClick={closeMobile} aria-label="Fechar menu">&times;</button>
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
          <p>Modo de Exibição</p>
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="icon">🌓</span> Trocar Tema
          </button>
          

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

    </>
  );
}
