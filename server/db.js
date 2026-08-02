import pg from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('[db] DATABASE_URL não definida — adicione o Postgres ao projeto no Railway.')
}

// Rede interna do Railway e banco local não falam TLS; a URL pública exige.
// PGSSL=off / on força a mão quando a heurística não servir.
function usaSsl(url) {
  if (process.env.PGSSL === 'off') return false
  if (process.env.PGSSL === 'on') return true
  const host = (() => { try { return new URL(url).hostname } catch { return '' } })()
  return !(host === 'localhost' || host === '127.0.0.1' || host.endsWith('.railway.internal'))
}

export const pool = new pg.Pool({
  connectionString,
  ssl: usaSsl(connectionString || '') ? { rejectUnauthorized: false } : false,
  max: 5,
})

export const q = (text, params) => pool.query(text, params)

// Roda na subida do servidor: cria o que faltar e não mexe no que já existe.
export async function migrate() {
  await q(`create extension if not exists pgcrypto`)

  await q(`
    create table if not exists users (
      id            uuid primary key default gen_random_uuid(),
      email         text not null unique,
      name          text,
      password_hash text not null,
      created_at    timestamptz not null default now()
    )
  `)

  await q(`
    create table if not exists sessions (
      token_hash text primary key,
      user_id    uuid not null references users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `)

  await q(`
    create table if not exists students (
      id         uuid primary key default gen_random_uuid(),
      data       jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      updated_by uuid references users(id) on delete set null
    )
  `)

  await q(`create index if not exists sessions_expires_idx on sessions (expires_at)`)
  await q(`create index if not exists students_created_idx on students (created_at)`)

  // Limpa sessões vencidas a cada boot
  await q(`delete from sessions where expires_at < now()`)
}
