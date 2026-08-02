import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { q } from './db.js'

const scryptAsync = promisify(scrypt)

const COOKIE = 'p100k_session'
const DIAS_SESSAO = 30

// ---------- senhas ----------

export async function hashPassword(senha) {
  const salt = randomBytes(16)
  const derived = await scryptAsync(senha, salt, 64)
  return `${salt.toString('hex')}:${derived.toString('hex')}`
}

export async function checkPassword(senha, armazenado) {
  const [saltHex, hashHex] = String(armazenado).split(':')
  if (!saltHex || !hashHex) return false
  const derived = await scryptAsync(senha, Buffer.from(saltHex, 'hex'), 64)
  const esperado = Buffer.from(hashHex, 'hex')
  // Comparação de tempo constante: não vaza quanto do hash bateu
  return derived.length === esperado.length && timingSafeEqual(derived, esperado)
}

// ---------- sessões ----------

export const hashToken = (token) => createHash('sha256').update(token).digest('hex')

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url')
  const expira = new Date(Date.now() + DIAS_SESSAO * 24 * 60 * 60 * 1000)
  await q(
    `insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)`,
    [hashToken(token), userId, expira]
  )
  return { token, expira }
}

export async function destroySession(token) {
  if (token) await q(`delete from sessions where token_hash = $1`, [hashToken(token)])
}

function lerCookie(req, nome) {
  const raw = req.headers.cookie
  if (!raw) return null
  for (const parte of raw.split(';')) {
    const [chave, ...resto] = parte.trim().split('=')
    if (chave === nome) return decodeURIComponent(resto.join('='))
  }
  return null
}

export function setSessionCookie(res, token, expira) {
  const producao = process.env.NODE_ENV === 'production'
  res.cookie(COOKIE, token, {
    httpOnly: true,               // JavaScript da página não enxerga o cookie
    sameSite: 'lax',
    secure: producao,
    expires: expira,
    path: '/',
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE, { path: '/' })
}

export const getSessionToken = (req) => lerCookie(req, COOKIE)

// Middleware: só passa quem tem sessão válida
export async function requireAuth(req, res, next) {
  const token = getSessionToken(req)
  if (!token) return res.status(401).json({ error: 'Não autenticado' })

  const { rows } = await q(
    `select u.id, u.email, u.name
       from sessions s
       join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)]
  )
  if (!rows.length) return res.status(401).json({ error: 'Sessão expirada' })

  req.user = rows[0]
  next()
}

// ---------- freio de força bruta no login ----------

const tentativas = new Map()
const JANELA_MS = 15 * 60 * 1000
const LIMITE = 8

export function registrarTentativa(chave) {
  const agora = Date.now()
  const atual = tentativas.get(chave)
  if (!atual || agora > atual.reset) {
    tentativas.set(chave, { n: 1, reset: agora + JANELA_MS })
    return
  }
  atual.n += 1
}

export function bloqueado(chave) {
  const atual = tentativas.get(chave)
  if (!atual) return false
  if (Date.now() > atual.reset) { tentativas.delete(chave); return false }
  return atual.n >= LIMITE
}

export const limparTentativas = (chave) => tentativas.delete(chave)

// ---------- primeiro acesso ----------

// Se o banco ainda não tem ninguém, cria o admin a partir das variáveis do Railway.
export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const senha = process.env.ADMIN_PASSWORD
  if (!email || !senha) return

  const { rows } = await q(`select count(*)::int as total from users`)
  if (rows[0].total > 0) return

  await q(
    `insert into users (email, name, password_hash) values ($1, $2, $3)`,
    [email, process.env.ADMIN_NAME || 'Admin', await hashPassword(senha)]
  )
  console.log(`[auth] primeiro usuário criado: ${email}`)
}
