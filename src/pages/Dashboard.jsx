import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { AlertTriangle, Award, Plus, Trash2, FileText, Download } from 'lucide-react'
import { Card, Badge } from '../components/ui/Card'
import { calcDRE, calcHealthScore, fmtCurrency, getGoalPct } from '../utils/calculations'
import StudentFormModal from '../components/Student/StudentFormModal'
import RelatorioTurmaPDF from '../components/Student/RelatorioTurmaPDF'

function HealthRing({ score }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#eab308' : '#ef4444'
  return (
    <svg width={72} height={72}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="#1e1e1e" strokeWidth={5} />
      <circle
        cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x={36} y={36} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={13} fontWeight={700}>
        {score}
      </text>
    </svg>
  )
}

function GoalBar({ pct }) {
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#e0ab42' : '#ef4444'
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
        <span style={{ color: '#666' }}>Meta R$100k</span>
        <span style={{ color, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 6, background: '#1e1e1e', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function Dashboard({ students, onAddStudent, onDeleteStudent }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filterPhase, setFilterPhase] = useState(null)
  const turmaPdfRef = useRef(null)

  const handlePrintTurma = useReactToPrint({
    contentRef: turmaPdfRef,
    documentTitle: `Relatorio_Turma_Projeto100k`,
  })

  const exportCSV = () => {
    const headers = ['Nome', 'Fase', 'Fat.Total (R$)', 'Lucro.Total (R$)', 'Margem.Media (%)', 'ACOS.Medio (%)', 'Sessoes', 'Meses.Lancados', 'Ultimo.Faturamento (R$)', 'Ultima.Margem (%)']
    const rows = students.map(s => {
      const accRevenue  = s.monthly.reduce((a, m) => a + m.revenue, 0)
      const totalProfit = s.monthly.reduce((a, m) => a + calcDRE(m).netProfit, 0)
      const avgMargin   = s.monthly.length > 0 ? s.monthly.reduce((a, m) => a + calcDRE(m).netMargin, 0) / s.monthly.length : 0
      const avgAcos     = s.monthly.length > 0 ? s.monthly.reduce((a, m) => a + m.acos, 0) / s.monthly.length : 0
      const last        = s.monthly[s.monthly.length - 1]
      const lastDRE     = last ? calcDRE(last) : null
      return [
        `"${s.name}"`,
        `M${s.currentMonth}`,
        accRevenue.toFixed(2),
        totalProfit.toFixed(2),
        avgMargin.toFixed(1),
        avgAcos.toFixed(1),
        s.sessions.length,
        s.monthly.length,
        last ? last.revenue.toFixed(2) : '0',
        lastDRE ? lastDRE.netMargin.toFixed(1) : '0',
      ]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `turma_100k_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalRevenue = students.reduce((s, st) => {
    return s + st.monthly.reduce((a, m) => a + m.revenue, 0)
  }, 0)
  const totalProfit = students.reduce((s, st) => {
    return s + st.monthly.reduce((a, m) => s + calcDRE(m).netProfit, 0)
  }, 0)

  // Alertas: alunos com ACOS > 30 no último mês
  const alerts = students.filter(s => {
    const last = s.monthly[s.monthly.length - 1]
    return last && last.acos > 30
  })

  // Rankeados por faturamento acumulado, com filtro de fase
  const ranked = [...students]
    .filter(s => filterPhase === null || s.currentMonth === filterPhase)
    .sort((a, b) => {
      const ra = a.monthly.reduce((s, m) => s + m.revenue, 0)
      const rb = b.monthly.reduce((s, m) => s + m.revenue, 0)
      return rb - ra
    })

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* PDF oculto da turma */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <RelatorioTurmaPDF ref={turmaPdfRef} students={students} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 }}>Painel Geral</h1>
          <p style={{ color: '#555', fontSize: 14, marginTop: 4 }}>{students.length} mentorados ativos</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Download size={14} /> Exportar CSV
          </button>
          <button
            onClick={handlePrintTurma}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <FileText size={14} /> PDF Turma
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #e0ab42, #b8892f)', border: 'none', cursor: 'pointer', color: '#000', fontSize: 14, fontWeight: 700 }}
          >
            <Plus size={16} /> Novo Mentorado
          </button>
        </div>
      </div>

      {/* Totalizadores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Mentorados</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#fff' }}>{students.length}</div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>turma ativa</div>
        </Card>
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Faturamento Total</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#e0ab42' }}>{fmtCurrency(totalRevenue)}</div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>todos os alunos</div>
        </Card>
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Lucro Líquido Total</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#22c55e' }}>{fmtCurrency(Math.abs(totalProfit))}</div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>acumulado turma</div>
        </Card>
        <Card style={{ padding: '20px 24px', borderColor: alerts.length > 0 ? '#ef444440' : '#1e1e1e' }}>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Alertas</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: alerts.length > 0 ? '#ef4444' : '#22c55e' }}>{alerts.length}</div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>ACOS acima de 30%</div>
        </Card>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card style={{ padding: 20, marginBottom: 24, borderColor: '#ef444430', background: '#1a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#ef4444" />
            <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 14 }}>Atenção necessária</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {alerts.map(s => {
              const last = s.monthly[s.monthly.length - 1]
              return (
                <Link key={s.id} to={`/aluno/${s.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '8px 14px', background: '#200', borderRadius: 8, border: '1px solid #ef444430', fontSize: 13 }}>
                    <span style={{ color: '#fff' }}>{s.name}</span>
                    <span style={{ color: '#ef4444', marginLeft: 8, fontWeight: 700 }}>ACOS {last.acos}%</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}

      {/* Cards dos alunos */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#888', margin: 0, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Ranking por Faturamento
          </h2>
          {/* Filtro por fase */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[null, 1, 2, 3, 4, 5, 6].map(phase => (
              <button
                key={phase ?? 'all'}
                onClick={() => setFilterPhase(filterPhase === phase ? null : phase)}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
                  background: filterPhase === phase ? '#e0ab42' : '#1a1a1a',
                  color: filterPhase === phase ? '#000' : '#666',
                  fontWeight: filterPhase === phase ? 700 : 400,
                }}
              >
                {phase === null ? 'Todos' : `M${phase}`}
              </button>
            ))}
            {filterPhase !== null && (
              <span style={{ fontSize: 11, color: '#555', marginLeft: 4 }}>
                {ranked.length} aluno{ranked.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ranked.map((s, idx) => {
            const accRevenue = s.monthly.reduce((a, m) => a + m.revenue, 0)
            const last = s.monthly[s.monthly.length - 1]
            const lastDRE = last ? calcDRE(last) : null
            const health = calcHealthScore(s.monthly)
            const goalPct = getGoalPct(s.monthly, s.goal)
            const phaseLabel = `M${s.currentMonth}`

            return (
              <div key={s.id} style={{ position: 'relative' }}>
                <Link to={`/aluno/${s.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <Card style={{ padding: '20px 24px', transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer' }}
                  className="hover-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {/* Rank */}
                    <div style={{ width: 28, textAlign: 'center', color: idx === 0 ? '#e0ab42' : idx === 1 ? '#aaa' : '#666', fontWeight: 700, fontSize: 16 }}>
                      {idx === 0 ? <Award size={20} /> : `#${idx + 1}`}
                    </div>

                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #e0ab42, #b8892f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#000', flexShrink: 0 }}>
                      {s.initials}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{s.name}</span>
                        <Badge color="#e0ab42">{phaseLabel}</Badge>
                        {last && last.acos > 30 && <Badge color="#ef4444">ACOS alto</Badge>}
                      </div>
                      <GoalBar pct={goalPct} />
                    </div>

                    {/* Métricas */}
                    <div style={{ display: 'flex', gap: 32, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>Faturamento</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#e0ab42' }}>{fmtCurrency(accRevenue)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>Margem (ult.)</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: lastDRE && lastDRE.netMargin >= 10 ? '#22c55e' : '#ef4444' }}>
                          {lastDRE ? lastDRE.netMargin.toFixed(1) + '%' : '—'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>ACOS (ult.)</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: last && last.acos <= 25 ? '#22c55e' : '#ef4444' }}>
                          {last ? last.acos + '%' : '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>Saúde</div>
                        <HealthRing score={health} />
                      </div>
                    </div>
                  </div>
                </Card>
                </Link>
                <button
                  onClick={e => { e.preventDefault(); setConfirmDelete(s) }}
                  title="Excluir mentorado"
                  style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 6, borderRadius: 6, zIndex: 2, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#333'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal novo mentorado */}
      {showAddModal && (
        <StudentFormModal
          student={null}
          onSave={data => onAddStudent(data)}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%', margin: '0 20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Excluir mentorado?</div>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
              Todos os dados de <strong style={{ color: '#fff' }}>{confirmDelete.name}</strong> — DRE, sessões, produtos e roadmap — serão apagados permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { onDeleteStudent(confirmDelete.id); setConfirmDelete(null) }}
                style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 700 }}
              >
                Excluir
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '12px 20px', borderRadius: 10, background: 'none', border: '1px solid #222', cursor: 'pointer', color: '#666', fontSize: 14 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
