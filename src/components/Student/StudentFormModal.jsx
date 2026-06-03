import { useState } from 'react'
import { X, User } from 'lucide-react'
import { ROADMAP_PHASES } from '../../data/mockData'

const EMPTY = {
  name: '', whatsapp: '', email: '', instagram: '',
  city: '', startDate: '', goal: '100000',
  currentMonth: '1', notes: '',
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>
        {label}{required && <span style={{ color: '#e0ab42', marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(name, e.target.value)}
        style={{ width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = '#e0ab42'}
        onBlur={e => e.target.style.borderColor = '#2a2a2a'}
      />
    </div>
  )
}

function initials(name) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function StudentFormModal({ student = null, onSave, onClose }) {
  const isEdit = !!student
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState(student ? {
    name: student.name || '',
    whatsapp: student.whatsapp || '',
    email: student.email || '',
    instagram: student.instagram || '',
    city: student.city || '',
    startDate: student.startDate || today,
    goal: String(student.goal || 100000),
    currentMonth: String(student.currentMonth || 1),
    notes: student.notes || '',
  } : { ...EMPTY, startDate: today })

  const set = (name, value) => setForm(prev => ({ ...prev, [name]: value }))
  const canSave = form.name.trim() && form.whatsapp.trim() && form.startDate

  const handleSave = () => {
    if (!canSave) return
    const data = {
      name: form.name.trim(),
      initials: initials(form.name),
      whatsapp: form.whatsapp.replace(/\D/g, ''),
      email: form.email.trim(),
      instagram: form.instagram.trim(),
      city: form.city.trim(),
      startDate: form.startDate,
      goal: parseFloat(form.goal) || 100000,
      currentMonth: parseInt(form.currentMonth) || 1,
      notes: form.notes.trim(),
      photo: '',
      ...(isEdit ? {} : {
        roadmap: { M1: 'active', M2: 'pending', M3: 'pending', M4: 'pending', M5: 'pending', M6: 'pending' },
        monthly: [],
        sessions: [],
        milestones: [],
        products: [],
        defaults: { amazonFeesPct: 15, taxRate: 6, prepCenter: 0, shipping: 0, accounting: 0 },
      })
    }
    onSave(data)
    onClose()
  }

  const preview = initials(form.name)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}
      onClick={onClose}
    >
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, width: '100%', maxWidth: 620, padding: 32 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #e0ab42, #b8892f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#000' }}>
              {preview || <User size={20} color="#000" />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {isEdit ? 'Editar Mentorado' : 'Novo Mentorado'}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#555' }}>
                {isEdit ? student.name : 'Preencha os dados de contato'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Identificação */}
          <div>
            <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Identificação</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Field label="Nome completo" name="name" value={form.name} onChange={set} placeholder="João Silva" required />
              <Field label="Cidade / Estado" name="city" value={form.city} onChange={set} placeholder="São Paulo, SP" />
            </div>
          </div>

          {/* Contato */}
          <div>
            <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Contato</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="WhatsApp (só números)" name="whatsapp" value={form.whatsapp} onChange={set} placeholder="35991234567" required />
              <Field label="E-mail" name="email" value={form.email} onChange={set} placeholder="joao@email.com" type="email" />
              <Field label="Instagram" name="instagram" value={form.instagram} onChange={set} placeholder="@joaosilva" />
            </div>
          </div>

          {/* Mentoria */}
          <div>
            <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Mentoria</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Data de início" name="startDate" value={form.startDate} onChange={set} type="date" required />
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                  Fase atual <span style={{ color: '#e0ab42' }}>*</span>
                </label>
                <select
                  value={form.currentMonth}
                  onChange={e => set('currentMonth', e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', fontSize: 13, outline: 'none' }}
                >
                  {ROADMAP_PHASES.map((p, i) => (
                    <option key={p.id} value={i + 1}>{p.id} — {p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>Meta de faturamento</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 12 }}>R$</span>
                  <input
                    type="number" value={form.goal} onChange={e => set('goal', e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 28px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#e0ab42'}
                    onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Observações internas</div>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Perfil do aluno, capital disponível, experiência anterior..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#e0ab42'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                flex: 1, padding: '13px', borderRadius: 10,
                background: canSave ? 'linear-gradient(135deg, #e0ab42, #b8892f)' : '#1a1a1a',
                border: 'none', cursor: canSave ? 'pointer' : 'not-allowed',
                color: canSave ? '#000' : '#444', fontSize: 15, fontWeight: 700,
              }}
            >
              {isEdit ? 'Salvar alterações' : 'Cadastrar mentorado'}
            </button>
            <button onClick={onClose} style={{ padding: '13px 20px', borderRadius: 10, background: 'none', border: '1px solid #222', cursor: 'pointer', color: '#666', fontSize: 14 }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
