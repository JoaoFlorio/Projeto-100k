import { AlertTriangle } from 'lucide-react'

// Confirmação para tudo que apaga: diz o que some e não dá para desfazer.
export default function ConfirmDialog({ titulo, descricao, textoBotao = 'Excluir', onConfirm, onCancel }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onCancel}
    >
      <div
        style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <AlertTriangle size={18} color="#ef4444" />
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>{titulo}</h3>
        </div>
        <p style={{ fontSize: 13.5, color: '#888', lineHeight: 1.6, margin: '0 0 24px' }}>{descricao}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '12px 20px', borderRadius: 10, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 700 }}
          >
            {textoBotao}
          </button>
          <button
            onClick={onCancel}
            style={{ padding: '12px 20px', borderRadius: 10, background: 'none', border: '1px solid #222', cursor: 'pointer', color: '#666', fontSize: 14 }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
