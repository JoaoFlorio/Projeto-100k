import { useState, useMemo } from 'react'
import { TrendingUp, Target, Zap } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { calcDRE, fmtCurrency, fmtPct } from '../../utils/calculations'

function Slider({ label, value, min, max, step = 1, suffix = '%', onChange, color = '#e0ab42' }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: '#aaa' }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#444', marginTop: 2 }}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  )
}

function ResultTag({ label, value, color = '#e0ab42' }) {
  return (
    <div style={{ background: '#0d0d0d', borderRadius: 10, padding: '16px 20px', border: `1px solid ${color}20` }}>
      <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function projectRevenue(lastRevenue, monthlyGrowth, monthsAhead) {
  const results = []
  let rev = lastRevenue
  for (let i = 1; i <= monthsAhead; i++) {
    rev = rev * (1 + monthlyGrowth / 100)
    results.push(Math.round(rev))
  }
  return results
}

function monthsToGoal(monthly, goal, growthRate) {
  if (!monthly.length) return null
  const last = monthly[monthly.length - 1]
  const acc = monthly.reduce((s, m) => s + m.revenue, 0)
  if (acc >= goal) return 0
  let cumulative = acc
  let rev = last.revenue
  let months = 0
  while (cumulative < goal && months < 120) {
    rev = rev * (1 + growthRate / 100)
    cumulative += rev
    months++
  }
  return months > 119 ? null : months
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function futureLabel(monthsAhead) {
  const d = new Date()
  d.setMonth(d.getMonth() + monthsAhead)
  return `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

export default function Calculadora({ student }) {
  const { monthly, goal } = student

  // Calcula crescimento médio atual
  const avgGrowth = useMemo(() => {
    if (monthly.length < 2) return 30
    const rates = []
    for (let i = 1; i < monthly.length; i++) {
      const prev = monthly[i - 1].revenue
      if (prev > 0) rates.push(((monthly[i].revenue - prev) / prev) * 100)
    }
    return rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 30
  }, [monthly])

  const lastMonth = monthly[monthly.length - 1]
  const lastDRE = lastMonth ? calcDRE(lastMonth) : null
  const accRevenue = monthly.reduce((s, m) => s + m.revenue, 0)

  // Cenário Base
  const [growthBase, setGrowthBase] = useState(avgGrowth)
  // Cenário ACOS
  const [targetAcos, setTargetAcos] = useState(lastMonth ? Math.max(5, lastMonth.acos - 5) : 15)
  // Cenário Margem
  const [targetMargin, setTargetMargin] = useState(lastDRE ? Math.min(35, lastDRE.netMargin + 5) : 20)

  const monthsBase = monthsToGoal(monthly, goal, growthBase)
  const monthsOtimista = monthsToGoal(monthly, goal, growthBase + 10)
  const monthsPessimista = monthsToGoal(monthly, goal, Math.max(5, growthBase - 10))

  // Projeção gráfica (12 meses à frente)
  const chartData = useMemo(() => {
    if (!monthly.length) return []
    const rows = []
    // Histórico
    let cumBase = 0
    monthly.forEach(m => {
      cumBase += m.revenue
      rows.push({ name: m.label, Realizado: cumBase, Base: null, Otimista: null })
    })
    // Projeção
    const lastRev = lastMonth?.revenue || 0
    const projBase = projectRevenue(lastRev, growthBase, 8)
    const projOtimista = projectRevenue(lastRev, growthBase + 10, 8)
    let cumP = accRevenue
    let cumO = accRevenue
    projBase.forEach((rev, i) => {
      cumP += rev
      cumO += projOtimista[i]
      rows.push({
        name: futureLabel(i + 1),
        Realizado: null,
        Base: Math.round(cumP),
        Otimista: Math.round(cumO),
      })
    })
    return rows
  }, [monthly, growthBase])

  // Impacto de reduzir ACOS
  const acosImpact = useMemo(() => {
    if (!lastMonth) return null
    const adsSaving = lastMonth.revenue * ((lastMonth.acos - targetAcos) / 100)
    const newDRE = calcDRE({ ...lastMonth, ads: Math.max(0, lastMonth.ads - adsSaving) })
    return { adsSaving, newMargin: newDRE.netMargin, newProfit: newDRE.netProfit }
  }, [lastMonth, targetAcos])

  // Impacto de melhorar margem → receita necessária p/ meta de lucro
  const marginImpact = useMemo(() => {
    if (!lastMonth || !lastDRE) return null
    const targetMonthlyProfit = lastMonth.revenue * (targetMargin / 100)
    const currentMonthlyProfit = lastDRE.netProfit
    const extraProfit = targetMonthlyProfit - currentMonthlyProfit
    return { targetMonthlyProfit, extraProfit }
  }, [lastMonth, lastDRE, targetMargin])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => p.value && (
          <div key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {fmtCurrency(p.value)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cenário Base — Projeção de Crescimento */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <TrendingUp size={18} color="#e0ab42" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Projeção de Crescimento</span>
          <span style={{ fontSize: 12, color: '#555', marginLeft: 4 }}>Ritmo atual: {avgGrowth}%/mês</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Slider label="Crescimento mensal" value={growthBase} min={5} max={Math.max(150, avgGrowth + 30)} onChange={setGrowthBase} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <ResultTag
                label="Pessimista"
                value={monthsPessimista ? `+${monthsPessimista} meses` : 'Mais de 10 anos'}
                color="#ef4444"
              />
              <ResultTag
                label="Base"
                value={monthsBase ? `+${monthsBase} meses` : '—'}
                color="#e0ab42"
              />
              <ResultTag
                label="Otimista"
                value={monthsOtimista ? `+${monthsOtimista} meses` : '—'}
                color="#22c55e"
              />
            </div>
            <div style={{ background: '#0d0d0d', borderRadius: 10, padding: '14px 18px', border: '1px solid #1a1a1a', fontSize: 13, color: '#888', lineHeight: 1.7 }}>
              {accRevenue >= goal
                ? <span style={{ color: '#22c55e', fontWeight: 700 }}>Meta R$100k já atingida! 🏆</span>
                : monthsBase
                ? <>Mantendo <span style={{ color: '#e0ab42', fontWeight: 600 }}>{growthBase}%</span> de crescimento/mês, a meta de <span style={{ color: '#e0ab42', fontWeight: 600 }}>R$100k acumulado</span> será atingida em <span style={{ color: '#fff', fontWeight: 700 }}>{monthsBase} {monthsBase === 1 ? 'mês' : 'meses'}</span>.</>
                : 'Ajuste o crescimento para calcular a projeção.'
              }
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#151515" />
              <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => 'R$' + (v / 1000).toFixed(0) + 'k'} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
              <ReferenceLine y={goal} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Meta R$100k', fill: '#22c55e', fontSize: 10 }} />
              <Line type="monotone" dataKey="Realizado" stroke="#e0ab42" strokeWidth={2.5} dot={{ fill: '#e0ab42', r: 3 }} connectNulls={false} />
              <Line type="monotone" dataKey="Base" stroke="#e0ab4280" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="Otimista" stroke="#22c55e60" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cenário ACOS */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Zap size={18} color="#6366f1" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Se reduzir o ACOS</span>
          {lastMonth && <span style={{ fontSize: 12, color: '#555' }}>Atual: {lastMonth.acos}%</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Slider label="ACOS alvo" value={targetAcos} min={5} max={50} onChange={setTargetAcos} color="#6366f1" suffix="%" />
            {acosImpact && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ResultTag label="Economia em ads" value={fmtCurrency(acosImpact.adsSaving)} color="#6366f1" />
                <ResultTag label="Nova margem líquida" value={fmtPct(acosImpact.newMargin)} color={acosImpact.newMargin >= 10 ? '#22c55e' : '#eab308'} />
                <ResultTag label="Novo lucro mensal" value={fmtCurrency(acosImpact.newProfit)} color="#22c55e" />
              </div>
            )}
          </div>
          <div style={{ background: '#0d0d0d', borderRadius: 12, padding: '20px 24px', border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8 }}>Comparativo — Último mês</div>
            {lastMonth && lastDRE && acosImpact && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 11, color: '#444', paddingBottom: 10, fontWeight: 600 }}>Métrica</th>
                    <th style={{ textAlign: 'right', fontSize: 11, color: '#444', paddingBottom: 10, fontWeight: 600 }}>Atual ({lastMonth.acos}%)</th>
                    <th style={{ textAlign: 'right', fontSize: 11, color: '#6366f1', paddingBottom: 10, fontWeight: 600 }}>Com ACOS {targetAcos}%</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Gasto em Ads', curr: lastMonth.ads, next: lastMonth.ads - acosImpact.adsSaving },
                    { label: 'Lucro Líquido', curr: lastDRE.netProfit, next: acosImpact.newProfit },
                    { label: 'Margem Líquida', curr: lastDRE.netMargin, next: acosImpact.newMargin, isPct: true },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #111' }}>
                      <td style={{ padding: '10px 0', fontSize: 13, color: '#888' }}>{r.label}</td>
                      <td style={{ textAlign: 'right', fontSize: 13, color: '#aaa', padding: '10px 0' }}>
                        {r.isPct ? fmtPct(r.curr) : fmtCurrency(r.curr)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#6366f1', padding: '10px 0' }}>
                        {r.isPct ? fmtPct(r.next) : fmtCurrency(r.next)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Cenário Margem */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Target size={18} color="#22c55e" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Meta de Lucro Mensal</span>
          {lastDRE && <span style={{ fontSize: 12, color: '#555' }}>Margem atual: {lastDRE.netMargin.toFixed(1)}%</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Slider label="Margem líquida alvo" value={targetMargin} min={5} max={40} onChange={setTargetMargin} color="#22c55e" suffix="%" />
            {marginImpact && lastMonth && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ResultTag label="Lucro alvo/mês" value={fmtCurrency(marginImpact.targetMonthlyProfit)} color="#22c55e" />
                <ResultTag
                  label={marginImpact.extraProfit >= 0 ? 'Lucro extra a conquistar' : 'Já acima da meta!'}
                  value={fmtCurrency(Math.abs(marginImpact.extraProfit))}
                  color={marginImpact.extraProfit > 0 ? '#eab308' : '#22c55e'}
                />
              </div>
            )}
          </div>
          <div style={{ background: '#0d0d0d', borderRadius: 12, padding: '20px 24px', border: '1px solid #1a1a1a', fontSize: 13, color: '#888', lineHeight: 1.8 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>Como chegar lá</div>
            <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
              <li>Reduzir ACOS abaixo de <strong style={{ color: '#e0ab42' }}>20%</strong> → economiza em publicidade direto no bolso</li>
              <li>Negociar CMV: <strong style={{ color: '#e0ab42' }}>-5% no custo</strong> do produto = +3-5pp de margem bruta</li>
              <li>Aumentar ticket médio com produtos de maior valor agregado</li>
              <li>Escalar volume sem aumentar custos fixos proporcionalmente</li>
            </ul>
            {lastDRE && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#111', borderRadius: 8, border: '1px solid #1a1a1a' }}>
                <span style={{ color: '#555' }}>Margem atual: </span>
                <span style={{ color: lastDRE.netMargin >= targetMargin ? '#22c55e' : '#e0ab42', fontWeight: 700 }}>
                  {lastDRE.netMargin.toFixed(1)}%
                </span>
                <span style={{ color: '#555' }}> → alvo: </span>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>{targetMargin}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
