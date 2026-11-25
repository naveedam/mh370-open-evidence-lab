// Applies db/migrations/*.sql in order, once each, inside a transaction. Run as the schema owner.
//   DATABASE_ADMIN_URL=postgres://owner:pw@host:5432/mh370_oel npm run db:migrate
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const url = process.env.DATABASE_ADMIN_URL
if (!url) throw new Error('DATABASE_ADMIN_URL is required')
const dir = join(import.meta.dirname, '..', 'db', 'migrations')
const client = new pg.Client({ connectionString: url })
await client.connect()
await client.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())')
const done = new Set((await client.query<{ name: string }>('select name from schema_migrations')).rows.map((r) => r.name))
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (done.has(file)) continue
  process.stdout.write(`applying ${file} … `)
  try {
    await client.query('begin')
    await client.query(readFileSync(join(dir, file), 'utf8'))
    await client.query('insert into schema_migrations(name) values ($1)', [file])
    await client.query('commit')
    console.log('ok')
  } catch (e) {
    await client.query('rollback')
    console.error('FAILED')
    throw e
  }
}
await client.end()
