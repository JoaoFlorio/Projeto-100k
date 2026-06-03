import { useState, useCallback, useEffect } from 'react'
import { X, Upload, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { parseAdsCsv, parseSalesCsv } from '../../utils/csvParser'
import { calcDRE, fmtCurrency } from '../../utils/calculations'

function num(v) { return parseFloat(v) || 0 }
const uid = () => Math.random().toString(36).slice(2)

function DropZone({ label, hint, parsed, onFile }) {
  const [dragging, setDragging] = useState(false)

  const handle = file => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => onFile(e.target.result, file.name)
    reader.readAsText(file, 'UTF-8')
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]) }}
      style={{
        border: `2px dashed ${parsed ? '#22c55e' : dragging ? '#e0ab42' : '#2a2a2a'}`,
        borderRadius: 12, padding: '20px 24px', textAlign: 'center',
        background: parsed ? '#0d1f0d' : dragging ? '#1a1500' : '#0d0d0d',
        transition: 'all 0.2s', cursor: 'pointer',
      }}
      onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.csv'; inp.onchange = e => handle(e.target.files[0]); inp.click() }}
    >
      {parsed ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CheckCircle size={18} color="#22c55e" />
          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>{parsed._filename}</span>
        </div>
      ) : (
        <>
          <Upload size={20} color="#555" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>{hint}</div>
        </>
      )}
    </div>
  )
}

function Field({ label, name, value, onChange, prefix = 'R$', suffix, readOnly, highlight }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {prefix && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 12, pointerEvents: 'none' }}>{prefix}</span>}
        <input
          type="number" min="0" step="0.01" readOnly={readOnly}
          value={value} onChange={e => onChange && onChange(name, e.target.value)}
          style={{
            width: '100%', padding: prefix ? '9px 8px 9px 26px' : suffix ? '9px 26px 9px 10px' : '9px 10px',
            background: readOnly ? '#0d0d0d' : '#1a1a1a',
            border: `1px solid ${highlight ? '#e0ab4260' : '#2a2a2a'}`,
            borderRadius: 8, color: readOnly ? '#888' : '#f0f0f0', fontSize: 13, outline: 'none',
          }}
          onFocus={e => !readOnly && (e.target.style.borderColor = '#e0ab42')}
          onBlur={e => !readOnly && (e.target.style.borderColor = highlight ? '#e0ab4260' : '#2a2a2a')}
        />
        {suffix && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 12, pointerEvents: 'none' }}>{suffix}</span>}
      </div>
    </div>
  )
}

function InlineInput({ value, onChange, placeholder, width, prefix }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
      {prefix && <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>{prefix}</span>}
      <input
        type="number" min={0} step={0.01}
        value={value || ''}
        placeholder={placeholder || '0'}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        onClick={e => e.stopPropagation()}
        style={{
          width: width || 70,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid #2a2a2a',
          borderRadius: 6, color: '#f0f0f0', fontSize: 12,
          fontWeight: 600, padding: '5px 7px', outline: 'none',
          textAlign: 'right', boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#e0ab42'}
        onBlur={e => e.target.style.borderColor = '#2a2a2a'}
      />
    </div>
  )
}

function DREPreview({ data }) {
  const m = {
    revenue: num(data.revenue), returns: num(data.returns), cogs: num(data.cogs),
    amazonFees: num(data.amazonFees), prepCenter: num(data.prepCenter),
    ads: num(data.ads), shipping: num(data.shipping),
    accounting: num(data.accounting), taxes: num(data.taxes),
  }
  const d = calcDRE(m)
  return (
    <div style={{ background: '#0d0d0d', borderRadius: 10, padding: '16px 18px', border: '1px solid #1a1a1a' }}>
      <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Preview DRE</div>
      {[
        { label: 'Receita Bruta', value: m.revenue },
        { label: 'Receita Líquida', value: d.netRevenue, bold: true },
        { label: 'Lucro Bruto', value: d.grossProfit, bold: true, color: '#e0ab42' },
        { label: 'Total OpEx', value: -d.opEx },
        { label: 'Lucro Líquido', value: d.netProfit, bold: true, color: d.netProfit >= 0 ? '#22c55e' : '#ef4444' },
        { label: `Margem: ${d.netMargin.toFixed(1)}%`, value: null, pct: d.netMargin },
      ].map((r, i) => r.value !== null && (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 4 ? '1px solid #111' : 'none' }}>
          <span style={{ fontSize: 12, color: '#666' }}>{r.label}</span>
          <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 400, color: r.color || '#888' }}>
            {fmtCurrency(r.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function ImportCSVModal({ student, onSave, onSaveProductCosts, onClose }) {
  const now = new Date()
  const defaultLabel = `${MONTH_NAMES[now.getMonth()]}/${String(now.getFullYear()).slice(2)}`

  const defaults = student.defaults || {}
  const nextMonthNum = student.monthly.length + 1

  const [adsData, setAdsData] = useState(null)
  const [salesData, setSalesData] = useState(null)
  const [showCampaigns, setShowCampaigns] = useState(false)

  // Per-product cost rows — initialized from student.products catalog
  const [prodRows, setProdRows] = useState(() => {
    const products = student.products || []
    return products.map(p => ({
      id: p.id,
      name: p.name,
      units: 0,
      cost: p.cost || 0,
    }))
  })

  const [form, setForm] = useState({
    label: defaultLabel,
    revenue: '', returns: '0', cogs: '',
    amazonFees: '', prepCenter: defaults.prepCenter || '',
    ads: '', shipping: defaults.shipping || '',
    accounting: defaults.accounting || '',
    taxes: '', acos: '', units: '', avgTicket: '',
  })

  const set = (name, value) => setForm(prev => ({ ...prev, [name]: value }))

  // Derived CMV from product rows
  const autoCmv = prodRows.reduce((s, p) => s + p.units * p.cost, 0)

  // Auto-update form.cogs whenever prodRows change and autoCmv > 0
  useEffect(() => {
    const cmv = prodRows.reduce((s, p) => s + p.units * p.cost, 0)
    if (cmv > 0) {
      setForm(f => ({ ...f, cogs: cmv.toFixed(2) }))
    }
  }, [prodRows])

  // When adsData loads: populate prodRows from campaigns (using student.products costs as seed)
  useEffect(() => {
    if (!adsData) return
    const savedCosts = {}
    ;(student.products || []).forEach(p => {
      savedCosts[p.name.trim().toLowerCase()] = p.cost || 0
    })
    setProdRows(prev => {
      if (prev.length > 0) {
        // Already have rows (from student.products) — just update units by name match
        return prev.map(row => {
          const campaign = adsData.campaigns.find(c =>
            c.name.trim().toLowerCase().includes(row.name.trim().toLowerCase()) ||
            row.name.trim().toLowerCase().includes(c.name.trim().toLowerCase())
          )
          return campaign ? { ...row, units: Math.max(row.units, campaign.orders) } : row
        })
      }
      // No rows yet — populate from campaigns
      const fromCampaigns = adsData.campaigns
        .filter(c => c.spend > 0 || c.orders > 0)
        .map(c => ({
          id: uid(),
          name: c.name,
          units: c.orders,
          cost: savedCosts[c.name.trim().toLowerCase()] || 0,
        }))
      return fromCampaigns.length > 0 ? fromCampaigns : prev
    })
  }, [adsData])

  // When salesData loads and only 1 product row — auto-fill units from total
  useEffect(() => {
    if (!salesData) return
    setProdRows(prev => {
      if (prev.length === 1) {
        return prev.map(p => ({ ...p, units: salesData.units }))
      }
      return prev
    })
  }, [salesData])

  const calcAcos = (spend, revenue) =>
    revenue > 0 ? ((spend / revenue) * 100).toFixed(1) : '0.0'

  const handleAdsCsv = useCallback((text, filename) => {
    const parsed = parseAdsCsv(text)
    if (!parsed) return
    parsed._filename = filename
    setAdsData(parsed)
    setSalesData(prev => {
      if (prev) {
        setForm(f => ({
          ...f,
          ads: parsed.totalSpend.toFixed(2),
          acos: calcAcos(parsed.totalSpend, prev.revenue),
        }))
      } else {
        setForm(f => ({
          ...f,
          ads: parsed.totalSpend.toFixed(2),
          acos: parsed.blendedAcos.toFixed(1),
        }))
      }
      return prev
    })
  }, [])

  const handleSalesCsv = useCallback((text, filename) => {
    const parsed = parseSalesCsv(text)
    if (!parsed) return
    parsed._filename = filename
    setSalesData(parsed)
    const amazonFeesPct = defaults.amazonFeesPct || 15
    const fees = parsed.revenue * (amazonFeesPct / 100)
    const taxRate = defaults.taxRate || 6
    const taxes = parsed.revenue * (taxRate / 100)
    setAdsData(prev => {
      const acos = prev ? calcAcos(prev.totalSpend, parsed.revenue) : ''
      setForm(f => ({
        ...f,
        revenue: parsed.revenue.toFixed(2),
        units: String(parsed.units),
        avgTicket: parsed.avgTicket.toFixed(2),
        amazonFees: fees.toFixed(2),
        taxes: taxes.toFixed(2),
        ...(acos ? { acos } : {}),
      }))
      return prev
    })
  }, [defaults])

  // Product table helpers
  const updateProd = (id, field, val) =>
    setProdRows(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
  const removeProd = id => setProdRows(prev => prev.filter(p => p.id !== id))
  const addProd = () => setProdRows(prev => [...prev, { id: uid(), name: 'Novo produto', units: 0, cost: 0 }])

  const handleSave = () => {
    const month = {
      month: nextMonthNum,
      label: form.label || defaultLabel,
      revenue: num(form.revenue), returns: num(form.returns), cogs: num(form.cogs),
      amazonFees: num(form.amazonFees), prepCenter: num(form.prepCenter),
      ads: num(form.ads), shipping: num(form.shipping),
      accounting: num(form.accounting), taxes: num(form.taxes),
      acos: num(form.acos), units: num(form.units), avgTicket: num(form.avgTicket),
    }
    // Persist updated product costs back to student catalog
    if (onSaveProductCosts && prodRows.length > 0) {
      onSaveProductCosts(prodRows)
    }
    onSave(month, null)
    onClose()
  }

  const allReady = adsData && salesData
  const cmvFilled = autoCmv > 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px', overflowY: 'auto' }}
      onClick={onClose}
    >
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, width: '100%', maxWidth: 920, padding: 32 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>Importar da Amazon — {student.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>Sobe os dois relatórios e os dados preenchem automaticamente</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}><X size={20} /></button>
        </div>

        {/* Upload zones */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 600 }}>
              📊 Relatório de Publicidade
              <span style={{ color: '#444', fontWeight: 400, marginLeft: 6 }}>Ads → Relatórios → Publicidade</span>
            </div>
            <DropZone
              label="Solte o CSV de Ads aqui"
              hint="Baixe em: Seller Central → Publicidade → Relatórios"
              parsed={adsData}
              onFile={handleAdsCsv}
            />
            {adsData && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>Gasto total em Ads</span>
                  <span style={{ color: '#e0ab42', fontWeight: 700 }}>{fmtCurrency(adsData.totalSpend)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'flex-start' }}>
                  <span style={{ color: '#666' }}>
                    Atrib. Ads (7d)
                    <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>janela Amazon, pode incluir meses anteriores</div>
                  </span>
                  <span style={{ color: '#aaa' }}>{fmtCurrency(adsData.totalSales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>ACOS blended</span>
                  <span style={{ color: adsData.blendedAcos <= 25 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{adsData.blendedAcos.toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>Campanhas</span>
                  <button onClick={() => setShowCampaigns(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    {adsData.campaigns.length} {showCampaigns ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
                {showCampaigns && (
                  <div style={{ background: '#0d0d0d', borderRadius: 8, padding: '8px 12px', marginTop: 4 }}>
                    {adsData.campaigns.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < adsData.campaigns.length - 1 ? '1px solid #111' : 'none' }}>
                        <span style={{ fontSize: 11, color: c.status === 'ENABLED' ? '#aaa' : '#555', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: '#666' }}>{fmtCurrency(c.spend)} · ACOS {c.acos.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 600 }}>
              💰 Painel de Vendas
              <span style={{ color: '#444', fontWeight: 400, marginLeft: 6 }}>Relatórios → Painel de Vendas</span>
            </div>
            <DropZone
              label="Solte o CSV de Vendas aqui"
              hint="Baixe em: Seller Central → Relatórios → Painel de Vendas"
              parsed={salesData}
              onFile={handleSalesCsv}
            />
            {salesData && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>Faturamento</span>
                  <span style={{ color: '#e0ab42', fontWeight: 700 }}>{fmtCurrency(salesData.revenue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>Unidades vendidas</span>
                  <span style={{ color: '#aaa' }}>{salesData.units}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#666' }}>Ticket médio</span>
                  <span style={{ color: '#aaa' }}>{fmtCurrency(salesData.avgTicket)}</span>
                </div>
                {salesData.lastUpdate && (
                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>Atualizado: {salesData.lastUpdate}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        {!allReady && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#1a1500', border: '1px solid #e0ab4220', borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#888' }}>
            <AlertCircle size={15} color="#e0ab42" />
            {!adsData && !salesData ? 'Sobe os dois arquivos para preencher automaticamente' : !adsData ? 'Falta o CSV de Publicidade' : 'Falta o CSV de Vendas'}
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Identificação</div>
              <div style={{ maxWidth: 160 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>Mês de referência</label>
                <input type="text" value={form.label} onChange={e => set('label', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', fontSize: 14, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#e0ab42'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Receitas <span style={{ color: '#22c55e', textTransform: 'none', letterSpacing: 0 }}>✓ do CSV de Vendas</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Receita Bruta" name="revenue" value={form.revenue} onChange={set} highlight={!!salesData} />
                <Field label="Devoluções" name="returns" value={form.returns} onChange={set} />
              </div>
            </div>

            {/* ─── CMV por produto ─────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Custo dos Produtos (CMV)
                  </div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                    Amazon não fornece esse dado — informe o custo de cada produto abaixo
                  </div>
                </div>
                <button
                  onClick={addProd}
                  style={{
                    background: 'rgba(224,171,66,0.08)', border: '1px solid rgba(224,171,66,0.25)',
                    color: '#e0ab42', fontSize: 11, fontWeight: 700, padding: '6px 12px',
                    borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  + Adicionar produto
                </button>
              </div>

              {/* Product table */}
              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden' }}>
                {prodRows.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>📦</div>
                    <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                      {adsData
                        ? 'Nenhum produto detectado nas campanhas. Clique em "+ Adicionar produto".'
                        : 'Carregue o CSV de Ads para preencher os produtos automaticamente, ou adicione manualmente.'}
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e1e1e', background: '#0a0a0a' }}>
                          {['Produto', 'Unidades', 'Custo Unit. (R$)', 'CMV', ''].map((h, i) => (
                            <th key={i} style={{
                              textAlign: i === 0 ? 'left' : 'right',
                              padding: '8px 10px', fontSize: 9, fontWeight: 700, color: '#444',
                              letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {prodRows.map((p) => {
                          const prodCmv = p.units * p.cost
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #111' }}>
                              {/* Nome */}
                              <td style={{ padding: '7px 10px' }}>
                                <input
                                  value={p.name}
                                  onChange={e => updateProd(p.id, 'name', e.target.value)}
                                  style={{
                                    width: '100%', minWidth: 120, background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid #222', borderRadius: 5,
                                    color: '#ddd', fontSize: 11, padding: '4px 7px',
                                    outline: 'none', boxSizing: 'border-box',
                                  }}
                                  onFocus={e => e.target.style.borderColor = '#e0ab42'}
                                  onBlur={e => e.target.style.borderColor = '#222'}
                                />
                              </td>
                              {/* Unidades */}
                              <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                                <InlineInput value={p.units} onChange={v => updateProd(p.id, 'units', v)} placeholder="0" width={55} />
                              </td>
                              {/* Custo unitário */}
                              <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                                <InlineInput value={p.cost} onChange={v => updateProd(p.id, 'cost', v)} placeholder="ex: 45" width={80} prefix="R$" />
                              </td>
                              {/* CMV do produto */}
                              <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                                <div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: prodCmv > 0 ? '#f0f0f0' : '#444' }}>
                                    {prodCmv > 0 ? fmtCurrency(prodCmv) : '—'}
                                  </span>
                                  {prodCmv > 0 && (
                                    <div style={{ fontSize: 9, color: '#444', marginTop: 1 }}>
                                      {p.units}un × R$ {p.cost.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              {/* Remover */}
                              <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                                <button
                                  onClick={() => removeProd(p.id)}
                                  style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 13, padding: '2px 5px', borderRadius: 4 }}
                                  title="Remover produto"
                                >✕</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      {autoCmv > 0 && (
                        <tfoot>
                          <tr style={{ borderTop: '1px solid #222', background: '#0a0a0a' }}>
                            <td colSpan={3} style={{ padding: '9px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#555' }}>
                              CMV Total
                            </td>
                            <td style={{ padding: '9px 10px', textAlign: 'right' }}>
                              <span style={{ fontSize: 14, fontWeight: 900, color: '#e0ab42' }}>{fmtCurrency(autoCmv)}</span>
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>

              {/* CMV manual override (fallback when no products / override) */}
              <div style={{ marginTop: 10 }}>
                <Field
                  label={cmvFilled ? 'CMV total (calculado pela tabela acima — editável)' : 'CMV total (preencha a tabela acima ou informe manualmente)'}
                  name="cogs"
                  value={form.cogs}
                  onChange={set}
                  highlight={cmvFilled}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Despesas Operacionais <span style={{ color: '#22c55e', textTransform: 'none', letterSpacing: 0 }}>✓ Ads do CSV</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Fees Amazon (auto 15%)" name="amazonFees" value={form.amazonFees} onChange={set} highlight={!!salesData} />
                <Field label="Publicidade (Ads)" name="ads" value={form.ads} onChange={set} highlight={!!adsData} />
                <Field label="Prep Center" name="prepCenter" value={form.prepCenter} onChange={set} />
                <Field label="Frete saída" name="shipping" value={form.shipping} onChange={set} />
                <Field label="Contabilidade" name="accounting" value={form.accounting} onChange={set} />
                <Field label="Impostos (auto 6%)" name="taxes" value={form.taxes} onChange={set} highlight={!!salesData} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Indicadores Amazon <span style={{ color: '#22c55e', textTransform: 'none', letterSpacing: 0 }}>✓ dos CSVs</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <Field label="ACOS blended" name="acos" value={form.acos} onChange={set} prefix="" suffix="%" highlight={!!adsData} />
                <Field label="Unidades" name="units" value={form.units} onChange={set} prefix="#" highlight={!!salesData} />
                <Field label="Ticket médio" name="avgTicket" value={form.avgTicket} onChange={set} highlight={!!salesData} />
              </div>
            </div>
          </div>

          {/* Preview + botões */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DREPreview data={form} />
            {cmvFilled && (
              <div style={{ background: '#0d1a0d', border: '1px solid #22c55e20', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#22c55e' }}>
                ✅ CMV calculado: {fmtCurrency(autoCmv)}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={!form.revenue || !form.cogs}
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: form.revenue && form.cogs ? 'linear-gradient(135deg, #e0ab42, #b8892f)' : '#1a1a1a',
                border: 'none', cursor: form.revenue && form.cogs ? 'pointer' : 'not-allowed',
                color: form.revenue && form.cogs ? '#000' : '#444',
                fontSize: 15, fontWeight: 700,
              }}
            >
              Lançar Mês {nextMonthNum}
            </button>
            {(!form.revenue || !form.cogs) && (
              <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>
                {!form.revenue ? 'Suba o CSV de Vendas' : 'Preencha o CMV para continuar'}
              </div>
            )}
            <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'none', border: '1px solid #222', cursor: 'pointer', color: '#666', fontSize: 14 }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
