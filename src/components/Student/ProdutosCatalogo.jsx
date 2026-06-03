import { useState } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'
import { fmtCurrency } from '../../utils/calculations'
import { Card } from '../ui/Card'

export default function ProdutosCatalogo({ student, onUpdateStudent }) {
  const products = student.products || []
  const defaults = student.defaults || {}

  const [newProduct, setNewProduct] = useState({ name: '', cost: '', asin: '' })
  const [editingDefaults, setEditingDefaults] = useState(false)
  const [defs, setDefs] = useState({
    amazonFeesPct: defaults.amazonFeesPct ?? 15,
    taxRate: defaults.taxRate ?? 6,
    prepCenter: defaults.prepCenter ?? '',
    shipping: defaults.shipping ?? '',
    accounting: defaults.accounting ?? '',
  })

  const addProduct = () => {
    if (!newProduct.name || !newProduct.cost) return
    const updated = [...products, { id: Date.now().toString(), name: newProduct.name, cost: parseFloat(newProduct.cost), asin: newProduct.asin }]
    onUpdateStudent(student.id, s => ({ products: updated }))
    setNewProduct({ name: '', cost: '', asin: '' })
  }

  const removeProduct = id => {
    onUpdateStudent(student.id, s => ({ products: products.filter(p => p.id !== id) }))
  }

  const saveDefaults = () => {
    onUpdateStudent(student.id, s => ({
      defaults: {
        amazonFeesPct: parseFloat(defs.amazonFeesPct) || 15,
        taxRate: parseFloat(defs.taxRate) || 6,
        prepCenter: parseFloat(defs.prepCenter) || 0,
        shipping: parseFloat(defs.shipping) || 0,
        accounting: parseFloat(defs.accounting) || 0,
      }
    }))
    setEditingDefaults(false)
  }

  const avgCost = products.length > 0 ? products.reduce((s, p) => s + p.cost, 0) / products.length : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Produtos */}
      <Card style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Catálogo de Produtos</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
              Salve o custo de cada produto para calcular CMV automaticamente na importação
            </div>
          </div>
          {products.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>Custo médio/unid.</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e0ab42' }}>{fmtCurrency(avgCost)}</div>
            </div>
          )}
        </div>

        {/* Adicionar produto */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginBottom: 20, alignItems: 'flex-end' }}>
          {[
            { label: 'Nome do Produto', key: 'name', placeholder: 'ex: Suporte Mesa Pro', type: 'text' },
            { label: 'Custo (R$)', key: 'cost', placeholder: '0,00', type: 'number' },
            { label: 'ASIN (opcional)', key: 'asin', placeholder: 'B0XXXXXXXX', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 }}>{f.label}</label>
              <input
                type={f.type} placeholder={f.placeholder}
                value={newProduct[f.key]}
                onChange={e => setNewProduct(p => ({ ...p, [f.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addProduct()}
                style={{ width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f0f0f0', fontSize: 13, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#e0ab42'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>
          ))}
          <button
            onClick={addProduct}
            disabled={!newProduct.name || !newProduct.cost}
            style={{
              padding: '9px 16px', borderRadius: 8, border: 'none', cursor: newProduct.name && newProduct.cost ? 'pointer' : 'not-allowed',
              background: newProduct.name && newProduct.cost ? '#e0ab42' : '#1a1a1a',
              color: newProduct.name && newProduct.cost ? '#000' : '#444',
              fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {/* Lista de produtos */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#444' }}>
            <Package size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>Nenhum produto cadastrado</div>
            <div style={{ fontSize: 12, marginTop: 4, color: '#333' }}>Adicione os produtos que o aluno vende com o custo de cada um</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, padding: '0 12px' }}>
              {['Produto', 'ASIN', 'Custo/unid.', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</div>
              ))}
            </div>
            {products.map(p => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, padding: '12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1a1a1a', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={14} color="#555" />
                  </div>
                  <span style={{ fontSize: 13, color: '#e0f0f0' }}>{p.name}</span>
                </div>
                <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{p.asin || '—'}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#e0ab42' }}>{fmtCurrency(p.cost)}</span>
                <button onClick={() => removeProduct(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Defaults */}
      <Card style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Valores Padrão</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>Pré-preenchidos automaticamente em cada importação</div>
          </div>
          <button
            onClick={() => editingDefaults ? saveDefaults() : setEditingDefaults(true)}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${editingDefaults ? '#e0ab42' : '#2a2a2a'}`, background: editingDefaults ? '#e0ab4215' : 'none', color: editingDefaults ? '#e0ab42' : '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {editingDefaults ? 'Salvar' : 'Editar'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {[
            { label: 'Fees Amazon', key: 'amazonFeesPct', suffix: '%', hint: 'da receita bruta' },
            { label: 'Impostos', key: 'taxRate', suffix: '%', hint: 'da receita bruta' },
            { label: 'Prep Center', key: 'prepCenter', prefix: 'R$', hint: 'fixo mensal' },
            { label: 'Frete saída', key: 'shipping', prefix: 'R$', hint: 'fixo mensal' },
            { label: 'Contabilidade', key: 'accounting', prefix: 'R$', hint: 'fixo mensal' },
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{f.label}</div>
              {editingDefaults ? (
                <div style={{ position: 'relative' }}>
                  {f.prefix && <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 12 }}>{f.prefix}</span>}
                  <input
                    type="number" value={defs[f.key]}
                    onChange={e => setDefs(d => ({ ...d, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: f.prefix ? '8px 8px 8px 24px' : '8px 24px 8px 8px', background: '#1a1a1a', border: '1px solid #e0ab4240', borderRadius: 8, color: '#f0f0f0', fontSize: 13, outline: 'none' }}
                  />
                  {f.suffix && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 12 }}>{f.suffix}</span>}
                </div>
              ) : (
                <div style={{ fontSize: 16, fontWeight: 700, color: '#aaa' }}>
                  {f.prefix || ''}{defs[f.key] || '—'}{f.suffix || ''}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#333', marginTop: 2 }}>{f.hint}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
