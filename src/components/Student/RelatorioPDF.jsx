import { forwardRef } from 'react'
import { calcDRE, calcHealthScore, fmtCurrency, fmtPct } from '../../utils/calculations'
import { ROADMAP_PHASES } from '../../data/mockData'

/* ── Análise de gargalos e dicas ───────────────────────────── */
export function analyzeBottlenecks(student) {
  const { monthly } = student
  if (!monthly.length) return []

  const lastMonth = monthly[monthly.length - 1]
  const lastDRE = calcDRE(lastMonth)
  const insights = []

  // ACOS
  if (lastMonth.acos > 30) {
    insights.push({
      severity: 'critical',
      area: 'Publicidade — ACOS Crítico',
      summary: `ACOS em ${lastMonth.acos}% está ${(lastMonth.acos - 30).toFixed(0)}pp acima do limite seguro de 30%.`,
      tips: [
        'Pausar imediatamente campanhas com ACOS > 50% e redistribuir orçamento para as que convertem.',
        'Aplicar match type Exact nas top 10 keywords e negativar termos sem conversão nas últimas 4 semanas.',
        'Revisar o preço de venda: um aumento de 5-10% pode reduzir o ACOS sem mexer nos bids.',
        'Checar se o listing tem fotos profissionais e bullet points com os gatilhos certos — CTR baixo eleva ACOS.',
      ],
    })
  } else if (lastMonth.acos > 20) {
    insights.push({
      severity: 'warning',
      area: 'Publicidade — ACOS Elevado',
      summary: `ACOS em ${lastMonth.acos}% está acima do ideal (15-20%). Cada pp de melhoria vira margem.`,
      tips: [
        'Reduzir bids das campanhas com ACOS entre 25-40% em 15% e monitorar por 7 dias.',
        'Criar campanhas de Product Targeting nos ASINs dos concorrentes diretos.',
        'Usar relatório de Search Terms semanalmente para negativar termos de baixa conversão.',
      ],
    })
  }

  // Margem bruta / CMV
  if (lastDRE.grossMargin < 30) {
    insights.push({
      severity: 'critical',
      area: 'Produto — Margem Bruta Baixa',
      summary: `Margem bruta de ${lastDRE.grossMargin.toFixed(1)}% indica custo de produto alto ou preço de venda baixo.`,
      tips: [
        'Negociar com o fornecedor: apresente histórico de pedidos e proponha desconto por volume (min. 10%).',
        'Testar reajuste de preço de 8-12% — use Seller Central A/B ou monitore a Buy Box por 14 dias.',
        'Avaliar fornecedor alternativo (Alibaba, sourcing agent) para benchmarking de custo.',
        'Revisar variações: produtos com margem < 20% individualmente devem ser descontinuados.',
      ],
    })
  } else if (lastDRE.grossMargin < 40) {
    insights.push({
      severity: 'warning',
      area: 'Produto — Margem Bruta Moderada',
      summary: `Margem bruta de ${lastDRE.grossMargin.toFixed(1)}% está dentro do tolerável, mas há espaço para melhoria.`,
      tips: [
        'Meta de longo prazo: margem bruta acima de 45% para absorver OpEx com conforto.',
        'Pesquisar sourcing alternativo para o próximo pedido — mesmo -5% no custo muda o jogo.',
      ],
    })
  }

  // Margem líquida
  if (lastDRE.netMargin < 5 && lastDRE.netMargin >= 0) {
    insights.push({
      severity: 'critical',
      area: 'Resultado — Margem Líquida Crítica',
      summary: `Margem líquida de ${lastDRE.netMargin.toFixed(1)}% significa que o negócio está no limite da viabilidade.`,
      tips: [
        'Prioridade #1: reduzir ACOS para 20-25% — isso sozinho pode adicionar 5-8pp na margem.',
        'Cortar toda despesa não essencial (prep center externo, ferramentas sem uso, etc.).',
        'Não escalar volume enquanto a margem estiver abaixo de 8% — escala amplifica o prejuízo.',
      ],
    })
  } else if (lastDRE.netMargin < 10) {
    insights.push({
      severity: 'warning',
      area: 'Resultado — Margem Líquida Abaixo da Meta',
      summary: `Margem de ${lastDRE.netMargin.toFixed(1)}% está abaixo do benchmark de 10-15% para Amazon FBA.`,
      tips: [
        'Sequência de prioridades: 1° reduzir ACOS, 2° negociar CMV, 3° revisar fees fixas.',
        'Cada 5pp de redução no ACOS se converte diretamente em +5pp de margem líquida.',
        'Revisar prep center e frete — terceirização às vezes é mais cara do que in-house.',
      ],
    })
  }

  // Crescimento
  if (monthly.length >= 2) {
    const prev = monthly[monthly.length - 2]
    const growthPct = prev.revenue > 0 ? ((lastMonth.revenue - prev.revenue) / prev.revenue) * 100 : 0
    if (growthPct < -5) {
      insights.push({
        severity: 'critical',
        area: 'Crescimento — Queda de Faturamento',
        summary: `Faturamento caiu ${Math.abs(growthPct).toFixed(1)}% vs. mês anterior. Ação imediata necessária.`,
        tips: [
          'Verificar estoque: ruptura ou baixo inventário derruba ranking e vendas rápido.',
          'Checar Buy Box: outro seller pode ter tomado a caixa de compra.',
          'Revisar avaliações recentes — uma onda de reviews negativos afeta conversão.',
          'Conferir se a listagem está ativa e sem supressão da Amazon.',
        ],
      })
    } else if (growthPct < 10 && monthly.length <= 3) {
      insights.push({
        severity: 'warning',
        area: 'Crescimento — Abaixo do Esperado',
        summary: `Crescimento de ${growthPct.toFixed(1)}% no último mês está aquém do ritmo necessário para bater R$100k.`,
        tips: [
          'Aumentar orçamento diário das campanhas com ACOS < 20% em 20-30%.',
          'Lançar variação de produto (cor, tamanho) para ampliar cobertura de search.',
          'Otimizar imagens principais do listing — a imagem é o maior driver de CTR.',
        ],
      })
    }
  }

  // Fees Amazon proporcionais
  const feesPct = lastDRE.netRevenue > 0 ? (lastMonth.amazonFees / lastDRE.netRevenue) * 100 : 0
  if (feesPct > 22) {
    insights.push({
      severity: 'warning',
      area: 'Fees Amazon — Proporção Alta',
      summary: `Fees representam ${feesPct.toFixed(1)}% da receita. Rever categoria ou dimensões pode reduzir.`,
      tips: [
        'Verificar se a categoria cadastrada está correta — erros de categoria geram overcharge.',
        'Medir e pesar o produto embalado: se ultrapassar threshold de tamanho, muda de faixa.',
        'Considerar renegociação de categoria de produto no painel de vendor se aplicável.',
      ],
    })
  }

  // Tudo saudável
  if (!insights.length) {
    insights.push({
      severity: 'ok',
      area: 'Operação Saudável',
      summary: 'Todos os indicadores estão dentro dos parâmetros ideais. Foco agora é em escala.',
      tips: [
        'Momento certo para lançar um segundo produto ou variação — base de operação está sólida.',
        'Documentar processos de sourcing, campanhas e logística para replicar no novo SKU.',
        'Explorar expansão para outro marketplace (Mercado Livre, Shopee) para diversificar receita.',
        'Manter vigilância semanal de reviews e estoque — o risco de queda sobe com o volume.',
      ],
    })
  }

  return insights
}

/* ── Componente principal ──────────────────────────────────── */
const RelatorioPDF = forwardRef(({ student }, ref) => {
  const { monthly, sessions, roadmap, milestones, goal, currentMonth } = student
  const lastMonth = monthly[monthly.length - 1]
  const lastDRE = lastMonth ? calcDRE(lastMonth) : null
  const health = calcHealthScore(monthly)
  const accRevenue = monthly.reduce((s, m) => s + m.revenue, 0)
  const goalPct = Math.min(100, (accRevenue / goal) * 100)
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const insights = analyzeBottlenecks(student)

  const recentSessions = [...(sessions || [])].reverse().slice(0, 3)

  const statusColor = { done: '#22c55e', active: '#e0ab42', pending: '#ccc' }

  const severityStyle = {
    critical: { bg: '#fff5f5', border: '#ef4444', tag: '#ef4444', tagBg: '#fee2e2', label: 'CRÍTICO' },
    warning:  { bg: '#fffbf0', border: '#e0ab42', tag: '#b8892f', tagBg: '#fef3c7', label: 'ATENÇÃO' },
    ok:       { bg: '#f0fdf4', border: '#22c55e', tag: '#15803d', tagBg: '#dcfce7', label: 'SAUDÁVEL' },
  }

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', background: '#fff', color: '#111', padding: '40px 48px', minHeight: '100vh' }}>
      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pdf-pagebreak { page-break-before: always; }
        }
        .pdf-table { width: 100%; border-collapse: collapse; }
        .pdf-table td, .pdf-table th { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
        .pdf-table th { background: #f5f5f5; font-weight: 600; text-align: left; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 18, borderBottom: '3px solid #e0ab42' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#e0ab42', letterSpacing: 3, marginBottom: 2 }}>PROJETO</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1 }}>100K</div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 3 }}>Relatório Semanal de Desempenho</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{student.name}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
            {ROADMAP_PHASES[currentMonth - 1]?.title} (M{currentMonth}) · Gerado em {today}
          </div>
          <div style={{ marginTop: 6, display: 'inline-block', padding: '3px 10px', background: health >= 70 ? '#f0fdf4' : health >= 45 ? '#fffbf0' : '#fff5f5', border: `1px solid ${health >= 70 ? '#22c55e' : health >= 45 ? '#e0ab42' : '#ef4444'}`, borderRadius: 20, fontSize: 11, fontWeight: 700, color: health >= 70 ? '#15803d' : health >= 45 ? '#b8892f' : '#dc2626' }}>
            Score de Saúde: {health}/100 — {health >= 70 ? 'Ótimo' : health >= 45 ? 'Regular' : 'Atenção'}
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Fat. Acumulado', value: fmtCurrency(accRevenue), color: '#e0ab42' },
          { label: 'Lucro Últ. Mês', value: lastDRE ? fmtCurrency(lastDRE.netProfit) : '—', color: lastDRE?.netProfit >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Margem Líquida', value: lastDRE ? fmtPct(lastDRE.netMargin) : '—', color: lastDRE?.netMargin >= 10 ? '#22c55e' : '#e0ab42' },
          { label: 'ACOS', value: lastMonth ? lastMonth.acos + '%' : '—', color: lastMonth?.acos <= 25 ? '#22c55e' : '#ef4444' },
          { label: 'Meta R$100k', value: goalPct.toFixed(0) + '%', color: goalPct >= 100 ? '#22c55e' : '#e0ab42' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Diagnóstico de Gargalos ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
          Diagnóstico da Operação
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {insights.map((ins, i) => {
            const s = severityStyle[ins.severity]
            return (
              <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}30`, borderLeft: `4px solid ${s.border}`, borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: s.tag, background: s.tagBg, padding: '2px 7px', borderRadius: 4 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{ins.area}</span>
                </div>
                <p style={{ fontSize: 12, color: '#555', margin: '0 0 10px', lineHeight: 1.5 }}>{ins.summary}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {ins.tips.map((tip, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: s.tag, marginTop: 1, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 11, color: '#444', lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Roadmap ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 }}>Progresso da Meta</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#e0ab42' }}>{goalPct.toFixed(0)}%</div>
          <div style={{ width: '100%', height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${goalPct}%`, background: '#e0ab42', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>{fmtCurrency(accRevenue)} de {fmtCurrency(goal)}</div>
        </div>
        <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Jornada 6 Meses</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ROADMAP_PHASES.map(p => {
              const status = roadmap[p.id] || 'pending'
              const color = statusColor[status]
              return (
                <div key={p.id} style={{ flex: 1, textAlign: 'center', padding: '7px 3px', background: status === 'pending' ? '#fff' : color + '15', border: `1px solid ${color}`, borderRadius: 7 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color }}>{p.id}</div>
                  <div style={{ fontSize: 9, color: '#888', marginTop: 1 }}>{p.title}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── DRE por mês ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
          Evolução Mensal
        </div>
        <table className="pdf-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th style={{ textAlign: 'right' }}>Rec. Bruta</th>
              <th style={{ textAlign: 'right' }}>CMV</th>
              <th style={{ textAlign: 'right' }}>Mg. Bruta</th>
              <th style={{ textAlign: 'right' }}>OpEx</th>
              <th style={{ textAlign: 'right' }}>Lucro Líq.</th>
              <th style={{ textAlign: 'right' }}>Mg. Líq.</th>
              <th style={{ textAlign: 'right' }}>ACOS</th>
              <th style={{ textAlign: 'right' }}>Crescimento</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m, i) => {
              const d = calcDRE(m)
              const prev = monthly[i - 1]
              const growth = prev ? ((m.revenue - prev.revenue) / prev.revenue * 100) : null
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                  <td style={{ fontWeight: 600, color: '#e0ab42' }}>{m.label}</td>
                  <td style={{ textAlign: 'right' }}>{fmtCurrency(m.revenue)}</td>
                  <td style={{ textAlign: 'right', color: '#ef4444' }}>-{fmtCurrency(m.cogs)}</td>
                  <td style={{ textAlign: 'right', color: d.grossMargin >= 35 ? '#15803d' : '#b8892f', fontWeight: 600 }}>{d.grossMargin.toFixed(1)}%</td>
                  <td style={{ textAlign: 'right', color: '#ef4444' }}>-{fmtCurrency(d.opEx)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: d.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{fmtCurrency(d.netProfit)}</td>
                  <td style={{ textAlign: 'right', color: d.netMargin >= 10 ? '#22c55e' : '#e0ab42' }}>{fmtPct(d.netMargin)}</td>
                  <td style={{ textAlign: 'right', color: m.acos <= 25 ? '#22c55e' : '#ef4444' }}>{m.acos}%</td>
                  <td style={{ textAlign: 'right', color: growth === null ? '#bbb' : growth >= 0 ? '#22c55e' : '#ef4444' }}>
                    {growth === null ? '—' : (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── DRE detalhado último mês ── */}
      {lastMonth && lastDRE && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
            DRE Detalhado — {lastMonth.label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <table className="pdf-table">
              <tbody>
                {[
                  { label: 'Receita Bruta', value: lastMonth.revenue, bold: true },
                  { label: 'Devoluções', value: -lastMonth.returns, indent: true },
                  { label: 'Receita Líquida', value: lastDRE.netRevenue, bold: true, divider: true },
                  { label: 'CMV', value: -lastMonth.cogs, indent: true },
                  { label: 'Lucro Bruto', value: lastDRE.grossProfit, bold: true, color: '#b8892f', divider: true },
                  { label: `Margem Bruta: ${lastDRE.grossMargin.toFixed(1)}%`, value: null },
                ].filter(r => r.value !== null).map((r, i) => (
                  <tr key={i}>
                    <td style={{ paddingLeft: r.indent ? 24 : 12, fontWeight: r.bold ? 700 : 400, color: r.color || '#333', borderTop: r.divider ? '2px solid #ddd' : undefined }}>
                      {r.label}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: r.bold ? 700 : 400, color: r.color || (r.value < 0 ? '#ef4444' : '#333'), borderTop: r.divider ? '2px solid #ddd' : undefined }}>
                      {fmtCurrency(r.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="pdf-table">
              <tbody>
                {[
                  { label: 'Fees Amazon', value: -lastMonth.amazonFees },
                  { label: 'Prep Center', value: -lastMonth.prepCenter },
                  { label: 'Publicidade (Ads)', value: -lastMonth.ads },
                  { label: 'Frete', value: -lastMonth.shipping },
                  { label: 'Contabilidade', value: -lastMonth.accounting },
                  { label: 'Impostos', value: -lastMonth.taxes },
                  { label: 'LUCRO LÍQUIDO', value: lastDRE.netProfit, bold: true, color: lastDRE.netProfit >= 0 ? '#22c55e' : '#ef4444' },
                  { label: `Margem Líquida: ${lastDRE.netMargin.toFixed(1)}%`, value: null },
                ].filter(r => r.value !== null).map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: r.bold ? 700 : 400, color: r.color || '#333', borderTop: r.bold ? '2px solid #ddd' : undefined }}>
                      {r.label}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: r.bold ? 700 : 400, color: r.color || (r.value < 0 ? '#ef4444' : '#333'), borderTop: r.bold ? '2px solid #ddd' : undefined }}>
                      {fmtCurrency(r.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Últimas Sessões ── */}
      {recentSessions.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
            Últimas Sessões de Mentoria
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentSessions.map((s, i) => (
              <div key={i} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>
                      {new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: 10, color: '#999' }}>{s.duration} min</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.done ? '#15803d' : '#b8892f', background: s.done ? '#dcfce7' : '#fef3c7', padding: '2px 8px', borderRadius: 4 }}>
                    {s.done ? 'Realizada' : 'Próxima'}
                  </span>
                </div>
                {s.notes && <p style={{ fontSize: 11, color: '#666', margin: '0 0 6px', lineHeight: 1.5 }}>{s.notes}</p>}
                {s.actions?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {s.actions.map((a, j) => (
                      <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 10, color: '#e0ab42', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                        <span style={{ fontSize: 10, color: '#555' }}>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Marcos ── */}
      {milestones?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
            Marcos Conquistados
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {milestones.map((ms, i) => (
              <div key={i} style={{ padding: '8px 14px', background: '#fffbf0', border: '1px solid #e0ab4260', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#b8892f' }}>{ms.title}</div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{new Date(ms.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rodapé ── */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#bbb' }}>
        <span>Projeto 100K · Mentoria Individual JF · joaoflorio.com.br</span>
        <span>Gerado em {today}</span>
      </div>
    </div>
  )
})

RelatorioPDF.displayName = 'RelatorioPDF'
export default RelatorioPDF
