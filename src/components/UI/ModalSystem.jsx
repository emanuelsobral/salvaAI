/**
 * CustomAlert & CustomConfirm - Modais de Sistema Personalizados
 * Substitui window.alert() e window.confirm() com UI premium.
 * 
 * Uso via Context global:
 *   const { showAlert, showConfirm } = useModal();
 *   await showAlert('Mensagem');
 *   const confirmed = await showConfirm('Tem certeza?');
 */

import { useState, createContext, useContext, useCallback, useRef } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [alertState, setAlertState] = useState({ open: false, message: '', title: 'Aviso', icon: '🔔' });
  const [confirmState, setConfirmState] = useState({ open: false, message: '', title: 'Confirmação Necessária' });
  
  const alertResolveRef = useRef(null);
  const confirmResolveRef = useRef(null);

  const showAlert = useCallback((message, { title = 'Aviso', icon = '🔔' } = {}) => {
    return new Promise((resolve) => {
      alertResolveRef.current = resolve;
      setAlertState({ open: true, message, title, icon });
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, open: false }));
    if (alertResolveRef.current) {
      alertResolveRef.current();
      alertResolveRef.current = null;
    }
  }, []);

  const showConfirm = useCallback((message, { title = 'Confirmação Necessária' } = {}) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({ open: true, message, title });
    });
  }, []);

  const closeConfirm = useCallback((result) => {
    setConfirmState(prev => ({ ...prev, open: false }));
    if (confirmResolveRef.current) {
      confirmResolveRef.current(result);
      confirmResolveRef.current = null;
    }
  }, []);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Custom Alert Modal */}
      <div className={`modal-overlay ${alertState.open ? 'active' : ''}`} style={{ zIndex: 9999 }}>
        <div className="modal-content" style={{ borderTop: '5px solid var(--accent-primary)', maxWidth: 400, textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{alertState.icon}</div>
          <h2 style={{ marginBottom: '1rem' }}>{alertState.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {alertState.message}
          </p>
          <button className="btn-primary" onClick={closeAlert} style={{ width: '100%', border: 'none', fontWeight: 700, padding: '1rem', borderRadius: 8 }}>
            Entendido
          </button>
        </div>
      </div>

      {/* Custom Confirm Modal */}
      <div className={`modal-overlay ${confirmState.open ? 'active' : ''}`} style={{ zIndex: 9999 }}>
        <div className="modal-content" style={{ borderTop: '5px solid var(--accent-red)', maxWidth: 450, padding: '2.5rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{confirmState.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {confirmState.message}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => closeConfirm(false)}
              style={{ flex: 1, padding: '1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => closeConfirm(true)}
              style={{ flex: 1, padding: '1rem', borderRadius: 8, border: 'none', background: 'var(--accent-red)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 35, 60, 0.3)' }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </ModalContext.Provider>
  );
}

/**
 * Hook para usar os modais de alerta e confirmação.
 */
export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal deve ser usado dentro de um <ModalProvider>');
  }
  return context;
}
