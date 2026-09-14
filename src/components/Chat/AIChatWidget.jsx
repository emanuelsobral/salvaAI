import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatWithAI, hasApiKey } from '../../services/aiService';
import { getDashboardData } from '../../services/dashboardService';
import { completedChatHistory } from '../../utils/chat';

export default function AIChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Faz rolagem automática para baixo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  if (!user) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!hasApiKey()) {
      alert('Por favor, configure sua Chave de API de IA no menu esquerdo (Configurar IA).');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setLoading(true);

    try {
      const freshContext = await getDashboardData(user.uid);
      const reply = await chatWithAI(
        completedChatHistory(history),
        userMessage,
        freshContext
      );
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: reply }] }]);
    } catch (error) {
      setHistory(prev => [...prev, { role: 'model', isError: true, parts: [{ text: `🚨 Ops! Ocorreu um erro: ${error.message}` }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        className="chat-launcher"
        aria-label="Abrir assistente financeiro"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), #2980b9)',
          boxShadow: '0 4px 15px rgba(0,245,212,0.3)',
          display: isOpen ? 'none' : 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 999,
          fontSize: '24px'
        }}
      >
        ✨
      </button>

      {/* Chat Drawer */}
      <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)} style={{ zIndex: 1100 }}>
        <div
          className={`drawer-content chat-panel ${isOpen ? 'active' : ''}`}
          onClick={e => e.stopPropagation()}
          style={{ padding: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Header do Chat */}
          <div style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>SalvaAI Chat ✨</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Seu assistente financeiro pessoal
              </p>
            </div>
            <button className="btn-close" aria-label="Fechar assistente" onClick={() => setIsOpen(false)}>&times;</button>
          </div>

          {/* Área de Mensagens */}
          <div className="chat-messages" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                <p>Faça uma pergunta sobre suas finanças!</p>
                <p style={{ fontSize: '0.85rem' }}>Ex: "Onde eu gastei mais este mês?"</p>
              </div>
            )}

            {history.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: isUser ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    color: isUser ? '#fff' : 'var(--text-main)',
                    lineHeight: '1.5',
                    fontSize: '0.95rem'
                  }}>
                    {msg.parts[0].text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner" style={{ width: '15px', height: '15px', borderWidth: '2px' }}></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-composer" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-sidebar)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte algo..."
                aria-label="Sua pergunta"
                style={{ flex: 1, minWidth: 0, padding: '0.8rem 1rem', borderRadius: '25px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
              />
              <button
                type="submit"
                aria-label="Enviar pergunta"
                disabled={loading || !input.trim()}
                style={{
                  background: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
