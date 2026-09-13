import { useState } from 'react';
import { getApiKey, saveApiKey } from '../../services/aiService';

export default function AiSettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(getApiKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveApiKey(apiKey);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content" style={{ position: 'relative', border: '1px solid rgba(0, 245, 212, 0.4)' }}>
        <button className="btn-close" style={{ position: 'absolute', right: '1.5rem', top: '1.5rem' }} onClick={onClose}>&times;</button>
        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>✨ Inteligência Artificial</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Para ativar o Conselheiro Financeiro, Leitor de Notas e o Chatbot, insira sua chave da API do <strong>Google Gemini</strong>. 
          <br /><br />
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
            Clique aqui para gerar uma chave gratuitamente.
          </a>
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Sua API Key do Gemini</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..." 

            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}>
            {saved ? 'Chave Salva! ✅' : 'Salvar (vazio remove a chave)'}
          </button>
        </form>
      </div>
    </div>
  );
}
