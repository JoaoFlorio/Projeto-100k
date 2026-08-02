import { useState } from 'react'
import { AlertTriangle, Upload, X } from 'lucide-react'
import { marcarLegadoResolvido } from '../../data/legado'

// Quem abrir o site novo com dados antigos guardados no navegador ganha a oferta
// de subir tudo, em vez de descobrir depois que ficaram órfãos.
const normalizarNome = (n) => (n || '').trim().toLowerCase()

export default function ResgateLocal({ legado, students, onImport, onPronto }) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const jaExistem = new Set(students.map(s => normalizarNome(s.name)))
  const novos = legado.filter(s => !jaExistem.has(normalizarNome(s.name)))

  const enviar = async () => {
    setEnviando(true)
    setErro('')
    try {
      // Sem o id antigo (era timestamp): o servidor gera um uuid novo
      const semId = novos.map(s => { const copia = { ...s }; delete copia.id; return copia })
      await onImport([...students, ...semId])
      // Só marca como resolvido depois que o servidor confirmou
      marcarLegadoResolvido()
      onPronto(`${novos.length} mentorado(s) deste navegador foram para o banco.`)
    } catch (err) {
      setErro('Não consegui enviar: ' + err.message + ' — os dados continuam salvos aqui, pode tentar de novo.')
    } finally {
      setEnviando(false)
    }
  }

  const ignorar = () => {
    marcarLegadoResolvido()
    onPronto('')
  }

  return (
    <div style={{ border: '1px solid rgba(224,171,66,0.35)', background: 'rgba(224,171,66,0.06)', borderRadius: 12, padding: '16px 18px', marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertTriangle size={17} color="#e0ab42" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>
            Encontrei {legado.length} mentorado(s) salvos neste navegador
          </div>
          <div style={{ fontSize: 12.5, color: '#999', lineHeight: 1.6, marginBottom: 4 }}>
            São da versão antiga, de antes do banco compartilhado — só existem aqui, ninguém
            mais da equipe enxerga. {novos.length > 0
              ? <>Posso enviar {novos.length === legado.length ? 'os' : `${novos.length} deles (o resto já está no banco)`} para o banco agora.</>
              : <>Todos já estão no banco, não há o que enviar.</>}
          </div>
          <div style={{ fontSize: 11.5, color: '#666', marginBottom: 14 }}>
            {legado.map(s => s.name).join(' · ')}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {novos.length > 0 && (
              <button
                onClick={enviar}
                disabled={enviando}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #e0ab42, #b8892f)', border: 'none', cursor: enviando ? 'wait' : 'pointer', color: '#000', fontSize: 13, fontWeight: 700 }}
              >
                <Upload size={14} /> {enviando ? 'Enviando...' : 'Enviar para o banco'}
              </button>
            )}
            <button
              onClick={ignorar}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', cursor: 'pointer', color: '#888', fontSize: 13, fontWeight: 600 }}
            >
              <X size={14} /> Não mostrar de novo
            </button>
          </div>

          {erro && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#ef4444' }}>{erro}</div>
          )}
        </div>
      </div>
    </div>
  )
}
