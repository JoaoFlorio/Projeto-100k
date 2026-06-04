import { useState } from 'react'
import { Target, Eye, EyeOff, Lock } from 'lucide-react'

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'projeto100k'

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    setTimeout(() => {
      if (password === APP_PASSWORD) {
        localStorage.setItem('p100k_auth', '1')
        onLogin()
      } else {
        setError('Senha incorreta. Tente novamente.')
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setPassword('')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(224,171,66,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: -100,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(224,171,66,0.03) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: 20,
        padding: '40px 36px',
        position: 'relative',
        animation: shake ? 'shake 0.5s ease' : 'none',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #e0ab42, #b8892f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14, boxShadow: '0 8px 24px rgba(224,171,66,0.3)',
          }}>
            <Target size={26} color="#000" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#e0ab42', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Projeto
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
              100K
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#555', textAlign: 'center' }}>
            Mentoria Individual JF · Acesso restrito
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Senha de acesso
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="#444" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Digite a senha"
                autoFocus
                style={{
                  width: '100%', padding: '13px 44px 13px 42px',
                  background: '#1a1a1a',
                  border: `1px solid ${error ? '#ef444460' : '#2a2a2a'}`,
                  borderRadius: 10, color: '#f0f0f0', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => { if (!error) e.target.style.borderColor = '#e0ab4260' }}
                onBlur={e => { if (!error) e.target.style.borderColor = '#2a2a2a' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✕</span> {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || loading}
            style={{
              width: '100%', padding: '14px',
              background: password && !loading
                ? 'linear-gradient(135deg, #e0ab42, #b8892f)'
                : '#1a1a1a',
              border: 'none',
              borderRadius: 10,
              color: password && !loading ? '#000' : '#444',
              fontSize: 15, fontWeight: 700,
              cursor: password && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #1a1a1a', textAlign: 'center', fontSize: 11, color: '#333' }}>
          João Flório · Mentoria Individual JF
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
