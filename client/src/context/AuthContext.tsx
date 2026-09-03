import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { api, tokens } from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user:    User | null
  loading: boolean
  error:   string | null
}

interface AuthContextValue extends AuthState {
  login:    (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout:   () => Promise<void>
  clearError: () => void
}

interface RegisterData {
  name:     string
  email:    string
  password: string
  role:     'ngo' | 'restaurant' | 'volunteer'
  phone?:   string
  vehicle?: 'car' | 'scooter' | 'bicycle' | 'van'
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })

  // Restore session on mount
  useEffect(() => {
    if (!tokens.access) { setState(s => ({ ...s, loading: false })); return }
    api.get<User>('/auth/me')
      .then(user  => setState({ user, loading: false, error: null }))
      .catch(()   => { tokens.clear(); setState({ user: null, loading: false, error: null }) })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/login', { email, password }
      )
      tokens.set(data.accessToken, data.refreshToken)
      setState({ user: data.user, loading: false, error: null })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setState(s => ({ ...s, loading: false, error: msg }))
      throw err
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/register', data
      )
      tokens.set(res.accessToken, res.refreshToken)
      setState({ user: res.user, loading: false, error: null })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setState(s => ({ ...s, loading: false, error: msg }))
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = tokens.refresh

    // Signing out must not be blocked by a failed or expired access token.
    // In particular, do not refresh here: refreshing rotates the stored token
    // and can leave that new token active when the logout retry uses the old one.
    try {
      await api.post('/auth/logout', { refreshToken }, false)
    } catch { /* Local sign-out still succeeds if the server cannot be reached. */ }
    finally {
      tokens.clear()
      setState({ user: null, loading: false, error: null })
    }
  }, [])

  const clearError = useCallback(() => setState(s => ({ ...s, error: null })), [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useRequireAuth(role?: string): User {
  const { user, loading } = useAuth()
  if (!loading && !user) { window.location.href = '/login'; }
  if (!loading && user && role && user.role !== role && user.role !== 'admin') {
    window.location.href = '/'
  }
  return user!
}
