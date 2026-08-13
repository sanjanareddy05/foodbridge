import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export interface JWTPayload {
  userId:  string
  role:    string
  email:   string
  orgId?:  string
}

// ─── Access Token (short-lived) ───────────────────────────────────────────────
export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
    issuer:    'foodbridge-api',
    audience:  'foodbridge-client',
  })
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer:   'foodbridge-api',
    audience: 'foodbridge-client',
  }) as JWTPayload
}

// ─── Refresh Token (long-lived, opaque) ──────────────────────────────────────
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

// ─── QR Code generation ───────────────────────────────────────────────────────
export function generateQRCode(listingId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const hash = crypto
    .createHmac('sha256', process.env.JWT_SECRET!)
    .update(`${listingId}-${timestamp}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase()
  return `FB-${listingId.slice(0, 6).toUpperCase()}-${timestamp}-${hash}`
}

export function verifyQRCode(code: string, listingId: string): boolean {
  const parts = code.split('-')
  if (parts.length !== 4) return false
  const [, , timestamp, hash] = parts
  const expected = crypto
    .createHmac('sha256', process.env.JWT_SECRET!)
    .update(`${listingId}-${timestamp}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase()
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expected)
  )
}
