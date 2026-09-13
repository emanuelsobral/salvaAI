/**
 * LoginPage - Tela de autenticação premium.
 * Suporta: Google Sign-In + Email/Senha + Registro.
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (isRegister) {
      result = await registerWithEmail(email, password, name);
    } else {
      result = await loginWithEmail(email, password);
    }

    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Cabeçalho */}
        <div className="login-header">
          <h1>Salva<span style={{ color: 'var(--accent-primary)' }}>AI</span></h1>
          <p className="login-subtitle">Seu farol financeiro inteligente</p>
        </div>

        {/* Card de Login */}
        <div className="login-card">
          <h2>{isRegister ? 'Criar Conta' : 'Entrar'}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            {isRegister
              ? 'Crie sua conta gratuita para começar a controlar suas finanças.'
              : 'Acesse sua conta para ver seu painel financeiro.'}
          </p>

          {/* Botão Google */}
          <button
            className="login-google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divisor */}
          <div className="login-divider">
            <span>ou</span>
          </div>

          {/* Form Email/Senha */}
          <form onSubmit={handleEmailSubmit}>
            {isRegister && (
              <div className="form-group">
                <label>Seu Nome</label>
                <input
                  type="text"
                  placeholder="Como quer ser chamado?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                placeholder={isRegister ? 'Mínimo 6 caracteres' : 'Sua senha'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="login-error">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '0.5rem' }}
            >
              {loading ? '⏳ Processando...' : (isRegister ? 'Criar Minha Conta' : 'Entrar')}
            </button>
          </form>

          {/* Alternar Login/Registro */}
          <p className="login-switch">
            {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="login-switch-btn"
            >
              {isRegister ? 'Fazer Login' : 'Criar Conta'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="login-footer">
          Seus dados ficam 100% protegidos no Firebase 🔒
        </p>
      </div>
    </div>
  );
}
