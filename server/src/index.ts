import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes       from './routes/auth'
import listingsRoutes   from './routes/listings'
import volunteersRoutes from './routes/volunteers'
import impactRoutes     from './routes/impact'
import aiRoutes         from './routes/ai'
import matchRoutes      from './routes/match'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import logger from './utils/logger'
import pool from './db/pool'

const app  = express()

// Ensure critical secrets are present in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === '') {
    // eslint-disable-next-line no-console
    console.error('FATAL: JWT_SECRET is not set. Aborting startup in production.')
    process.exit(1)
  }
}
const PORT = Number(process.env.PORT) || 4000

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
    },
  },
}))

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs:        Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:             Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many auth attempts' },
})

app.use(limiter)

// ─── Parsing & Logging ────────────────────────────────────────────────────────
// Use raw parsing and tolerant JSON normalization to accept loosely formatted bodies
app.use(express.raw({ type: '*/*', limit: '10mb', verify: (req: any, _res, buf) => { try { req.rawBody = buf.toString() } catch {} } }))

app.use((req: any, _res, next) => {
  const contentType = String(req.headers['content-type'] || '')
  if (!req.rawBody || req.rawBody.length === 0) { req.body = {}; return next() }

  const tryParse = (s: string) => {
    try { return JSON.parse(s) } catch { return null }
  }

  const strict = tryParse(req.rawBody)
  if (strict !== null) { req.body = strict; return next() }

  let t = String(req.rawBody).trim()
  t = t.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
  t = t.replace(/'/g, '"')
  // Quote UUID-like bare values (e.g. listingId:1d06...)
  t = t.replace(/:\s*([0-9a-fA-F\-]{36})/g, ': "$1"')
  t = t.replace(/:\s*([^\s\[{\"\d\-tfn][^,}]*)/g, (_m, val) => {
    const v = String(val).trim()
    if (/^(true|false|null|\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)$/.test(v)) return `: ${v}`
    if (v.startsWith('"') || v.startsWith('{') || v.startsWith('[')) return `: ${v}`
    return `: "${v.replace(/"/g, '\\"')}"`
  })

  const loose = tryParse(t)
  if (loose !== null) { req.body = loose; return next() }

  req.body = {}
  return next()
})

app.use(express.urlencoded({ extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: msg => logger.http(msg.trim()) },
}))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({
      status:    'healthy',
      timestamp: new Date().toISOString(),
      uptime:    process.uptime(),
      db:        'connected',
      version:   process.env.npm_package_version,
    })
  } catch {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' })
  }
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes)
app.use('/api/listings',   listingsRoutes)
app.use('/api/volunteers', volunteersRoutes)
app.use('/api/impact',     impactRoutes)
app.use('/api/ai',         aiRoutes)
app.use('/api/match',      matchRoutes)

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Verify DB connection
    await pool.query('SELECT NOW()')
    logger.info('Database connected')

    app.listen(PORT, () => {
      logger.info(`🌿 FoodBridge API running`, {
        port: PORT,
        env:  process.env.NODE_ENV,
        url:  `http://localhost:${PORT}`,
      })
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Failed to start server', { error: msg })
    process.exit(1)
  }
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await pool.end()
  process.exit(0)
})

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason })
  process.exit(1)
})

start()

export default app
