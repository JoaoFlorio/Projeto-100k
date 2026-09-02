// Testa a tradução Oráculo → mês do 100K sem depender de nada externo:
// sobe um Oráculo falso com o MESMO formato de payload da portinha real.
//
//   node scripts/testa-oraculo.mjs

import { createServer } from 'node:http'
import assert from 'node:assert/strict'

const PORTA = 45990
const CHAVE = 'chave-de-teste'

process.env.ORACULO_API_URL = `http://localhost:${PORTA}`
process.env.ORACULO_PARTNER_KEY = CHAVE

const PAYLOAD_FINANCE = {
  connected: true,
  linhas: {
    receitaBruta: 48250.75, devolucoes: 1320.40, receitaLiquida: 46930.35,
    comissao: 7237.61, taxaPrograma: 0, fba: 5790.09,
    armazenagem: 412.30, assinatura: 19.90, outrasTaxas: 88.15,
    ads: 3100.00,
  },
  liqMarketplace: 33814.50, vendas: 262, unidades: 275,
  produtos: [
    { sku: 'B0AAA111', units: 150, receita: 27000 },
    { sku: 'B0BBB222', units: 100, receita: 18250.75 },
    { sku: 'B0SEMCUSTO', units: 25, receita: 3000 },
  ],
  fonte: 'sp-api:finances',
}

let adsLigado = true
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  const j = (s, o) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)) }
  if (req.headers['x-partner-key'] !== CHAVE) return j(401, { error: 'não autorizado' })
  if (url.searchParams.get('email') === 'semconsentimento@x.com')
    return j(403, { error: 'cliente não autorizou o acesso (mentoria) aos dados do Oráculo', authorized: false })
  if (url.pathname === '/api/partner/finance') return j(200, PAYLOAD_FINANCE)
  if (url.pathname === '/api/partner/ads') {
    return adsLigado ? j(200, { connected: true, spend: 3450.80, sales: 21000, acos: 16.4 })
                     : j(200, { connected: false })
  }
  j(404, { error: 'rota inexistente' })
})
await new Promise(r => server.listen(PORTA, r))

const { buscarMes, aplicarMes, periodoDoMes } = await import('../server/oraculo.js')

let ok = 0
const t = (nome, fn) => { try { fn(); console.log('  OK    ' + nome); ok++ } catch (e) { console.log('  FALHA ' + nome + ' — ' + e.message); process.exitCode = 1 } }

const CATALOGO = [
  { id: 'p1', name: 'Produto A', cost: 55, asin: 'B0AAA111' },
  { id: 'p2', name: 'Produto B', cost: 80, asin: 'B0BBB222' },
]

console.log('== período do mês ==')
const p = periodoDoMes(2026, 2)
t('fevereiro vai do dia 1 ao 28', () => {
  assert.equal(p.from, '2026-02-01')
  assert.equal(p.to, '2026-02-28')
})

console.log('== tradução dos números ==')
const r = await buscarMes({ email: 'cliente@x.com', ano: 2026, mes: 7, produtos: CATALOGO, defaults: { taxRate: 6, prepCenter: 300, shipping: 150, accounting: 200 } })
const m = r.mes

t('faturamento vem da receita bruta', () => assert.equal(m.revenue, 48250.75))
t('devoluções vêm da linha de devoluções', () => assert.equal(m.returns, 1320.40))
t('unidades vêm do total do período', () => assert.equal(m.units, 275))
t('ticket médio = receita ÷ unidades', () => assert.equal(m.avgTicket, 175.46))
t('fees Amazon somam comissão+FBA+armazenagem+assinatura+outras', () => assert.equal(m.amazonFees, 13548.05))
t('CMV cruza unidades por SKU com o catálogo', () => assert.equal(m.cogs, 16250))   // 150×55 + 100×80
t('SKU sem custo no catálogo NÃO entra no CMV, e é avisado', () => {
  assert.match(r.aviso, /B0SEMCUSTO/)
})
t('ads usa o valor cheio da Advertising API, não o da DRE', () => assert.equal(m.ads, 3450.80))
t('ACOS vem do relatório de Ads', () => assert.equal(m.acos, 16.4))
t('impostos = alíquota do painel sobre a receita', () => assert.equal(m.taxes, 2895.05))
t('custos que a Amazon não conhece vêm do painel', () => {
  assert.equal(m.prepCenter, 300); assert.equal(m.shipping, 150); assert.equal(m.accounting, 200)
})
t('o mês de operação NÃO é decidido aqui', () => assert.equal(m.month, undefined))

console.log('== sem Ads conectado ==')
adsLigado = false
const semAds = await buscarMes({ email: 'cliente@x.com', ano: 2026, mes: 7, produtos: CATALOGO, defaults: {} })
t('cai para o gasto de Ads que veio na DRE', () => assert.equal(semAds.mes.ads, 3100))
t('e calcula o ACOS na mão', () => assert.equal(semAds.mes.acos, 6.42))  // 3100/48250.75
adsLigado = true

console.log('== encaixe no histórico do aluno ==')
t('mês novo entra como o próximo mês de operação', () => {
  const monthly = aplicarMes({ monthly: [{ label: 'Jun/26', month: 1 }] }, { label: 'Jul/26', revenue: 10 })
  assert.equal(monthly.length, 2)
  assert.equal(monthly[1].month, 2)
})
t('mês repetido atualiza sem duplicar e mantém o número do mês', () => {
  const monthly = aplicarMes({ monthly: [{ label: 'Jun/26', month: 1, revenue: 5, prepCenter: 300 }] }, { label: 'Jun/26', revenue: 99 })
  assert.equal(monthly.length, 1)
  assert.equal(monthly[0].month, 1)
  assert.equal(monthly[0].revenue, 99)
})
t('o que a mentoria lançou na mão sobrevive à atualização', () => {
  const monthly = aplicarMes({ monthly: [{ label: 'Jun/26', month: 1, prepCenter: 300, accounting: 200 }] }, { label: 'Jun/26', revenue: 99 })
  assert.equal(monthly[0].prepCenter, 300)
  assert.equal(monthly[0].accounting, 200)
})
t('aluno sem histórico nenhum começa no mês 1', () => {
  assert.equal(aplicarMes({}, { label: 'Jan/26' })[0].month, 1)
})

console.log('== erros ==')
await (async () => {
  try {
    await buscarMes({ email: 'semconsentimento@x.com', ano: 2026, mes: 7 })
    console.log('  FALHA sem consentimento deveria estourar'); process.exitCode = 1
  } catch (e) {
    t('sem consentimento vira erro 403 com a mensagem do Oráculo', () => {
      assert.equal(e.status, 403)
      assert.match(e.message, /não autorizou/)
    })
  }
})()

server.close()
console.log(`\n${ok} verificações passaram`)
