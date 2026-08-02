// Antes do banco, a turma ficava no localStorage de cada navegador.
// Estas funções acham o que sobrou lá para o Dashboard oferecer o resgate.
const CHAVE = 'p100k_students'
const IGNORAR = 'p100k_legado_ignorado'

export function lerLegado() {
  if (localStorage.getItem(IGNORAR) === '1') return []
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return []
    const lista = JSON.parse(bruto)
    return Array.isArray(lista) ? lista.filter(s => s && s.name) : []
  } catch {
    return []
  }
}

export const marcarLegadoResolvido = () => localStorage.setItem(IGNORAR, '1')
