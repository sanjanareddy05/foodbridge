import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/response'
import logger from '../utils/logger'

export function errorHandler(
  err:  Error,
  req:  Request,
  res:  Response,
  _next: NextFunction
): void {
  // Log all errors
  const extra: any = {
    message: err.message,
    stack:   err.stack,
    method:  req.method,
    path:    req.path,
    ip:      req.ip,
    userId:  req.user?.userId,
  }
  if ((req as any).rawBody) extra.rawBody = String((req as any).rawBody).slice(0, 2000)
  logger.error('Request error', extra)

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code:    err.code,
      message: err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    })
    return
  }

  // PostgreSQL errors
  const pgErr = err as { code?: string; constraint?: string }
  if (pgErr.code === '23505') {
    res.status(409).json({ success: false, code: 'CONFLICT', message: 'Resource already exists' })
    return
  }
  if (pgErr.code === '23503') {
    res.status(400).json({ success: false, code: 'INVALID_REFERENCE', message: 'Referenced resource not found' })
    return
  }
  if (pgErr.code === '40001') {
    res.status(409).json({ success: false, code: 'SERIALIZATION_CONFLICT', message: 'Concurrent modification — please retry' })
    return
  }

  // Generic 500
  res.status(500).json({
    success: false,
    code:    'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  })
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    code:    'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  })
}
