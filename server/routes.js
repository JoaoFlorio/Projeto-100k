import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { q, pool } from './db.js'
import {
  hashPassword, checkPassword, createSession, destroySession,
  setSessionCookie, clearSessionCookie, getSessionToken, requireAuth,
  registrarTentativa, bloqueado, limparTentativas, hashToken,
} from './auth.js'

export const api = Router()

const paraStudent = (row) => ({ ...row.data, id: row.id })
const ehUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v))

// ---------------- sessão ----------------

api.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const senha = String(req.body?.password || '')
  if (!email || !senha) return res.status(400).json({ error: 'Informe e-mail e senha.' })

  const chave = `${req.ip}:${email}`
  if (bloqueado(chave)) {
    return res.status(429).json({ error: 'Muitas tentativas. Espere 15 minutos e tente de novo.' })
  }

  const { rows } = await q(`select id, email, name, password_hash from users where email = $1`, [email])
  const user = rows[0]
  const ok = user && await checkPassword(senha, user.password_hash)

  if (!ok) {
    registrarTentativa(chave)
    // Mesma resposta para e-mail inexistente e senha errada: não entrega quem tem conta
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
  }

  limparTentativas(chave)
  const { token, expira } = await createSession(user.id)
  setSessionCookie(res, token, expira)
  res.json({ user: { id: user.id, email: user.email, name: user.name } })
})

api.post('/logout', async (req, res) => {
  await destroySession(getSessionToken(req))
  clearSessionCookie(res)
  res.json({ ok: true })
})

api.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

// ---------------- mentorados ----------------

api.get('/students', requireAuth, async (_req, res) => {
  const { rows } = await q(`select id, data from students order by created_at asc`)
  res.json({ students: rows.map(paraStudent) })
})

api.post('/students', requireAuth, async (req, res) => {
  const { id, ...data } = req.body?.student || {}
  const novoId = ehUuid(id) ? id : randomUUID()
  await q(
    `insert into students (id, data, updated_by) values ($1, $2, $3)`,
    [novoId, data, req.user.id]
  )
  res.json({ student: { ...data, id: novoId } })
})

api.put('/students/:id', requireAuth, async (req, res) => {
  const { id: _ignorado, ...data } = req.body?.student || {}
  const { rowCount } = await q(
    `update students set data = $2, updated_at = now(), updated_by = $3 where id = $1`,
    [req.params.id, data, req.user.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Mentorado não encontrado.' })
  res.json({ ok: true })
})

api.delete('/students/:id', requireAuth, async (req, res) => {
  await q(`delete from students where id = $1`, [req.params.id])
  res.json({ ok: true })
})

// Import de backup: troca a turma inteira de uma vez, tudo ou nada
api.put('/students', requireAuth, async (req, res) => {
  const lista = Array.isArray(req.body?.students) ? req.body.students : null
  if (!lista) return res.status(400).json({ error: 'Envie a lista de mentorados.' })

  const linhas = lista.map(({ id, ...data }) => ({ id: ehUuid(id) ? id : randomUUID(), data }))
  const manter = linhas.map(l => l.id)

  const client = await pool.connect()
  try {
    await client.query('begin')
    if (manter.length) {
      await client.query(`delete from students where not (id = any($1::uuid[]))`, [manter])
    } else {
      await client.query(`delete from students`)
    }
    for (const l of linhas) {
      await client.query(
        `insert into students (id, data, updated_by) values ($1, $2, $3)
         on conflict (id) do update set data = excluded.data, updated_at = now(), updated_by = excluded.updated_by`,
        [l.id, l.data, req.user.id]
      )
    }
    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    return res.status(500).json({ error: 'Falha ao importar: ' + err.message })
  } finally {
    client.release()
  }

  const { rows } = await q(`select id, data from students order by created_at asc`)
  res.json({ students: rows.map(paraStudent) })
})

// ---------------- equipe ----------------

api.get('/users', requireAuth, async (_req, res) => {
  const { rows } = await q(`select id, email, name, created_at from users order by created_at asc`)
  res.json({ users: rows })
})

api.post('/users', requireAuth, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const senha = String(req.body?.password || '')
  const nome = String(req.body?.name || '').trim() || null

  if (!email.includes('@')) return res.status(400).json({ error: 'E-mail inválido.' })
  if (senha.length < 8) return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres.' })

  const { rows } = await q(`select 1 from users where email = $1`, [email])
  if (rows.length) return res.status(409).json({ error: 'Já existe alguém com esse e-mail.' })

  const { rows: criado } = await q(
    `insert into users (email, name, password_hash) values ($1, $2, $3) returning id, email, name, created_at`,
    [email, nome, await hashPassword(senha)]
  )
  res.json({ user: criado[0] })
})

api.delete('/users/:id', requireAuth, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Você não pode remover o seu próprio acesso.' })
  }
  const { rows } = await q(`select count(*)::int as total from users`)
  if (rows[0].total <= 1) return res.status(400).json({ error: 'Precisa sobrar pelo menos uma pessoa.' })

  await q(`delete from users where id = $1`, [req.params.id])
  res.json({ ok: true })
})

// Trocar a própria senha
api.put('/me/password', requireAuth, async (req, res) => {
  const atual = String(req.body?.currentPassword || '')
  const nova = String(req.body?.newPassword || '')
  if (nova.length < 8) return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 8 caracteres.' })

  const { rows } = await q(`select password_hash from users where id = $1`, [req.user.id])
  if (!rows.length || !await checkPassword(atual, rows[0].password_hash)) {
    return res.status(401).json({ error: 'Senha atual incorreta.' })
  }

  await q(`update users set password_hash = $2 where id = $1`, [req.user.id, await hashPassword(nova)])
  // Derruba as outras sessões, mantendo a atual
  await q(
    `delete from sessions where user_id = $1 and token_hash <> $2`,
    [req.user.id, hashToken(getSessionToken(req))]
  )
  res.json({ ok: true })
})
