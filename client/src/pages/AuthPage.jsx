import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, Input, FieldLabel } from '../components/ui/index.jsx'
import { useAuth } from '../context/AuthContext.tsx'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register, loading, error, clearError } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'ngo', vehicle:'bicycle' })

  const submit = async (e) => {
    e.preventDefault()
    clearError()
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register({ name: form.name, email: form.email, password: form.password, role: form.role, vehicle: form.vehicle })
      navigate('/app/dashboard')
    } catch { /* AuthContext exposes the server error in the form. */ }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(15,23,42,0.95))', display:'flex', alignItems:'center', justifyContent:'center', padding: 24 }}>
      <Card style={{ width: 460, maxWidth:'100%', padding: 0 }}>
        <div style={{ padding:'24px 24px 6px' }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Welcome back</div>
          <div style={{ fontSize: 13, color:'rgba(255,255,255,0.45)', marginTop: 6 }}>Access your rescue operations workspace</div>
        </div>
        <CardBody>
          <div style={{ display:'flex', gap: 8, marginBottom: 16 }}>
            {['login','register'].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'8px 10px', borderRadius: 8, border: mode===m ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.08)', background: mode===m ? 'rgba(22,163,74,0.14)' : '#1a1a1a', color:'#fff', fontSize: 13, fontWeight: 600 }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap: 12 }}>
            {mode === 'register' && (
              <>
                <div>
                  <FieldLabel>Full name</FieldLabel>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Asha Patel" />
                </div>
                <div>
                  <FieldLabel>Role</FieldLabel>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'#1a1a1a', color:'#fff' }}>
                    <option value="ngo">NGO coordinator</option>
                    <option value="restaurant">Restaurant donor</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>
                {form.role === 'volunteer' && (
                  <div>
                    <FieldLabel>Vehicle</FieldLabel>
                    <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'#1a1a1a', color:'#fff' }}>
                      <option value="bicycle">Bicycle</option>
                      <option value="scooter">Scooter</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <FieldLabel>Email</FieldLabel>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            {error && <div role="alert" style={{ color:'#fca5a5', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'9px 12px', fontSize:12 }}>{error}</div>}
            <Button type="submit" size="lg" disabled={loading} style={{ marginTop: 4 }}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in to FoodBridge' : 'Create account'}</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
