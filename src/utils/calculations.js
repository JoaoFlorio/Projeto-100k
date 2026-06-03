export function calcDRE(m) {
  const netRevenue = m.revenue - m.returns
  const grossProfit = netRevenue - m.cogs
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0
  const opEx = m.amazonFees + m.prepCenter + m.ads + m.shipping + m.accounting
  const opResult = grossProfit - opEx
  const netProfit = opResult - m.taxes
  const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0
  return { netRevenue, grossProfit, grossMargin, opEx, opResult, netProfit, netMargin }
}

export function calcTotals(monthly) {
  return monthly.reduce((acc, m) => {
    const d = calcDRE(m)
    return {
      revenue: acc.revenue + m.revenue,
      netProfit: acc.netProfit + d.netProfit,
      units: acc.units + m.units,
    }
  }, { revenue: 0, netProfit: 0, units: 0 })
}

export function calcHealthScore(monthly) {
  if (!monthly.length) return 0
  const last = monthly[monthly.length - 1]
  const dre = calcDRE(last)
  let score = 0
  // Margem líquida (max 40pts)
  if (dre.netMargin >= 20) score += 40
  else if (dre.netMargin >= 15) score += 30
  else if (dre.netMargin >= 10) score += 20
  else if (dre.netMargin >= 5) score += 10
  // ACOS (max 30pts)
  if (last.acos <= 15) score += 30
  else if (last.acos <= 20) score += 22
  else if (last.acos <= 25) score += 14
  else if (last.acos <= 35) score += 6
  // Crescimento (max 30pts)
  if (monthly.length >= 2) {
    const prev = monthly[monthly.length - 2]
    const growth = prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : 0
    if (growth >= 50) score += 30
    else if (growth >= 30) score += 22
    else if (growth >= 15) score += 14
    else if (growth >= 0) score += 6
  } else {
    score += 15
  }
  return Math.min(100, score)
}

export function fmtCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export function fmtPct(v) {
  return v.toFixed(1) + '%'
}

export function getGoalPct(monthly, goal) {
  const total = monthly.reduce((s, m) => s + m.revenue, 0)
  return Math.min(100, (total / goal) * 100)
}
