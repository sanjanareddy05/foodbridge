import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JWTPayload } from '../utils/jwt'
import { UnauthorizedError, ForbiddenError } from '../utils/response'

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

// ─── Authenticate ─────────────────────────────────────────────────────────────
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header')
    }
    const token = header.slice(7)
    req.user = verifyAccessToken(token)
    next()
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) return next(err)
    next(new UnauthorizedError('Invalid or expired token'))
  }
}

// ─── Role Guard ───────────────────────────────────────────────────────────────
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError())
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires role: ${roles.join(' or ')}`))
    }
    next()
  }
}

// ─── Optional Auth (for public routes that enhance with user data) ────────────
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      req.user = verifyAccessToken(header.slice(7))
    }
  } catch { /* ignore */ }
  next()
}
