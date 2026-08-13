import { Response } from 'express'

// ─── Standard API response envelope ──────────────────────────────────────────
export function ok<T>(res: Response, data: T, message?: string): Response {
  return res.status(200).json({ success: true, message, data })
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return res.status(201).json({ success: true, message, data })
}

export function noContent(res: Response): Response {
  return res.status(204).send()
}

// ─── Custom Error Classes ─────────────────────────────────────────────────────
export class AppError extends Error {
  constructor(
    public message:    string,
    public statusCode: number = 500,
    public code?:      string,
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 422, 'VALIDATION_ERROR')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}
