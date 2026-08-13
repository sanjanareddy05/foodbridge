import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db/pool'
import { signAccessToken, generateRefreshToken } from '../utils/jwt'
import { created, ok, AppError, UnauthorizedError, ConflictError } from '../utils/response'
import { authenticate } from '../middleware/auth'
import logger from '../utils/logger'

const router = Router()

// ─── Validation schemas ───────────────────────────────────────────────────────
const RegisterSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8).max(72),
  role:     z.enum(['ngo', 'restaurant', 'volunteer']),
  phone:    z.string().optional(),
})

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = RegisterSchema.parse(req.body)

    // Check email uniqueness
    const existing = await db.queryOne('SELECT id FROM users WHERE email = $1', [body.email])
    if (existing) throw new ConflictError('Email already registered')

    const passwordHash = await bcrypt.hash(body.password, Number(process.env.BCRYPT_ROUNDS) || 12)

    const [user] = await db.query<{ id: string; name: string; email: string; role: string }>(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [body.name, body.email, passwordHash, body.role, body.phone ?? null]
    )

    const accessToken  = signAccessToken({ userId: user.id, role: user.role, email: user.email })
    const refreshToken = generateRefreshToken()

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    )

    logger.info('User registered', { userId: user.id, role: user.role })

    created(res, { user, accessToken, refreshToken }, 'Account created successfully')
  } catch (err) {
    next(err)
  }
})

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = LoginSchema.parse(req.body)

    const user = await db.queryOne<{
      id: string; name: string; email: string;
      role: string; password_hash: string; is_active: boolean
    }>(
      'SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = $1',
      [email]
    )

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedError('Invalid email or password')
    }
    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated')
    }

    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id])

    const accessToken  = signAccessToken({ userId: user.id, role: user.role, email: user.email })
    const refreshToken = generateRefreshToken()

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, refreshToken]
    )

    const { password_hash: _, ...safeUser } = user

    logger.info('User logged in', { userId: user.id })
    ok(res, { user: safeUser, accessToken, refreshToken }, 'Login successful')
  } catch (err) {
    next(err)
  }
})

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new UnauthorizedError('Refresh token required')

    const tokenRow = await db.queryOne<{ user_id: string; expires_at: Date }>(
      `SELECT user_id, expires_at FROM refresh_tokens
       WHERE token = $1 AND expires_at > NOW()`,
      [refreshToken]
    )
    if (!tokenRow) throw new UnauthorizedError('Invalid or expired refresh token')

    const user = await db.queryOne<{ id: string; email: string; role: string }>(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [tokenRow.user_id]
    )
    if (!user) throw new UnauthorizedError('User not found')

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken()
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken])
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
      [user.id, newRefreshToken]
    )

    const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email })
    ok(res, { accessToken, refreshToken: newRefreshToken })
  } catch (err) {
    next(err)
  }
})

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken])
    }
    ok(res, null, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
})

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await db.queryOne(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.avatar_url, u.is_verified, u.created_at,
              o.id AS org_id, o.name AS org_name, o.is_verified AS org_verified
       FROM users u
       LEFT JOIN organisations o ON o.user_id = u.id
       WHERE u.id = $1`,
      [req.user!.userId]
    )
    ok(res, user)
  } catch (err) {
    next(err)
  }
})

export default router
