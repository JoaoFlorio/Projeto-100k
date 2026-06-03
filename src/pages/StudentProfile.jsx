import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { ArrowLeft, MessageCircle, ChevronDown, ChevronUp, Plus, FileText, Pencil, Upload, Phone, Mail, AtSign, MapPin, Calendar, Target, StickyNote, Award } from 'lucide-react'
import { Card, Badge } from '../components/ui/Card'
import { calcDRE, calcHealthScore, fmtCurrency, fmtPct } from '../utils/calculations'
import { ROADMAP_PHASES } from '../data/mockData'
import MonthModal from '../components/Student/MonthModal'
import ImportCSVModal from '../components/Student/ImportCSVModal'
import Calculadora from '../components/Student/Calculadora'
import RelatorioPDF from '../components/Student/RelatorioPDF'
import ProdutosCatalogo from '../components/Student/ProdutosCatalogo'
import StudentFormModal from '../components/Student/StudentFormModal'
import SessionModal from '../components/Student/SessionModal'

/* ── Tooltip ─────────────────────────────────── */
function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#e0ab42', fontSize: 13, fontWeight: 600 }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('pt-BR') : p.value}{suffix}
        </div>
      ))}
    </div>
  )
}

/* ── DRE linha ─────────────────────────────── */
function DRERow({ label, value, bold, color, indent, divider }) {
  return (
    <>
      {divider && <tr><td colSpan={2}><div style={{ height: 1, background: '#1e1e1e', margin: '4px 0' }} /></td></tr>}
      <tr>
        <td style={{ padding: '7px 0', fontSize: 13, color: indent ? '#666' : bold ? '#f0f0f0' : '#aaa', paddingLeft: indent ? 20 : 0, fontWeight: bold ? 700 : 400 }}>
          {label}
        </td>
        <td style={{ textAlign: 'right', fontWeight: bold ? 700 : 400, color: color || (bold ? '#f0f0f0' : '#888'), fontSize: 13 }}>
          {fmtCurrency(value)}
        </td>
      </tr>
    </>
  )
}

/* ── Health Ring ───────────────────────────── */
function HealthRing({ score }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#eab308' : '#ef4444'
  const label = score >= 70 ? 'Ótimo' : score >= 45 ? 'Regular' : 'Atenção'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={100} height={100}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="#1e1e1e" strokeWidth={7} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round" transform="rotate(-90 50 50)" />
        <text x={50} y={46} textAnchor="middle" fill={color} fontSize={20} fontWeight={700}>{score}</text>
        <text x={50} y={62} textAnchor="middle" fill="#555" fontSize={11}>{label}</text>
      </svg>
      <span style={{ fontSize: 11, color: '#555' }}>Score de Saúde</span>
    </div>
  )
}

/* ── Roadmap ────────────────────────────────── */
function Roadmap({ roadmap, monthly }) {
  const statusColor = { done: '#22c55e', active: '#e0ab42', pending: '#333' }
  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
      {ROADMAP_PHASES.map((phase, i) => {
        const status = roadmap[phase.id] || 'pending'
        const color = statusColor[status]
        return (
          <div key={phase.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i > 0 && (
              <div style={{ position: 'absolute', top: 14, right: '50%', width: '100%', height: 2, background: roadmap[ROADMAP_PHASES[i - 1].id] === 'done' ? '#22c55e' : '#1e1e1e', zIndex: 0 }} />
            )}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: status === 'pending' ? '#1a1a1a' : color, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, flexShrink: 0 }}>
              {status === 'done' && <span style={{ fontSize: 12 }}>✓</span>}
              {status === 'active' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />}
            </div>
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 2 }}>{phase.label}</div>
              <div style={{ fontSize: 11, color: status === 'pending' ? '#444' : '#aaa', fontWeight: 600 }}>{phase.title}</div>
              <div style={{ fontSize: 10, color: '#444', marginTop: 2, maxWidth: 80 }}>{phase.desc}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Sessões ────────────────────────────────── */
function Sessions({ sessions, onEdit }) {
  const [open, setOpen] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...sessions].reverse().map(s => (
        <Card key={s.id} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setOpen(open === s.id ? null : s.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 14px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minWidth: 0 }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.done ? '#0d1f0d' : '#1a1500', border: `1px solid ${s.done ? '#22c55e30' : '#e0ab4230'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={15} color={s.done ? '#22c55e' : '#e0ab42'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{s.duration} min · {s.actions.length} ações definidas</div>
              </div>
              <Badge color={s.done ? '#22c55e' : '#e0ab42'}>{s.done ? 'Realizada' : 'Próxima'}</Badge>
              {open === s.id ? <ChevronUp size={14} color="#555" /> : <ChevronDown size={14} color="#555" />}
            </button>
            <button
              onClick={() => onEdit(s)}
              title="Editar sessão"
              style={{ padding: '0 16px', height: '100%', minHeight: 64, background: 'none', border: 'none', borderLeft: '1px solid #1a1a1a', cursor: 'pointer', color: '#444', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#e0ab42'}
              onMouseLeave={e => e.currentTarget.style.color = '#444'}
            >
              <Pencil size={13} />
            </button>
          </div>
          {open === s.id && (
            <div style={{ padding: '0 20px 16px', borderTop: '1px solid #1a1a1a' }}>
              <p style={{ fontSize: 13, color: '#aaa', marginTop: 12, marginBottom: 12, lineHeight: 1.7 }}>{s.notes}</p>
              {s.actions.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Ações</div>
                  {s.actions.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: '#888' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e0ab42', flexShrink: 0 }} />
                      {a}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

/* ── Main ────────────────────────────────────── */
export default function StudentProfile({ students, onAddMonthly, onUpdateMonthly, onAddSession, onUpdateSession, onUpdateStudent }) {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [showMonthModal, setShowMonthModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingMonth, setEditingMonth] = useState(null)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const pdfRef = useRef(null)

  const student = students.find(s => s.id === id)

  const handlePrint = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: `Relatorio_${student?.name?.replace(' ', '_')}_Projeto100k`,
  })

  if (!student) return <div style={{ padding: 40, color: '#555' }}>Aluno não encontrado.</div>

  const { monthly, sessions, roadmap, currentMonth, goal, milestones } = student
  const health = calcHealthScore(monthly)
  const accRevenue = monthly.reduce((s, m) => s + m.revenue, 0)
  const goalPct = Math.min(100, (accRevenue / goal) * 100)

  const chartData = monthly.map(m => {
    const d = calcDRE(m)
    return {
      name: m.label,
      Faturamento: m.revenue,
      'Lucro Líquido': d.netProfit,
      'Margem %': parseFloat(d.netMargin.toFixed(1)),
      ACOS: m.acos,
      Unidades: m.units,
    }
  })

  const lastMonth = monthly[monthly.length - 1]
  const lastDRE = lastMonth ? calcDRE(lastMonth) : null

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'dre', label: 'DRE Mensal' },
    { id: 'graficos', label: 'Gráficos' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'calculadora', label: 'Calculadora' },
    { id: 'produtos', label: 'Produtos' },
    { id: 'sessoes', label: 'Sessões' },
    { id: 'perfil', label: 'Perfil' },
  ]

  const handleSaveMonth = (monthData, monthIndex) => {
    if (monthIndex !== null && monthIndex !== undefined) {
      onUpdateMonthly(student.id, monthIndex, monthData)
    } else {
      onAddMonthly(student.id, monthData)
    }
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* PDF oculto fora da tela */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <RelatorioPDF ref={pdfRef} student={student} />
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}>
          <ArrowLeft size={14} /> Painel Geral
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #e0ab42, #b8892f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, color: '#000' }}>
            {student.initials}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>{student.name}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge color="#e0ab42">M{currentMonth} — {ROADMAP_PHASES[currentMonth - 1]?.title}</Badge>
              <span style={{ color: '#444', fontSize: 12 }}>Iniciou em {new Date(student.startDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowImportModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg,#e0ab4220,#b8892f10)', border: '1px solid #e0ab4240', color: '#e0ab42', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Upload size={14} /> Importar da Amazon
            </button>
            <button
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <FileText size={14} /> PDF
            </button>
            <a
              href={`https://wa.me/55${student.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '8px 16px', borderRadius: 8, background: '#22c55e15', border: '1px solid #22c55e30', color: '#22c55e', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #1a1a1a' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? '#e0ab42' : '#666',
            borderBottom: activeTab === t.id ? '2px solid #e0ab42' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t.id === 'calculadora' ? '📊 ' : ''}{t.label}
          </button>
        ))}
      </div>

      {/* ── VISÃO GERAL ── */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Fat. Acumulado', value: fmtCurrency(accRevenue), color: '#e0ab42' },
              { label: 'Lucro Últ. Mês', value: lastDRE ? fmtCurrency(lastDRE.netProfit) : '—', color: lastDRE && lastDRE.netProfit > 0 ? '#22c55e' : '#ef4444' },
              { label: 'Margem Líq.', value: lastDRE ? fmtPct(lastDRE.netMargin) : '—', color: lastDRE && lastDRE.netMargin >= 10 ? '#22c55e' : '#eab308' },
              { label: 'ACOS', value: lastMonth ? lastMonth.acos + '%' : '—', color: lastMonth && lastMonth.acos <= 25 ? '#22c55e' : '#ef4444' },
              { label: 'Meta R$100k', value: goalPct.toFixed(0) + '%', color: goalPct >= 80 ? '#22c55e' : '#e0ab42' },
            ].map((k, i) => (
              <Card key={i} style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 16, marginBottom: 24 }}>
            <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <HealthRing score={health} />
            </Card>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>Progresso da Meta</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#e0ab42' }}>{fmtCurrency(accRevenue)}</span>
                <span style={{ fontSize: 14, color: '#555' }}>de {fmtCurrency(goal)}</span>
              </div>
              <div style={{ height: 10, background: '#1a1a1a', borderRadius: 5, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ height: '100%', width: `${goalPct}%`, background: 'linear-gradient(90deg, #b8892f, #e0ab42)', borderRadius: 5 }} />
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e0ab42" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e0ab42" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip prefix="R$ " />} />
                  <Area type="monotone" dataKey="Faturamento" stroke="#e0ab42" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>Marcos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {milestones.map((ms, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e0ab42', flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <div style={{ fontSize: 13, color: '#e0ab42', fontWeight: 600 }}>{ms.title}</div>
                      <div style={{ fontSize: 11, color: '#555' }}>{new Date(ms.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>Evolução: Faturamento vs Lucro Líquido</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => 'R$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<CustomTooltip prefix="R$ " />} />
                <Bar dataKey="Faturamento" fill="#e0ab4240" stroke="#e0ab42" strokeWidth={1} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro Líquido" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── DRE MENSAL ── */}
      {activeTab === 'dre' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#555' }}>{monthly.length} meses lançados</div>
            <button
              onClick={() => { setEditingMonth(null); setShowMonthModal(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #e0ab42, #b8892f)', border: 'none', cursor: 'pointer', color: '#000', fontSize: 14, fontWeight: 700 }}
            >
              <Plus size={16} /> Lançar Mês {monthly.length + 1}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(monthly.length, 1)}, 1fr)`, gap: 16 }}>
            {monthly.map((m, i) => {
              const d = calcDRE(m)
              return (
                <Card key={i} style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e0ab42' }}>{m.label}</div>
                    <button
                      onClick={() => { setEditingMonth({ month: m, index: i }); setShowMonthModal(true) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 2 }}
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 16 }}>Mês {m.month} de operação</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <DRERow label="Receita Bruta" value={m.revenue} bold />
                      <DRERow label="Devoluções" value={-m.returns} indent />
                      <DRERow label="Receita Líquida" value={d.netRevenue} bold divider />
                      <DRERow label="CMV" value={-m.cogs} indent />
                      <DRERow label="Lucro Bruto" value={d.grossProfit} bold color="#e0ab42" divider />
                      <DRERow label={`Margem Bruta: ${d.grossMargin.toFixed(1)}%`} value={0} indent />
                      <tr><td colSpan={2}><div style={{ height: 16 }} /></td></tr>
                      <tr><td colSpan={2}><div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>Despesas Operacionais</div></td></tr>
                      <DRERow label="Fees Amazon" value={-m.amazonFees} indent />
                      <DRERow label="Prep Center" value={-m.prepCenter} indent />
                      <DRERow label="Publicidade" value={-m.ads} indent />
                      <DRERow label="Frete" value={-m.shipping} indent />
                      <DRERow label="Contabilidade" value={-m.accounting} indent />
                      <DRERow label="Total OpEx" value={-d.opEx} bold divider />
                      <DRERow label="Resultado Operacional" value={d.opResult} bold divider />
                      <DRERow label="Impostos" value={-m.taxes} indent />
                      <DRERow label="LUCRO LÍQUIDO" value={d.netProfit} bold color={d.netProfit >= 0 ? '#22c55e' : '#ef4444'} divider />
                      <DRERow label={`Margem Líquida: ${d.netMargin.toFixed(1)}%`} value={0} indent />
                      <tr><td colSpan={2}><div style={{ height: 12 }} /></td></tr>
                      <tr>
                        <td style={{ fontSize: 12, color: '#555' }}>ACOS</td>
                        <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: m.acos <= 25 ? '#22c55e' : '#ef4444' }}>{m.acos}%</td>
                      </tr>
                      <tr>
                        <td style={{ fontSize: 12, color: '#555' }}>Unidades</td>
                        <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#aaa' }}>{m.units}</td>
                      </tr>
                      <tr>
                        <td style={{ fontSize: 12, color: '#555' }}>Ticket médio</td>
                        <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#aaa' }}>{fmtCurrency(m.avgTicket)}</td>
                      </tr>
                    </tbody>
                  </table>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── GRÁFICOS ── */}
      {activeTab === 'graficos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.8 }}>Faturamento Mensal</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e0ab42" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#e0ab42" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#151515" />
                <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => 'R$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip content={<CustomTooltip prefix="R$ " />} />
                <Area type="monotone" dataKey="Faturamento" stroke="#e0ab42" fill="url(#g1)" strokeWidth={2.5} dot={{ fill: '#e0ab42', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.8 }}>Lucro Líquido Mensal</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#151515" />
                  <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => 'R$' + (v / 1000).toFixed(0) + 'k'} />
                  <Tooltip content={<CustomTooltip prefix="R$ " />} />
                  <Bar dataKey="Lucro Líquido" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.8 }}>Margem Líquida %</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#151515" />
                  <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <ReferenceLine y={10} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Meta 10%', fill: '#22c55e', fontSize: 10 }} />
                  <Line type="monotone" dataKey="Margem %" stroke="#eab308" strokeWidth={2.5} dot={{ fill: '#eab308', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.8 }}>ACOS Evolução</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#151515" />
                  <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Limite 25%', fill: '#ef4444', fontSize: 10 }} />
                  <ReferenceLine y={15} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Ideal 15%', fill: '#22c55e', fontSize: 10 }} />
                  <Line type="monotone" dataKey="ACOS" stroke="#e0ab42" strokeWidth={2.5} dot={{ fill: '#e0ab42', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.8 }}>Unidades Vendidas</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#151515" />
                  <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Unidades" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* ── ROADMAP ── */}
      {activeTab === 'roadmap' && (
        <Card style={{ padding: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#888', marginBottom: 32, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Jornada dos 6 Meses — Meta R$100k
          </div>
          <Roadmap roadmap={roadmap} monthly={monthly} />
          <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {ROADMAP_PHASES.map(phase => {
              const status = roadmap[phase.id] || 'pending'
              const m = monthly[parseInt(phase.id[1]) - 1]
              const d = m ? calcDRE(m) : null
              const color = status === 'done' ? '#22c55e' : status === 'active' ? '#e0ab42' : '#333'
              return (
                <Card key={phase.id} style={{ padding: 20, borderColor: color + '30', background: status === 'pending' ? '#0d0d0d' : '#111' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: color + '20', border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color }}>
                      {phase.id}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{phase.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 12, lineHeight: 1.5 }}>{phase.desc}</div>
                  {d ? (
                    <div style={{ fontSize: 12, color: '#aaa' }}>
                      <span style={{ color: '#e0ab42', fontWeight: 600 }}>{fmtCurrency(m.revenue)}</span> faturados
                      <span style={{ color: '#555' }}> · </span>
                      <span style={{ color: d.netMargin >= 10 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{d.netMargin.toFixed(1)}%</span> margem
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#333' }}>Dados ainda não disponíveis</div>
                  )}
                </Card>
              )
            })}
          </div>
        </Card>
      )}

      {/* ── CALCULADORA ── */}
      {activeTab === 'calculadora' && <Calculadora student={student} />}

      {/* ── PRODUTOS ── */}
      {activeTab === 'produtos' && (
        <ProdutosCatalogo student={student} onUpdateStudent={onUpdateStudent} />
      )}

      {/* ── SESSÕES ── */}
      {activeTab === 'sessoes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: '#555' }}>{sessions.length} encontros registrados</div>
            <button
              onClick={() => setShowSessionModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #e0ab42, #b8892f)', border: 'none', cursor: 'pointer', color: '#000', fontSize: 14, fontWeight: 700 }}
            >
              <Plus size={16} /> Nova Sessão
            </button>
          </div>
          <Sessions sessions={sessions} onEdit={s => setEditingSession(s)} />
        </div>
      )}

      {/* ── PERFIL ── */}
      {activeTab === 'perfil' && (() => {
        const start = new Date(student.startDate + 'T12:00:00')
        const now = new Date()
        const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
        const months = Math.floor(diffDays / 30)
        const days = diffDays % 30

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card style={{ padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Dados do Mentorado</div>
                <button
                  onClick={() => setShowEditProfile(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Pencil size={13} /> Editar Perfil
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Coluna esquerda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { icon: <Phone size={14} />, label: 'WhatsApp', value: student.whatsapp ? student.whatsapp.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4') : '—', link: student.whatsapp ? `https://wa.me/55${student.whatsapp}` : null, linkLabel: 'Abrir conversa' },
                    { icon: <Mail size={14} />, label: 'E-mail', value: student.email || '—', link: student.email ? `mailto:${student.email}` : null, linkLabel: 'Enviar e-mail' },
                    { icon: <AtSign size={14} />, label: 'Instagram', value: student.instagram || '—', link: student.instagram ? `https://instagram.com/${student.instagram.replace('@', '')}` : null, linkLabel: 'Ver perfil' },
                    { icon: <MapPin size={14} />, label: 'Cidade / Estado', value: student.city || '—' },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', flexShrink: 0 }}>
                        {f.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>{f.label}</div>
                        <div style={{ fontSize: 14, color: '#e0f0f0' }}>{f.value}</div>
                        {f.link && f.value !== '—' && (
                          <a href={f.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#e0ab42', textDecoration: 'none', marginTop: 2, display: 'inline-block' }}>{f.linkLabel} →</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coluna direita */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { icon: <Calendar size={14} />, label: 'Data de início', value: new Date(student.startDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { icon: <Target size={14} />, label: 'Meta de faturamento', value: `R$ ${(student.goal || 100000).toLocaleString('pt-BR')}` },
                    { icon: <Award size={14} />, label: 'Fase atual', value: `M${student.currentMonth} — ${ROADMAP_PHASES[student.currentMonth - 1]?.title || ''}` },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', flexShrink: 0 }}>
                        {f.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>{f.label}</div>
                        <div style={{ fontSize: 14, color: '#e0f0f0' }}>{f.value}</div>
                      </div>
                    </div>
                  ))}

                  {student.notes && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', flexShrink: 0 }}>
                        <StickyNote size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>Observações</div>
                        <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>{student.notes}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Tempo na mentoria */}
            <Card style={{ padding: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Tempo na Mentoria</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, background: '#0d0d0d', borderRadius: 12, border: '1px solid #1a1a1a', padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, fontWeight: 700, color: '#e0ab42', lineHeight: 1 }}>{months}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{months === 1 ? 'mês' : 'meses'}</div>
                </div>
                <div style={{ flex: 1, background: '#0d0d0d', borderRadius: 12, border: '1px solid #1a1a1a', padding: '20px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, fontWeight: 700, color: '#aaa', lineHeight: 1 }}>{days}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{days === 1 ? 'dia' : 'dias'}</div>
                </div>
                <div style={{ flex: 2, background: '#0d0d0d', borderRadius: 12, border: '1px solid #1a1a1a', padding: '20px 24px' }}>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>PROGRESSO DA JORNADA (6 meses)</div>
                  <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (diffDays / 180) * 100)}%`, background: 'linear-gradient(90deg, #b8892f, #e0ab42)', borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>
                    <span style={{ color: '#e0ab42', fontWeight: 600 }}>{Math.min(100, ((diffDays / 180) * 100).toFixed(0))}%</span> da mentoria de 6 meses concluída
                  </div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                    Início: {new Date(student.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      })()}

      {/* Modal de edição de perfil */}
      {showEditProfile && (
        <StudentFormModal
          student={student}
          onSave={data => onUpdateStudent(student.id, () => data)}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      {/* Modal de nova sessão */}
      {showSessionModal && (
        <SessionModal
          onSave={session => onAddSession(student.id, session)}
          onClose={() => setShowSessionModal(false)}
        />
      )}

      {/* Modal de edição de sessão */}
      {editingSession && (
        <SessionModal
          session={editingSession}
          onSave={data => onUpdateSession(student.id, editingSession.id, data)}
          onClose={() => setEditingSession(null)}
        />
      )}

      {/* Modal de lançamento manual */}
      {showMonthModal && (
        <MonthModal
          student={student}
          existingMonth={editingMonth?.month || null}
          monthIndex={editingMonth?.index ?? null}
          onSave={handleSaveMonth}
          onClose={() => { setShowMonthModal(false); setEditingMonth(null) }}
        />
      )}

      {/* Modal de importação via CSV Amazon */}
      {showImportModal && (
        <ImportCSVModal
          student={student}
          onSave={handleSaveMonth}
          onSaveProductCosts={updatedRows => {
            onUpdateStudent(student.id, s => {
              const existingProducts = s.products || []
              // Update costs for existing products
              const updatedProducts = existingProducts.map(p => {
                const match = updatedRows.find(r => r.id === p.id)
                return match ? { ...p, cost: match.cost } : p
              })
              // Add new products (from campaigns or manual add)
              const existingIds = new Set(existingProducts.map(p => p.id))
              const newProducts = updatedRows
                .filter(r => !existingIds.has(r.id))
                .map(r => ({ id: r.id, name: r.name, asin: '', cost: r.cost }))
              return { products: [...updatedProducts, ...newProducts] }
            })
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
