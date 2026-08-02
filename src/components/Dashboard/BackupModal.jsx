import { useState, useRef } from 'react'
import { Download, Upload, X, AlertTriangle, Check, Database } from 'lucide-react'

const FILE_TAG = 'projeto-100k'

const normalizeName = (name) => (name || '').trim().toLowerCase()

export default function BackupModal({ students, onImport, onClose }) {
  const [payload, setPayload] = useState(null)   // conteúdo válido do arquivo lido
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const fileRef = useRef(null)

  const exportBackup = () => {
    const data = {
      app: FILE_TAG,
      version: 1,
      exportedAt: new Date().toISOString(),
      students,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_100k_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setDone(`Backup de ${students.length} mentorado(s) baixado.`)
  }

  const readFile = (file) => {
    setError(''); setDone(''); setPayload(null)
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (parsed?.app !== FILE_TAG || !Array.isArray(parsed.students)) {
          setError('Arquivo não é um backup do Projeto 100K.')
          return
        }
        if (parsed.students.length === 0) {
          setError('O backup está vazio — nenhum mentorado dentro dele.')
          return
        }
        setPayload(parsed)
      } catch {
        setError('Não consegui ler o arquivo. Ele precisa ser o .json exportado por este sistema.')
      }
    }
    reader.onerror = () => setError('Falha ao abrir o arquivo.')
    reader.readAsText(file)
  }

  const applyReplace = () => {
    onImport(payload.students)
    setDone(`${payload.students.length} mentorado(s) importado(s). Os dados anteriores foram substituídos.`)
    setPayload(null)
  }

  const applyMerge = () => {
    const existing = new Set(students.map(s => normalizeName(s.name)))
    const novos = payload.students.filter(s => !existing.has(normalizeName(s.name)))
    onImport([...students, ...novos])
    setDone(
      novos.length === 0
        ? 'Nenhum mentorado novo — todos os nomes do arquivo já existiam aqui.'
        : `${novos.length} mentorado(s) adicionado(s). Os seus continuam intactos.`
    )
    setPayload(null)
  }

  // Prévia de o que vem no arquivo
  const existingNames = new Set(students.map(s => normalizeName(s.name)))
  const incomingNew = payload ? payload.students.filter(s => !existingNames.has(normalizeName(s.name))) : []

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={18} color="#e0ab42" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Backup dos mentorados</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: '#666', margin: '0 0 22px', lineHeight: 1.5 }}>
          Os dados ficam salvos apenas neste navegador. Use o backup para levar os mentorados
          para outro computador ou para passar a outra pessoa da equipe.
        </p>

        {/* Exportar */}
        <div style={{ border: '1px solid #1e1e1e', borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>Exportar</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>
            Baixa um arquivo .json com os {students.length} mentorado(s) deste navegador — DRE, sessões, produtos e perfil.
          </div>
          <button
            onClick={exportBackup}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 9, background: 'linear-gradient(135deg, #e0ab42, #b8892f)', border: 'none', cursor: 'pointer', color: '#000', fontSize: 13.5, fontWeight: 700 }}
          >
            <Download size={15} /> Baixar backup
          </button>
        </div>

        {/* Importar */}
        <div style={{ border: '1px solid #1e1e1e', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>Importar</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 14 }}>
            Abre um backup gerado por outra pessoa e traz os mentorados dela para cá.
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={e => { readFile(e.target.files?.[0]); e.target.value = '' }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 9, background: '#1a1a1a', border: '1px solid #2a2a2a', cursor: 'pointer', color: '#ccc', fontSize: 13.5, fontWeight: 600 }}
          >
            <Upload size={15} /> Escolher arquivo
          </button>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 12.5, color: '#ef4444', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}

          {payload && (
            <div style={{ marginTop: 16, padding: 16, background: '#0e0e0e', border: '1px solid #222', borderRadius: 10 }}>
              <div style={{ fontSize: 12.5, color: '#f0f0f0', fontWeight: 600, marginBottom: 8 }}>
                O arquivo tem {payload.students.length} mentorado(s):
              </div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.7, marginBottom: 14 }}>
                {payload.students.map(s => s.name).join(' · ')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={applyReplace}
                  style={{ textAlign: 'left', padding: '11px 14px', borderRadius: 9, background: 'linear-gradient(135deg, #e0ab42, #b8892f)', border: 'none', cursor: 'pointer', color: '#000' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Substituir tudo</div>
                  <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 2 }}>
                    Fica exatamente igual ao arquivo. Apaga os {students.length} mentorado(s) atuais deste navegador.
                  </div>
                </button>

                <button
                  onClick={applyMerge}
                  style={{ textAlign: 'left', padding: '11px 14px', borderRadius: 9, background: '#1a1a1a', border: '1px solid #2a2a2a', cursor: 'pointer', color: '#ccc' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Mesclar</div>
                  <div style={{ fontSize: 11.5, color: '#777', marginTop: 2 }}>
                    Adiciona só quem ainda não existe aqui ({incomingNew.length} novo(s)). Mantém os seus como estão.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {done && (
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, fontSize: 12.5, color: '#22c55e', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Check size={14} style={{ flexShrink: 0 }} /> {done}
          </div>
        )}
      </div>
    </div>
  )
}
