import { useState, useEffect } from 'react'
import { Users, X, Trash2, UserPlus, AlertTriangle, Check } from 'lucide-react'
import { api } from '../../data/api'

export default function EquipeModal({ meuEmail, onClose }) {
  const [users, setUsers] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    try {
      const { users } = await api.listarUsers()
      setUsers(users)
      setErro('')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const adicionar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErro(''); setOk('')
    try {
      await api.criarUser(email.trim(), senha, nome.trim())
      setOk(`${email.trim()} agora tem acesso.`)
      setNome(''); setEmail(''); setSenha('')
      await carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const remover = async (u) => {
    setErro(''); setOk('')
    try {
      await api.apagarUser(u.id)
      setOk(`Acesso de ${u.email} removido.`)
      await carregar()
    } catch (err) {
      setErro(err.message)
    }
  }

  const podeSalvar = email.includes('@') && senha.length >= 8 && !salvando

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} color="#e0ab42" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Quem tem acesso</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: '#666', margin: '0 0 22px', lineHeight: 1.5 }}>
          Cada pessoa entra com o próprio e-mail e senha. Removeu daqui, perde o acesso na hora —
          sem precisar trocar a senha de mais ninguém.
        </p>

        {/* Lista */}
        <div style={{ border: '1px solid #1e1e1e', borderRadius: 12, padding: 8, marginBottom: 16 }}>
          {carregando ? (
            <div style={{ padding: 14, fontSize: 12.5, color: '#555' }}>Carregando...</div>
          ) : users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.name || u.email}
                  {u.email === meuEmail && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: '#e0ab42', fontWeight: 600 }}>VOCÊ</span>
                  )}
                </div>
                {u.name && <div style={{ fontSize: 11.5, color: '#666' }}>{u.email}</div>}
              </div>
              {u.email !== meuEmail && (
                <button
                  onClick={() => remover(u)}
                  title="Remover acesso"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Adicionar */}
        <form onSubmit={adicionar} style={{ border: '1px solid #1e1e1e', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={15} color="#e0ab42" /> Dar acesso a alguém
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome (opcional)"
              style={campo}
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              style={campo}
            />
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Senha provisória (mín. 8 caracteres)"
              autoComplete="new-password"
              style={campo}
            />
          </div>

          <button
            type="submit"
            disabled={!podeSalvar}
            style={{
              marginTop: 14, padding: '11px 18px', borderRadius: 9,
              background: podeSalvar ? 'linear-gradient(135deg, #e0ab42, #b8892f)' : '#1a1a1a',
              border: 'none', cursor: podeSalvar ? 'pointer' : 'not-allowed',
              color: podeSalvar ? '#000' : '#444', fontSize: 13.5, fontWeight: 700,
            }}
          >
            {salvando ? 'Criando...' : 'Criar acesso'}
          </button>

          <div style={{ marginTop: 12, fontSize: 11.5, color: '#555', lineHeight: 1.5 }}>
            Combine a senha provisória por WhatsApp e peça para a pessoa trocar depois de entrar.
          </div>
        </form>

        {erro && (
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 12.5, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {erro}
          </div>
        )}
        {ok && (
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, fontSize: 12.5, color: '#22c55e', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Check size={14} style={{ flexShrink: 0 }} /> {ok}
          </div>
        )}
      </div>
    </div>
  )
}

const campo = {
  width: '100%', padding: '11px 14px',
  background: '#1a1a1a', border: '1px solid #2a2a2a',
  borderRadius: 9, color: '#f0f0f0', fontSize: 13.5, outline: 'none',
  boxSizing: 'border-box',
}
