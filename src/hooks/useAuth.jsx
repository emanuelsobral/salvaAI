/**
 * useAuth Hook
 * Gerencia o estado de autenticação do Firebase em toda a aplicação.
 * Provê: user, loading, login, logout, register
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthChange, loginWithGoogle, loginWithEmail, registerWithEmail, logout } from '../services/auth';

// Context de Auth para compartilhar estado globalmente
const AuthContext = createContext(null);

/**
 * Provider que envolve a app e disponibiliza o estado de auth.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Observa mudanças de auth (login/logout/refresh)
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    uid: user?.uid || null,
    displayName: user?.displayName || user?.email || 'Explorador',
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir o contexto de autenticação.
 * @returns {{ user, loading, isAuthenticated, uid, displayName, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider>');
  }
  return context;
}
