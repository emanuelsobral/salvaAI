export default function NotificationsBanner({ notifications }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.8rem' }}>
      {notifications.map((notif, idx) => (
        <div key={idx} style={{
          background: notif.type === 'DANGER' ? 'rgba(239, 35, 60, 0.1)' : 'rgba(252, 163, 17, 0.1)',
          borderLeft: `4px solid ${notif.type === 'DANGER' ? 'var(--accent-red)' : 'var(--accent-orange)'}`,
          padding: '1rem',
          borderRadius: '8px',
          color: notif.type === 'DANGER' ? 'var(--accent-red)' : 'var(--accent-orange)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>
            {notif.type === 'DANGER' ? '🚨' : '⚠️'}
          </span>
          {notif.message}
        </div>
      ))}
    </div>
  );
}
