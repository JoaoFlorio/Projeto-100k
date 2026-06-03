function parseBRL(str) {
  if (!str) return 0
  let s = String(str).replace(/["R$\s]/g, '')
  // BRL format: dot=milhar, comma=decimal → "4.085,55"
  // US  format: dot=decimal, sem vírgula → "145.34"
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  return parseFloat(s) || 0
}

function parsePct(str) {
  if (!str) return 0
  return parseFloat(String(str).replace(/["%\s]/g, '').replace(',', '.')) || 0
}

function parseCsvRow(line) {
  const result = []
  let inQuotes = false
  let current = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parseAdsCsv(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return null

  const headers = parseCsvRow(lines[0])
  const idx = name => headers.findIndex(h => h.includes(name))

  const spendIdx   = idx('Gastos') !== -1 ? headers.findIndex(h => h === 'Gastos' || (h.includes('Gastos') && !h.includes('ano'))) : 16
  const salesIdx   = headers.findIndex(h => h.includes('Total de vendas'))
  const acosIdx    = headers.findIndex(h => h.includes('ACOS') || h.includes('custo de publicidade'))
  const impIdx     = headers.findIndex(h => h.includes('Impressões') && !h.includes('anterior'))
  const clicksIdx  = headers.findIndex(h => h.includes('Cliques') && !h.includes('anterior') && !h.includes('Taxa'))
  const nameIdx    = 4
  const statusIdx  = 6

  let totalSpend = 0, totalSales = 0, totalImpressions = 0, totalClicks = 0
  const campaigns = []

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i])
    if (row.length < 5) continue

    const spend = parseBRL(row[spendIdx] ?? row[16])
    const sales = parseBRL(row[salesIdx] ?? row[23])
    const impressions = parseInt(row[impIdx] ?? row[11]) || 0
    const clicks = parseInt(row[clicksIdx] ?? row[13]) || 0
    const acosRaw = parsePct(row[acosIdx] ?? row[21])

    totalSpend += spend
    totalSales += sales
    totalImpressions += impressions
    totalClicks += clicks

    campaigns.push({
      name: row[nameIdx] || `Campanha ${i}`,
      status: row[statusIdx] || '',
      spend,
      sales,
      acos: acosRaw,
    })
  }

  const blendedAcos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  return { totalSpend, totalSales, blendedAcos, totalImpressions, totalClicks, ctr, campaigns }
}

export function parseSalesCsv(text) {
  const lines = text.split('\n')
  let revenue = 0, units = 0, avgTicket = 0, lastUpdate = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('Última atualização,')) {
      lastUpdate = parseCsvRow(line)[1] || ''
    }

    // Tabela de comparação — linha "Este mês, até agora"
    // A label tem vírgula sem aspas ("Este mês, até agora"), então parseCsvRow
    // gera parts[0]="Este mês", parts[1]="até agora" e o resto desloca +1:
    //   parts[2] = total de itens, parts[3] = unidades, parts[4] = vendas (quoted BRL),
    //   parts[5] = média de unidades, parts[6] = média de vendas
    if (line.startsWith('Este mês, até agora,')) {
      const parts = parseCsvRow(line)
      units = parseInt(parts[3]) || 0
      revenue = parseBRL(parts[4])
      avgTicket = units > 0 ? revenue / units : (parseFloat(parts[6]) || 0)
      break
    }
  }

  // Fallback: seção "Panorama de vendas"
  if (revenue === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().includes('Panorama de vendas')) {
        const dataLine = (lines[i + 2] || '').trim()
        if (dataLine) {
          const parts = parseCsvRow(dataLine)
          units = parseInt(parts[1]) || 0
          revenue = parseBRL(parts[2])
          avgTicket = parseFloat(parts[4]) || 0
        }
        break
      }
    }
  }

  return { revenue, units, avgTicket, lastUpdate }
}
