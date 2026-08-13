import { Pool, PoolClient, QueryResultRow } from 'pg'
import logger from '../utils/logger'

// ─── Connection Pool ──────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min:              Number(process.env.DB_POOL_MIN) || 2,
  max:              Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis:    30_000,
  connectionTimeoutMillis: 5_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
})

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error', { error: err.message })
})

pool.on('connect', () => {
  logger.debug('New DB client connected')
})

// ─── Query helper with logging ────────────────────────────────────────────────
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start
    logger.debug('Query executed', { text: text.slice(0, 80), duration, rows: res.rowCount })
    return res.rows
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown DB error'
    logger.error('Query failed', { text: text.slice(0, 80), error: message })
    throw err
  }
}

export async function queryOne<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

// ─── Transaction helper ───────────────────────────────────────────────────────
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── SERIALIZABLE transaction (prevents double-booking) ──────────────────────
export async function withSerializableTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  let retries = 3
  while (retries > 0) {
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE')
      const result = await fn(client)
      await client.query('COMMIT')
      return result
    } catch (err: unknown) {
      await client.query('ROLLBACK')
      // Retry on serialization failure
      const pgErr = err as { code?: string }
      if (pgErr.code === '40001' && retries > 1) {
        retries--
        logger.warn(`Serialization conflict, retrying (${retries} left)`)
        continue
      }
      throw err
    } finally {
      if (retries === 0) client.release()
    }
  }
  client.release()
  throw new Error('Transaction failed after retries')
}

export const db = { query, queryOne, withTransaction, withSerializableTransaction }
export default pool
