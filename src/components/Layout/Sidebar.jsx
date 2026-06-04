import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Target, ChevronRight, LogOut } from 'lucide-react'

export default function Sidebar({ students, onLogout }) {
  const loc = useLocation()

  const isActive = (path) => loc.pathname === path || loc.pathname.startsWith(path + '/')

  return (
    <aside style={{ width: 220, minHeight: '100vh', background: '#0e0e0e', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1e1e1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #e0ab42, #b8892f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={16} color="#000" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e0ab42', letterSpacing: 1, lineHeight: 1 }}>PROJETO</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>100K</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 0', flex: 1 }}>
        <NavItem to="/" active={loc.pathname === '/'} icon={<LayoutDashboard size={16} />} label="Painel Geral" />

        <div style={{ padding: '16px 16px 6px', fontSize: 10, color: '#555', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Mentorados
        </div>

        {students.map(s => (
          <NavItem
            key={s.id}
            to={`/aluno/${s.id}`}
            active={isActive(`/aluno/${s.id}`)}
            icon={
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e0ab42', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#000' }}>
                {s.initials}
              </div>
            }
            label={s.name.split(' ')[0] + ' ' + s.name.split(' ').slice(-1)[0]}
          />
        ))}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e1e' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '9px 10px',
            background: 'none', border: '1px solid #1e1e1e',
            borderRadius: 8, cursor: 'pointer',
            color: '#555', fontSize: 12, fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef444430'; e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#555' }}
        >
          <LogOut size={13} />
          Sair
        </button>
        <div style={{ marginTop: 8, fontSize: 10, color: '#333', paddingLeft: 2 }}>v1.0 · João Flório</div>
      </div>
    </aside>
  )
}

function NavItem({ to, active, icon, label }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px', textDecoration: 'none',
        color: active ? '#e0ab42' : '#888',
        background: active ? 'rgba(224,171,66,0.08)' : 'transparent',
        borderLeft: active ? '2px solid #e0ab42' : '2px solid transparent',
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {active && <ChevronRight size={12} />}
    </Link>
  )
}
