import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { localReply } from '../../utils/localAssistant';
import { getDashboardData } from '../../services/dashboardService';
import { chatWithAI } from '../../services/aiService';
import { aiHistory } from '../../utils/aiHistory';

export default function AIChatWidget() {
  const { user } = useAuth();
  return user ? <ChatSession key={user.uid} user={user} /> : null;
}

function ChatSession({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const busy = useRef(false);
  const activeRequest = useRef(null);
  useEffect(() => () => { activeRequest.current?.abort(); }, []);

  const messagesEndRef = useRef(null);

  // Faz rolagem automática para baixo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  if (!user) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || busy.current) return;
    busy.current = true;
    const controller = new AbortController();
    activeRequest.current = controller;


    const userMessage = input.trim();
    setInput('');
    setHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setLoading(true);

    try {
      let reply;
      if (useAi) reply = await chatWithAI(aiHistory(history), userMessage, await getDashboardData(user.uid), { signal: controller.signal, uid: user.uid });
      else {
        reply = localReply(userMessage);
        if (reply === null) reply = localReply(userMessage, await getDashboardData(user.uid));
      }
      if (!controller.signal.aborted) setHistory(prev => [...prev, { role: 'model', parts: [{ text: reply }] }]);
    } catch (error) {
      if (!controller.signal.aborted) setHistory(prev => [...prev, { role: 'model', isError: true, parts: [{ text: `🚨 Ops! Ocorreu um erro: ${error.message}` }] }]);
    } finally {
      busy.current = false;
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
              <h3 style={{ color: 'var(--accent-primary)', margin: 0 }}>Assistente SalvaAI</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {useAi ? 'Análises com DeepSeek' : 'Consultas locais, sem IA'}
              </p>
            </div>
            <button className="btn-close" aria-label="Fechar assistente" onClick={() => setIsOpen(false)}>&times;</button>
          </div>

          {/* Área de Mensagens */}
          <div className="chat-messages" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                <p>{useAi ? 'Pergunte sobre suas finanças ou conceitos de economia.' : 'Consulte os dados do seu painel.'}</p>
                <p style={{ fontSize: '0.85rem' }}>{useAi ? 'Suas perguntas e um resumo do painel serão enviados à DeepSeek. As respostas podem conter erros e não consultam notícias ou cotações atuais.' : 'Digite: saldo, fatura, gastos, maior categoria ou projeção.'}</p>
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
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Consultando seus registros...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-composer" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-sidebar)' }}>
            <label><input type="checkbox" checked={useAi} disabled={loading} onChange={event => { setUseAi(event.target.checked); setHistory([]); }} /> Usar DeepSeek para analisar</label>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                maxLength={4000}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ex.: qual meu saldo?"
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
