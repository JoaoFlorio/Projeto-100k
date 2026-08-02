import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { migrate } from './db.js'
import { seedAdmin } from './auth.js'
import { api } from './routes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, '..', 'dist')
const porta = process.env.PORT || 3100

const app = express()

// Railway fica atrás de proxy: sem isso o req.ip vira o do proxy
app.set('trust proxy', 1)
app.use(express.json({ limit: '10mb' }))   // o import de backup pode ser grande

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', api)

// Erro em rota da API vira JSON, não uma página HTML de stack trace
app.use('/api', (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500
  // Corpo malformado é culpa de quem chamou (400), não falha do servidor
  if (status >= 500) console.error('[api]', err)
  res.status(status).json({
    error: status === 400 ? 'Requisição inválida.' : 'Erro interno do servidor.',
  })
})

// O site em si
if (existsSync(dist)) {
  app.use(express.static(dist))
  // SPA: qualquer rota que não seja /api devolve o index
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(dist, 'index.html')))
} else {
  console.warn('[server] pasta dist/ ausente — rode `npm run build` (em dev o site vem do Vite)')
}

const inicio = async () => {
  try {
    await migrate()
    await seedAdmin()
  } catch (err) {
    console.error('[server] falha ao preparar o banco:', err.message)
    process.exit(1)
  }
  app.listen(porta, () => console.log(`[server] ouvindo na porta ${porta}`))
}

inicio()
