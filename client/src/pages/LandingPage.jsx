import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/index.jsx'

const highlights = [
  { title: 'AI rescue scoring', body: 'Instant spoilage predictions help teams act before food becomes waste.' },
  { title: 'Live pickup visibility', body: 'Track every handoff, QR verification, and volunteer movement in one flow.' },
  { title: 'Impact storytelling', body: 'Turn rescued meals into measurable community outcomes and stories of change.' },
]

const metrics = [
  { label: 'Meals rescued', value: '18.4k+' },
  { label: 'Active partners', value: '126' },
  { label: 'Avg pickup time', value: '19 min' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(circle at top left, rgba(33,130,86,0.22), transparent 30%), #060606', color:'#fff', padding:'32px 24px 72px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display:'flex', flexDirection:'column', gap: 24 }}>
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background:'linear-gradient(135deg,#16a34a,#4ade80)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18 }}>🌿</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>FoodBridge</div>
              <div style={{ fontSize: 12, color:'rgba(255,255,255,0.45)' }}>AI-powered food rescue for resilient communities</div>
            </div>
          </div>
          <div style={{ display:'flex', gap: 10, flexWrap:'wrap' }}>
            <Button variant="ghost" onClick={() => navigate('/auth')}>Sign in</Button>
            <Button onClick={() => navigate('/auth')}>Start rescuing food</Button>
          </div>
        </header>

        <section style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap: 20, alignItems:'center' }}>
          <div style={{ padding:'24px 0' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap: 8, padding:'6px 10px', borderRadius: 999, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', fontSize: 12, color:'#86efac', marginBottom: 14 }}>
              <span>⚡</span> Production-ready rescue network for restaurants, NGOs, and volunteers
            </div>
            <h1 style={{ fontSize:'clamp(2rem, 4vw, 3.3rem)', lineHeight:1.05, fontWeight:800, marginBottom: 12 }}>
              Rescue food before it becomes waste — and turn generosity into measurable impact.
            </h1>
            <p style={{ fontSize: 16, color:'rgba(255,255,255,0.68)', maxWidth: 680, lineHeight: 1.7, marginBottom: 20 }}>
              FoodBridge connects surplus food donors with nearby NGOs and volunteer teams through real-time matching, AI spoilage predictions, and transparent impact reporting.
            </p>
            <div style={{ display:'flex', gap: 12, flexWrap:'wrap' }}>
              <Button size="lg" onClick={() => navigate('/auth')}>Create a free workspace</Button>
              <Button size="lg" variant="ghost" onClick={() => navigate('/app/dashboard')}>Explore the demo</Button>
            </div>
          </div>

          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 20 }}>
            <div style={{ fontSize: 12, color:'#4ade80', fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 8 }}>Mission control</div>
            <div style={{ display:'grid', gap: 10 }}>
              {metrics.map((m, i) => (
                <div key={i} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding:'14px 16px' }}>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{m.value}</div>
                  <div style={{ fontSize: 12, color:'rgba(255,255,255,0.45)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          {highlights.map((item) => (
            <div key={item.title} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color:'rgba(255,255,255,0.56)' }}>{item.body}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
