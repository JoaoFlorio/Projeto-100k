// Atualização automática: de tempos em tempos, busca no Oráculo o mês corrente
// de cada mentorado que tem e-mail cadastrado. É o que faz o gráfico andar
// sozinho — o botão no perfil serve para quando alguém quer o número agora.

import { q } from './db.js'
import { buscarMes, aplicarMes, oraculoConfigurado } from './oraculo.js'

const INTERVALO_MS = Number(process.env.ORACULO_SYNC_HORAS || 6) * 60 * 60 * 1000
const PAUSA_ENTRE_ALUNOS_MS = 3000   // não martelar a API do Oráculo

export async function sincronizarTurma() {
  if (!oraculoConfigurado()) return { pulado: 'sem ORACULO_PARTNER_KEY' }

  const { rows } = await q(`select id, data from students order by created_at asc`)
  const alvos = rows.filter(r => String(r.data?.oraculoEmail || '').trim())
  if (!alvos.length) return { alunos: 0 }

  const agora = new Date()
  const ano = agora.getUTCFullYear()
  const mes = agora.getUTCMonth() + 1
  let ok = 0
  const falhas = []

  for (const linha of alvos) {
    const aluno = linha.data
    try {
      const { mes: novoMes } = await buscarMes({
        email: String(aluno.oraculoEmail).trim().toLowerCase(),
        ano, mes,
        produtos: aluno.products || [],
        defaults: aluno.defaults || {},
      })

      const monthly = aplicarMes(aluno, novoMes)

      await q(`update students set data = $2, updated_at = now() where id = $1`,
        [linha.id, { ...aluno, monthly, oraculoSyncAt: new Date().toISOString() }])
      ok++
    } catch (err) {
      // Falha de um aluno não pode parar a fila (sem consentimento, sem Amazon, etc.)
      falhas.push({ nome: aluno.name, motivo: err.message })
    }
    await new Promise(r => setTimeout(r, PAUSA_ENTRE_ALUNOS_MS))
  }

  const resumo = { alunos: alvos.length, atualizados: ok, falhas }
  console.log(`[oraculo] sincronização: ${ok}/${alvos.length} atualizados` +
    (falhas.length ? ` | falhas: ${falhas.map(f => `${f.nome} (${f.motivo})`).join('; ')}` : ''))
  return resumo
}

export function agendarSincronizacao() {
  if (!oraculoConfigurado()) {
    console.log('[oraculo] integração desligada (sem ORACULO_PARTNER_KEY)')
    return
  }
  // Primeira rodada 2 min depois de subir: deixa o deploy assentar antes.
  setTimeout(() => {
    sincronizarTurma().catch(err => console.error('[oraculo] falha na sincronização:', err.message))
    setInterval(() => {
      sincronizarTurma().catch(err => console.error('[oraculo] falha na sincronização:', err.message))
    }, INTERVALO_MS)
  }, 2 * 60 * 1000)

  console.log(`[oraculo] sincronização automática a cada ${INTERVALO_MS / 3600000}h`)
}
