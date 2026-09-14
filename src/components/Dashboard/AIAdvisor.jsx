import { useState } from 'react';
import { generateFinancialInsight } from '../../services/aiService';

export default function AIAdvisor({ data }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    
    setLoading(true);
    setError('');
    
    try {
      const result = await generateFinancialInsight(data);
      setInsight(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ 
      marginBottom: '1.8rem', 
      background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.05), rgba(114, 9, 183, 0.05))',
      border: '1px solid rgba(0, 245, 212, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.05, pointerEvents: 'none' }}>
        ✨
      </div>
      
      <div className="advisor-layout" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✨ SalvaAI Conselheiro
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px' }}>
            Nossa Inteligência Artificial pode cruzar seus gastos, metas e faturas futuras para te dar uma dica de ouro sobre o seu orçamento atual.
          </p>
        </div>
        
        {!insight && !loading && (
          <button 
            className="btn-outline-sm" 
            onClick={handleGenerate}
            style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            Gerar Insight Mágico
          </button>
        )}
      </div>

      {loading && (
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)' }}>
          <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
          <span style={{ fontSize: '0.9rem' }}>Analisando suas finanças...</span>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 35, 60, 0.1)', color: 'var(--accent-red)', borderRadius: '8px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {insight && !loading && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1.2rem', 
          background: 'rgba(255, 255, 255, 0.03)', 
          borderRadius: '8px', 
          borderLeft: '4px solid var(--accent-primary)',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          {insight}
          
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button 
              onClick={handleGenerate} 
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              🔄 Gerar Novo Insight
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
