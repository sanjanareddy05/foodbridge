// ─── Typed API client ─────────────────────────────────────────────────────────
// All requests go through here. Handles: auth headers, token refresh, errors.

const BASE = import.meta.env.VITE_API_URL || '/api'

interface ApiResponse<T> {
  success: boolean
  data:    T
  message?: string
  code?:   string
}

class ApiError extends Error {
  constructor(public message: string, public code: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Token storage ────────────────────────────────────────────────────────────
export const tokens = {
  get access()  { return localStorage.getItem('fb_access')  ?? '' },
  get refresh() { return localStorage.getItem('fb_refresh') ?? '' },
  set(access: string, refresh: string) {
    localStorage.setItem('fb_access',  access)
    localStorage.setItem('fb_refresh', refresh)
  },
  clear() {
    localStorage.removeItem('fb_access')
    localStorage.removeItem('fb_refresh')
  },
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  method:  string,
  path:    string,
  body?:   unknown,
  retry = true
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (tokens.access) headers['Authorization'] = `Bearer ${tokens.access}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Token expired → refresh once and retry
  if (res.status === 401 && retry && tokens.refresh) {
    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: tokens.refresh }),
      })
      if (refreshRes.ok) {
        const { data } = await refreshRes.json() as ApiResponse<{ accessToken: string; refreshToken: string }>
        tokens.set(data.accessToken, data.refreshToken)
        return request<T>(method, path, body, false)
      }
    } catch { /* fall through to error */ }
    tokens.clear()
    window.location.href = '/login'
    throw new ApiError('Session expired', 'UNAUTHORIZED', 401)
  }

  const json = await res.json() as ApiResponse<T>

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.message ?? 'Request failed',
      json.code    ?? 'UNKNOWN_ERROR',
      res.status
    )
  }

  return json.data
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
export const api = {
  get:    <T>(path: string)               => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)=> request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown)=> request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown)=> request<T>('PATCH',  path, body),
  delete: <T>(path: string)               => request<T>('DELETE', path),
}

export { ApiError }
