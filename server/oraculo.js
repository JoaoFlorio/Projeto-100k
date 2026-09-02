// Cliente da portinha de parceiro do Oráculo (/api/partner).
// Lê a DRE e os Ads de um mentorado que autorizou a mentoria, e traduz para o
// formato de mês do 100K. Só leitura: nada aqui escreve no Oráculo.

const BASE = (process.env.ORACULO_API_URL || 'https://oraculo-backend-production.up.railway.app').replace(/\/$/, '')
const KEY = process.env.ORACULO_PARTNER_KEY || ''

export const oraculoConfigurado = () => Boolean(KEY)

async function get(caminho, params) {
  const url = new URL(BASE + caminho)
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '') url.searchParams.set(k, String(v))

  const res = await fetch(url, {
    headers: { 'x-partner-key': KEY },
    signal: AbortSignal.timeout(40000),   // a DRE pode demorar quando o cache está frio
  })

  let corpo = null
  try { corpo = await res.json() } catch { /* resposta sem json */ }

  if (!res.ok) {
    const erro = new Error(corpo?.error || `Oráculo respondeu ${res.status}`)
    erro.status = res.status
    erro.corpo = corpo
    throw erro
  }
  return corpo
}

// Primeiro e último dia do mês (YYYY-MM), no formato que a portinha espera
export function periodoDoMes(ano, mes) {
  const inicio = new Date(Date.UTC(ano, mes - 1, 1))
  const fim = new Date(Date.UTC(ano, mes, 0, 23, 59, 59))
  return { from: inicio.toISOString().slice(0, 10), to: fim.toISOString().slice(0, 10) }
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const r2 = (v) => Math.round(num(v) * 100) / 100

/**
 * Traz o mês de um mentorado já no formato do 100K.
 * O CMV não vem da Amazon (ela não sabe quanto custou o produto): é calculado
 * cruzando as unidades vendidas por SKU com o catálogo de custos do aluno.
 */
export async function buscarMes({ email, ano, mes, produtos = [], defaults = {} }) {
  const { from, to } = periodoDoMes(ano, mes)

  const finance = await get('/api/partner/finance', { email, from, to })
  const linhas = finance?.linhas || {}

  // Ads: valor cheio da Advertising API. Se a conta não tem Ads conectado, o
  // gasto que já veio dentro da DRE é o que temos.
  let ads = num(linhas.ads)
  let acos = null
  try {
    const rel = await get('/api/partner/ads', { email, from, to })
    if (rel?.connected && Number.isFinite(Number(rel.spend))) {
      ads = num(rel.spend)
      if (Number.isFinite(Number(rel.acos))) acos = num(rel.acos)
    }
  } catch { /* sem Ads: segue com o gasto da DRE */ }

  const revenue = r2(linhas.receitaBruta)
  const units = Math.round(num(finance.unidades))

  // ACOS: o do relatório de Ads quando existe; senão, gasto sobre receita
  if (acos == null) acos = revenue > 0 ? r2((ads / revenue) * 100) : 0

  const custoPorSku = new Map(
    produtos.filter(p => p?.asin || p?.name).map(p => [String(p.asin || p.name).toUpperCase(), num(p.cost)])
  )
  let cogs = 0
  let skusSemCusto = []
  for (const p of finance.produtos || []) {
    const chave = String(p.sku || '').toUpperCase()
    const custo = custoPorSku.get(chave)
    if (custo == null) { if (p.sku) skusSemCusto.push(p.sku); continue }
    cogs += custo * num(p.units)
  }

  const taxRate = num(defaults.taxRate ?? 6)

  return {
    mes: {
      // `month` (mês de operação da mentoria) NÃO sai daqui: quem grava decide,
      // olhando a sequência do aluno. Aqui o mês é só do calendário.
      label: new Date(Date.UTC(ano, mes - 1, 1))
        .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
        .replace('.', '').replace(/^./, c => c.toUpperCase()).replace(' de ', '/'),
      revenue,
      returns: r2(linhas.devolucoes),
      cogs: r2(cogs),
      // Tudo que a Amazon cobra, junto — é assim que o card do 100K mostra
      amazonFees: r2(num(linhas.comissao) + num(linhas.taxaPrograma) + num(linhas.fba)
                   + num(linhas.armazenagem) + num(linhas.assinatura) + num(linhas.outrasTaxas)),
      prepCenter: num(defaults.prepCenter),
      ads: r2(ads),
      shipping: num(defaults.shipping),
      accounting: num(defaults.accounting),
      taxes: r2(revenue * taxRate / 100),
      acos: r2(acos),
      units,
      avgTicket: units > 0 ? r2(revenue / units) : 0,
    },
    // Para a tela ser honesta sobre o que foi medido e o que foi assumido
    aviso: skusSemCusto.length
      ? `CMV parcial: ${skusSemCusto.length} SKU(s) vendidos não têm custo no catálogo (${skusSemCusto.slice(0, 3).join(', ')}${skusSemCusto.length > 3 ? '…' : ''}).`
      : null,
    fonte: finance.fonte || 'oraculo',
  }
}

/** Liga a autorização do mentorado no Oráculo (flag partner_mentoria). */
export async function autorizar(email) {
  const res = await fetch(BASE + '/api/partner/consent', {
    method: 'POST',
    headers: { 'x-partner-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, authorized: true }),
    signal: AbortSignal.timeout(15000),
  })
  const corpo = await res.json().catch(() => null)
  if (!res.ok) {
    const erro = new Error(corpo?.error || `Oráculo respondeu ${res.status}`)
    erro.status = res.status
    throw erro
  }
  return corpo
}

/**
 * Encaixa o mês vindo do Oráculo no histórico do aluno.
 * - mês que já existe (mesmo rótulo): atualiza os números e PRESERVA o número do
 *   mês de operação e o que a mentoria lançou na mão (prep center, frete...).
 * - mês novo: entra no fim da fila, como o lançamento manual faz.
 */
export function aplicarMes(aluno, novoMes) {
  const monthly = Array.isArray(aluno.monthly) ? [...aluno.monthly] : []
  const i = monthly.findIndex(m => m.label === novoMes.label)

  if (i >= 0) monthly[i] = { ...monthly[i], ...novoMes, month: monthly[i].month }
  else monthly.push({ ...novoMes, month: monthly.length + 1 })

  return monthly
}
