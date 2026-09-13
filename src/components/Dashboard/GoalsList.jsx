import { formatBRL } from '../../utils/formatters';

export default function GoalsList({ goals, onOpenGoalModal }) {
  return (
    <div className="card savings-card" style={{ gridColumn: 'span 1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Cofres de Investimentos</h3>
        <span style={{ fontSize: '1.2rem' }}>🗃️</span>
      </div>

      {!goals || goals.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0' }}>
          Você ainda não tem caixinhas.
        </div>
      ) : (
        goals.map(goal => (
          <div key={goal.id} className="saving-item">
            <div className="saving-info">
              <span>{goal.name}</span>
              <span>{formatBRL(goal.balance)}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${goal.progress_percent}%` }}
              ></div>
            </div>
            {goal.target > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                Meta: {formatBRL(goal.target)} ({goal.progress_percent.toFixed(1)}%)
              </div>
            )}
          </div>
        ))
      )}

      <button className="btn-outline" onClick={onOpenGoalModal}>
        Guardar Acúmulos →
      </button>
    </div>
  );
}
