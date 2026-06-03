import { forwardRef } from 'react'
import { calcDRE, calcHealthScore, fmtCurrency, fmtPct } from '../../utils/calculations'
import { ROADMAP_PHASES } from '../../data/mockData'
import { analyzeBottlenecks } from './RelatorioPDF'

const RelatorioTurmaPDF = forwardRef(({ students }, ref) => {
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const totalRevenue = students.reduce((s, st) => s + st.monthly.reduce((a, m) => a + m.revenue, 0), 0)
  const totalProfit  = students.reduce((s, st) => s + st.monthly.reduce((a, m) => a + calcDRE(m).netProfit, 0), 0)
  const alerts = students.filter(s => {
    const last = s.monthly[s.monthly.length - 1]
    return last && (last.acos > 30 || calcDRE(last).netMargin < 5)
  })

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', background: '#fff', color: '#111', padding: '40px 48px' }}>
      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .turma-break { page-break-before: always; }
        }
        .pt { width: 100%; border-collapse: collapse; }
        .pt td, .pt th { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
        .pt th { background: #f5f5f5; font-weight: 700; text-align: left; }
      `}</style>

      {/* ══ PÁGINA 1: VISÃO GERAL DA TURMA ══ */}
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 18, borderBottom: '3px solid #e0ab42' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#e0ab42', letterSpacing: 3, marginBottom: 2 }}>PROJETO</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1 }}>100K</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 3 }}>Relatório da Turma</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, color: '#888' }}>Gerado em {today}</div>
            <div style={{ fontSize: 13, color: '#111', marginTop: 4, fontWeight: 600 }}>{students.length} mentorados ativos</div>
          </div>
        </div>

        {/* Totais da turma */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Faturamento Total', value: fmtCurrency(totalRevenue), color: '#e0ab42' },
            { label: 'Lucro Total', value: fmtCurrency(totalProfit), color: totalProfit >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Alunos com Alerta', value: String(alerts.length), color: alerts.length > 0 ? '#ef4444' : '#22c55e' },
            { label: 'Total de Sessões', value: String(students.reduce((s, st) => s + st.sessions.length, 0)), color: '#888' },
          ].map((k, i) => (
            <div key={i} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Tabela ranking */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
            Ranking da Turma
          </div>
          <table className="pt">
            <thead>
              <tr>
                <th>#</th>
                <th>Aluno</th>
                <th>Fase</th>
                <th style={{ textAlign: 'right' }}>Fat. Acumulado</th>
                <th style={{ textAlign: 'right' }}>Lucro Últ. Mês</th>
                <th style={{ textAlign: 'right' }}>Margem</th>
                <th style={{ textAlign: 'right' }}>ACOS</th>
                <th style={{ textAlign: 'right' }}>Health</th>
                <th style={{ textAlign: 'right' }}>Meta %</th>
                <th style={{ textAlign: 'right' }}>Sessões</th>
              </tr>
            </thead>
            <tbody>
              {[...students]
                .sort((a, b) => b.monthly.reduce((s, m) => s + m.revenue, 0) - a.monthly.reduce((s, m) => s + m.revenue, 0))
                .map((s, idx) => {
                  const accRev  = s.monthly.reduce((a, m) => a + m.revenue, 0)
                  const last    = s.monthly[s.monthly.length - 1]
                  const lastDRE = last ? calcDRE(last) : null
                  const health  = calcHealthScore(s.monthly)
                  const goalPct = Math.min(100, (accRev / (s.goal || 100000)) * 100)
                  return (
                    <tr key={s.id} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                      <td style={{ color: idx === 0 ? '#e0ab42' : '#999', fontWeight: 700 }}>{idx === 0 ? '🥇' : `#${idx + 1}`}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#e0ab42', background: '#fffbf0', padding: '2px 7px', borderRadius: 4, border: '1px solid #e0ab4240' }}>
                          M{s.currentMonth} — {ROADMAP_PHASES[s.currentMonth - 1]?.title}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#e0ab42' }}>{fmtCurrency(accRev)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: lastDRE?.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                        {lastDRE ? fmtCurrency(lastDRE.netProfit) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', color: lastDRE?.netMargin >= 10 ? '#22c55e' : '#e0ab42' }}>
                        {lastDRE ? fmtPct(lastDRE.netMargin) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', color: last?.acos <= 25 ? '#22c55e' : '#ef4444' }}>
                        {last ? last.acos + '%' : '—'}
                      </td>
                      <td style={{ textAlign: 'right', color: health >= 70 ? '#22c55e' : health >= 45 ? '#e0ab42' : '#ef4444', fontWeight: 700 }}>
                        {health}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <div style={{ width: 48, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${goalPct}%`, background: goalPct >= 80 ? '#22c55e' : '#e0ab42', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{goalPct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', color: '#888' }}>{s.sessions.length}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div style={{ background: '#fff5f5', border: '1px solid #ef444440', borderLeft: '4px solid #ef4444', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              ⚠ Alunos que precisam de atenção imediata
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {alerts.map(s => {
                const last = s.monthly[s.monthly.length - 1]
                const lastDRE = last ? calcDRE(last) : null
                const reasons = []
                if (last?.acos > 30) reasons.push(`ACOS ${last.acos}% (acima de 30%)`)
                if (lastDRE?.netMargin < 5) reasons.push(`Margem ${lastDRE.netMargin.toFixed(1)}% (abaixo de 5%)`)
                return (
                  <div key={s.id} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#111', minWidth: 140 }}>{s.name}</span>
                    <span style={{ color: '#ef4444' }}>{reasons.join(' · ')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══ PÁGINAS INDIVIDUAIS POR ALUNO ══ */}
      {students.map(student => {
        const { monthly, sessions, goal, currentMonth } = student
        const lastMonth = monthly[monthly.length - 1]
        const lastDRE   = lastMonth ? calcDRE(lastMonth) : null
        const health    = calcHealthScore(monthly)
        const accRevenue = monthly.reduce((s, m) => s + m.revenue, 0)
        const goalPct   = Math.min(100, (accRevenue / (goal || 100000)) * 100)
        const insights  = analyzeBottlenecks(student).slice(0, 2)
        const recentSessions = [...(sessions || [])].reverse().slice(0, 2)

        const severityStyle = {
          critical: { bg: '#fff5f5', border: '#ef4444', tag: '#ef4444', tagBg: '#fee2e2', label: 'CRÍTICO' },
          warning:  { bg: '#fffbf0', border: '#e0ab42', tag: '#b8892f', tagBg: '#fef3c7', label: 'ATENÇÃO' },
          ok:       { bg: '#f0fdf4', border: '#22c55e', tag: '#15803d', tagBg: '#dcfce7', label: 'SAUDÁVEL' },
        }

        return (
          <div key={student.id} className="turma-break" style={{ paddingTop: 32 }}>
            {/* Header individual */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #e0ab42' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{student.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
                  {ROADMAP_PHASES[currentMonth - 1]?.title} (M{currentMonth}) · Relatório Individual
                </div>
              </div>
              <div style={{
                padding: '4px 12px', background: health >= 70 ? '#f0fdf4' : health >= 45 ? '#fffbf0' : '#fff5f5',
                border: `1px solid ${health >= 70 ? '#22c55e' : health >= 45 ? '#e0ab42' : '#ef4444'}`,
                borderRadius: 20, fontSize: 12, fontWeight: 700,
                color: health >= 70 ? '#15803d' : health >= 45 ? '#b8892f' : '#dc2626',
              }}>
                Score de Saúde: {health}/100
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Fat. Acumulado', value: fmtCurrency(accRevenue), color: '#e0ab42' },
                { label: 'Lucro Últ. Mês', value: lastDRE ? fmtCurrency(lastDRE.netProfit) : '—', color: lastDRE?.netProfit >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'Margem Líquida', value: lastDRE ? fmtPct(lastDRE.netMargin) : '—', color: lastDRE?.netMargin >= 10 ? '#22c55e' : '#e0ab42' },
                { label: 'ACOS', value: lastMonth ? lastMonth.acos + '%' : '—', color: lastMonth?.acos <= 25 ? '#22c55e' : '#ef4444' },
                { label: 'Meta R$100k', value: goalPct.toFixed(0) + '%', color: goalPct >= 100 ? '#22c55e' : '#e0ab42' },
              ].map((k, i) => (
                <div key={i} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Insights + Sessões lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Top insights */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Diagnóstico</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {insights.map((ins, i) => {
                    const s = severityStyle[ins.severity]
                    return (
                      <div key={i} style={{ background: s.bg, borderLeft: `3px solid ${s.border}`, borderRadius: 6, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, color: s.tag, background: s.tagBg, padding: '1px 5px', borderRadius: 3 }}>{s.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>{ins.area}</span>
                        </div>
                        <p style={{ fontSize: 10, color: '#555', margin: '0 0 6px', lineHeight: 1.4 }}>{ins.summary}</p>
                        {ins.tips.slice(0, 2).map((tip, j) => (
                          <div key={j} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: s.tag, flexShrink: 0, marginTop: 1 }}>→</span>
                            <span style={{ fontSize: 10, color: '#444', lineHeight: 1.4 }}>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Últimas sessões */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Últimas Sessões {recentSessions.length === 0 ? '(nenhuma registrada)' : ''}
                </div>
                {recentSessions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recentSessions.map((s, i) => (
                      <div key={i} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 6, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#333' }}>
                            {new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span style={{ fontSize: 9, color: '#999' }}>{s.duration} min</span>
                        </div>
                        {s.notes && <p style={{ fontSize: 10, color: '#666', margin: 0, lineHeight: 1.4 }}>{s.notes.slice(0, 120)}{s.notes.length > 120 ? '…' : ''}</p>}
                        {s.actions?.slice(0, 2).map((a, j) => (
                          <div key={j} style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                            <span style={{ fontSize: 9, color: '#e0ab42', fontWeight: 700, flexShrink: 0 }}>→</span>
                            <span style={{ fontSize: 9, color: '#555' }}>{a}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 6, padding: '16px', textAlign: 'center', color: '#bbb', fontSize: 11 }}>
                    Nenhuma sessão registrada ainda
                  </div>
                )}
              </div>
            </div>

            {/* Mini DRE último mês */}
            {lastMonth && lastDRE && (
              <div style={{ marginTop: 16, background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                  DRE — {lastMonth.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Receita Bruta', value: fmtCurrency(lastMonth.revenue) },
                    { label: 'CMV', value: fmtCurrency(lastMonth.cogs), neg: true },
                    { label: 'Lucro Bruto', value: fmtPct(lastDRE.grossMargin), color: '#b8892f', bold: true },
                    { label: 'Total OpEx', value: fmtCurrency(lastDRE.opEx), neg: true },
                    { label: 'Lucro Líquido', value: fmtCurrency(lastDRE.netProfit), color: lastDRE.netProfit >= 0 ? '#22c55e' : '#ef4444', bold: true },
                    { label: 'Margem Líq.', value: fmtPct(lastDRE.netMargin), color: lastDRE.netMargin >= 10 ? '#22c55e' : '#e0ab42', bold: true },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 12, fontWeight: item.bold ? 700 : 400, color: item.color || (item.neg ? '#ef4444' : '#333') }}>
                        {item.neg && '-'}{item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Rodapé */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 14, marginTop: 32, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#bbb' }}>
        <span>Projeto 100K · Mentoria Individual JF · joaoflorio.com.br</span>
        <span>Gerado em {today}</span>
      </div>
    </div>
  )
})

RelatorioTurmaPDF.displayName = 'RelatorioTurmaPDF'
export default RelatorioTurmaPDF
