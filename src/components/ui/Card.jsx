export function Card({ children, style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, color = '#f0f0f0', icon }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{sub}</div>}
        </div>
        {icon && <div style={{ color: '#333' }}>{icon}</div>}
      </div>
    </Card>
  )
}

export function Badge({ children, color = '#e0ab42' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: color + '20', color,
      border: `1px solid ${color}40`,
    }}>
      {children}
    </span>
  )
}
