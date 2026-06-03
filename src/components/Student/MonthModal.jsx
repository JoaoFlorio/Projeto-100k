import { useState } from 'react'
import { X } from 'lucide-react'
import { calcDRE, fmtCurrency } from '../../utils/calculations'

const EMPTY = {
  label: '', revenue: '', returns: '', cogs: '',
  amazonFees: '', prepCenter: '', ads: '', shipping: '',
  accounting: '', taxes: '', acos: '', units: '', avgTicket: '',
}

function num(v) { return parseFloat(v) || 0 }

function Field({ label, name, value, onChange, prefix = 'R$', hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>
        {label} {hint && <span style={{ color: '#444', textTransform: 'none', letterSpacing: 0 }}>({hint})</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={e => onChange(name, e.target.value)}
          style={{
            width: '100%', padding: prefix ? '9px 10px 9px 28px' : '9px 10px',
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
            color: '#f0f0f0', fontSize: 14, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#e0ab42'}
          onBlur={e => e.target.style.borderColor = '#2a2a2a'}
        />
      </div>
    </div>
  )
}

function DREPreview({ data }) {
  const m = {
    revenue: num(data.revenue), returns: num(data.returns), cogs: num(data.cogs),
    amazonFees: num(data.amazonFees), prepCenter: num(data.prepCenter), ads: num(data.ads),
    shipping: num(data.shipping), accounting: num(data.accounting), taxes: num(data.taxes),
  }
  const d = calcDRE(m)
  const rows = [
    { label: 'Receita Bruta', value: m.revenue },
    { label: 'Receita Líquida', value: d.netRevenue, bold: true },
    { label: 'Lucro Bruto', value: d.grossProfit, bold: true, color: '#e0ab42' },
    { label: 'Resultado Operacional', value: d.opResult },
    { label: 'Lucro Líquido', value: d.netProfit, bold: true, color: d.netProfit >= 0 ? '#22c55e' : '#ef4444' },
    { label: `Margem Líquida`, value: null, pct: d.netMargin },
  ]
  return (
    <div style={{ background: '#0d0d0d', borderRadius: 10, padding: '16px 20px', border: '1px solid #1a1a1a' }}>
      <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Preview DRE</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < rows.length - 1 ? '1px solid #111' : 'none' }}>
          <span style={{ fontSize: 12, color: '#666' }}>{r.label}</span>
          <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 400, color: r.color || '#aaa' }}>
            {r.pct !== undefined ? r.pct.toFixed(1) + '%' : fmtCurrency(r.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MonthModal({ student, onSave, onClose, existingMonth = null, monthIndex = null }) {
  const nextMonthNum = (student.monthly.length + 1)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const now = new Date()
  const defaultLabel = `${monthNames[now.getMonth()]}/${String(now.getFullYear()).slice(2)}`

  const [data, setData] = useState(existingMonth ? {
    label: existingMonth.label,
    revenue: existingMonth.revenue,
    returns: existingMonth.returns,
    cogs: existingMonth.cogs,
    amazonFees: existingMonth.amazonFees,
    prepCenter: existingMonth.prepCenter,
    ads: existingMonth.ads,
    shipping: existingMonth.shipping,
    accounting: existingMonth.accounting,
    taxes: existingMonth.taxes,
    acos: existingMonth.acos,
    units: existingMonth.units,
    avgTicket: existingMonth.avgTicket,
  } : { ...EMPTY, label: defaultLabel })

  const set = (name, value) => setData(prev => ({ ...prev, [name]: value }))

  const handleSave = () => {
    const month = {
      month: existingMonth ? existingMonth.month : nextMonthNum,
      label: data.label || defaultLabel,
      revenue: num(data.revenue), returns: num(data.returns), cogs: num(data.cogs),
      amazonFees: num(data.amazonFees), prepCenter: num(data.prepCenter), ads: num(data.ads),
      shipping: num(data.shipping), accounting: num(data.accounting), taxes: num(data.taxes),
      acos: num(data.acos), units: num(data.units), avgTicket: num(data.avgTicket),
    }
    onSave(month, monthIndex)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 20px', overflowY: 'auto',
    }} onClick={onClose}>
      <div
        style={{ background: '#111', border: '1px solid #222', borderRadius: 16, width: '100%', maxWidth: 820, padding: 32 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
              {existingMonth ? 'Editar Mês' : `Lançar Mês ${nextMonthNum}`} — {student.name}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>Preencha os dados do mês de operação</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 28 }}>
          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Identificação */}
            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Identificação</div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>Mês de referência</label>
                <input
                  type="text"
                  placeholder="ex: Mai/26"
                  value={data.label}
                  onChange={e => set('label', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', fontSize: 14, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#e0ab42'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
            </div>

            {/* Receitas */}
            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Receitas</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Receita Bruta" name="revenue" value={data.revenue} onChange={set} />
                <Field label="Devoluções" name="returns" value={data.returns} onChange={set} />
              </div>
            </div>

            {/* Custos */}
            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Custo dos Produtos</div>
              <Field label="CMV (custo mercadoria + frete chegada)" name="cogs" value={data.cogs} onChange={set} />
            </div>

            {/* Despesas operacionais */}
            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Despesas Operacionais</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Fees Amazon" name="amazonFees" value={data.amazonFees} onChange={set} />
                <Field label="Prep Center" name="prepCenter" value={data.prepCenter} onChange={set} />
                <Field label="Publicidade (Ads)" name="ads" value={data.ads} onChange={set} />
                <Field label="Frete saída" name="shipping" value={data.shipping} onChange={set} />
                <Field label="Contabilidade" name="accounting" value={data.accounting} onChange={set} />
                <Field label="Impostos" name="taxes" value={data.taxes} onChange={set} />
              </div>
            </div>

            {/* Indicadores */}
            <div>
              <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Indicadores Amazon</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="ACOS" name="acos" value={data.acos} onChange={set} prefix="%" />
                <Field label="Unidades vendidas" name="units" value={data.units} onChange={set} prefix="#" />
                <Field label="Ticket médio" name="avgTicket" value={data.avgTicket} onChange={set} />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DREPreview data={data} />
            <button
              onClick={handleSave}
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: 'linear-gradient(135deg, #e0ab42, #b8892f)',
                border: 'none', cursor: 'pointer', color: '#000',
                fontSize: 15, fontWeight: 700,
              }}
            >
              {existingMonth ? 'Salvar alterações' : 'Lançar mês'}
            </button>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'none', border: '1px solid #222', cursor: 'pointer', color: '#666', fontSize: 14 }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
