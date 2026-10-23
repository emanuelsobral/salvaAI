import { financialSummary } from '../../utils/localAssistant';

export default function AIAdvisor({ data }) {
  return (
    <div className="card" style={{ marginBottom: '1.8rem', border: '1px solid var(--accent-primary)' }}>
      <h3 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>Resumo financeiro</h3>
      <p style={{ lineHeight: '1.6', margin: 0 }}>{financialSummary(data)}</p>
    </div>
  );
}
