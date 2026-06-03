import { useState } from 'react'
import { X, Plus, Trash2, MessageCircle } from 'lucide-react'

const labelStyle = { display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }
const inputStyle = { width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

export default function SessionModal({ onSave, onClose, session }) {
  const today = new Date().toISOString().split('T')[0]
  const isEdit = !!session

  const [form, setForm] = useState({
    date: session?.date || today,
    duration: String(session?.duration ?? 60),
    notes: session?.notes || '',
    actions: session?.actions?.length ? [...session.actions] : [''],
    done: session?.done !== undefined ? session.done : true,
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const addAction = () => setForm(p => ({ ...p, actions: [...p.actions, ''] }))
  const removeAction = i => setForm(p => ({ ...p, actions: p.actions.filter((_, idx) => idx !== i) }))
  const updateAction = (i, v) => setForm(p => ({ ...p, actions: p.actions.map((a, idx) => idx === i ? v : a) }))

  const canSave = form.date && form.notes.trim()

  const handleSave = () => {
    if (!canSave) return
    onSave({
      date: form.date,
      duration: parseInt(form.duration) || 60,
      notes: form.notes.trim(),
      actions: form.actions.filter(a => a.trim()),
      done: form.done,
    })
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}
      onClick={onClose}
    >
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, width: '100%', maxWidth: 580, padding: 32, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1a1500', border: '1px solid #e0ab4230', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={18} color="#e0ab42" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>{isEdit ? 'Editar Sessão' : 'Nova Sessão'}</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>{isEdit ? 'Edite os dados da call registrada' : 'Registre a call com o mentorado'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Data + Duração + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Data da Call *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#e0ab42'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
            </div>
            <div>
              <label style={labelStyle}>Duração (min)</label>
              <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="60"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#e0ab42'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.done ? 'done' : 'upcoming'}
                onChange={e => set('done', e.target.value === 'done')}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="done">Realizada</option>
                <option value="upcoming">Próxima</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label style={labelStyle}>Resumo da Call *</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="O que foi discutido, principais pontos abordados, situação atual do aluno..."
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = '#e0ab42'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
          </div>

          {/* Ações */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={labelStyle}>Ações Definidas</label>
              <button
                onClick={addAction}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 10px', color: '#888', fontSize: 12, cursor: 'pointer' }}
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {form.actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e0ab42', flexShrink: 0 }} />
                  <input
                    value={a}
                    onChange={e => updateAction(i, e.target.value)}
                    placeholder={`Ação ${i + 1}...`}
                    style={{ ...inputStyle, flex: 1, padding: '8px 10px' }}
                    onFocus={e => e.target.style.borderColor = '#e0ab42'}
                    onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                    onKeyDown={e => e.key === 'Enter' && addAction()}
                  />
                  {form.actions.length > 1 && (
                    <button onClick={() => removeAction(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
              {isEdit ? 'Salvar Alterações' : 'Salvar Sessão'}
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
