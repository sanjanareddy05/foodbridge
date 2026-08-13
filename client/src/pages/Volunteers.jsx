import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useRouteOptimiser } from '../hooks/useAI.js'
import { Card, CardHeader, CardBody, Button, Badge, EmptyState, Spinner, SectionTitle } from '../components/ui/index.jsx'
import { vehicleIcon } from '../utils/helpers'

const V_STATUS = {
  active:  { color:'#22c55e', bg:'rgba(34,197,94,0.12)',   label:'Available'  },
  busy:    { color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  label:'On pickup'  },
  offline: { color:'rgba(255,255,255,0.25)', bg:'rgba(255,255,255,0.06)', label:'Offline' },
}

export default function Volunteers() {
  const { state } = useApp()
  const { route, optimising, optimise, reset } = useRouteOptimiser()
  const [selected, setSelected] = useState(null)

  const handleOptimise = (vol) => {
    setSelected(vol.id)
    optimise(
      { lat: 23.2599, lng: 77.4126 },
      { lat: 23.2720, lng: 77.4320, name: 'Spice Route Restaurant' }
    )
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16, alignItems:'start', animation:'fade-in 0.25s ease' }}>

      {/* ── Volunteer list ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <SectionTitle subtitle={`${state.volunteers.filter(v=>v.status==='active').length} available · ${state.volunteers.filter(v=>v.status==='busy').length} on pickup`}>
            Volunteer network
          </SectionTitle>
          <Badge color="#22c55e">{state.volunteers.length} registered</Badge>
        </div>

        {state.volunteers.map(vol => {
          const ss       = V_STATUS[vol.status] || V_STATUS.offline
          const assigned = state.listings.find(l => l.assignedVolunteer === vol.name && l.status === 'in-transit')
          const isSelected = selected === vol.id

          return (
            <Card key={vol.id} style={{ border:`1px solid ${isSelected ? 'rgba(22,163,74,0.35)' : 'rgba(255,255,255,0.07)'}`, transition:'border-color 0.2s' }}>
              <CardBody style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                {/* Avatar with status dot */}
                <div style={{ position:'relative', flexShrink:0 }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#94a3b8' }}>
                    {vol.avatar}
                  </div>
                  <div style={{ position:'absolute', bottom:1, right:1, width:11, height:11, borderRadius:'50%', background:ss.color, border:'2px solid #111' }} />
                </div>

                {/* Info */}
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                    <span style={{ fontSize:15, fontWeight:600, color:'#fff' }}>{vol.name}</span>
                    <span style={{ padding:'3px 9px', borderRadius:9999, fontSize:11, fontWeight:600, color:ss.color, background:ss.bg }}>{ss.label}</span>
                  </div>

                  <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:8 }}>
                    {[
                      [vehicleIcon[vol.vehicle], vol.vehicle],
                      ['⭐', `${vol.rating} rating`],
                      ['📦', `${vol.deliveries} deliveries`],
                      ['⚖️', `${vol.kgDelivered} kg total`],
                    ].map(([ic, val], i) => (
                      <span key={i} style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'flex', alignItems:'center', gap:4 }}>
                        {ic} {val}
                      </span>
                    ))}
                  </div>

                  {/* Star rating */}
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom: assigned ? 10 : 0 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ fontSize:12, color: i <= Math.floor(vol.rating) ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}>★</span>
                    ))}
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginLeft:4 }}>{vol.rating} / 5.0</span>
                  </div>

                  {/* Active assignment */}
                  {assigned && (
                    <div style={{ padding:'7px 10px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.18)', borderRadius:8, fontSize:12, color:'#60a5fa', fontWeight:500 }}>
                      🛵 Currently: {assigned.emoji} {assigned.name} ({assigned.quantity} {assigned.unit})
                    </div>
                  )}
                </div>

                {/* Action */}
                {vol.status === 'active' && (
                  <Button
                    variant="blue"
                    size="sm"
                    onClick={() => handleOptimise(vol)}
                    style={{ flexShrink:0, alignSelf:'flex-start' }}
                  >
                    🗺️ Optimise route
                  </Button>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* ── Route Optimiser ── */}
      <div style={{ position:'sticky', top:72, display:'flex', flexDirection:'column', gap:12 }}>
        <Card>
          <CardHeader>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>🗺️ Route Optimiser</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)', marginTop:2 }}>Nearest-Neighbour TSP · Google Maps API</div>
            </div>
            {route && (
              <Button variant="ghost" size="sm" onClick={() => { reset(); setSelected(null) }}>Reset</Button>
            )}
          </CardHeader>

          {!route && !optimising && (
            <EmptyState
              icon="🗺️"
              title="No route calculated"
              subtitle='Click "Optimise route" on any available volunteer'
            />
          )}

          {optimising && (
            <CardBody style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'2.5rem' }}>
              <Spinner size={36} />
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Calculating optimal route…</span>
            </CardBody>
          )}

          {route && !optimising && (
            <CardBody>
              {/* Mini map SVG */}
              <svg viewBox="0 0 300 150" style={{ width:'100%', height:150, background:'#0d0d0d', borderRadius:10, marginBottom:14, display:'block' }}>
                <line x1="0" y1="75" x2="300" y2="75" stroke="#181818" strokeWidth="12"/>
                <line x1="150" y1="0" x2="150" y2="150" stroke="#181818" strokeWidth="12"/>
                <polyline
                  points={route.polyline.map((p, i) => {
                    const x = ((p.lng - 77.40) / 0.055) * 260 + 20
                    const y = 150 - ((p.lat - 23.24) / 0.055) * 130 - 5
                    return `${Math.max(5,Math.min(295,x))},${Math.max(5,Math.min(145,y))}`
                  }).join(' ')}
                  stroke="#16a34a" strokeWidth="2.5" fill="none" strokeDasharray="5,3"
                />
                <circle cx="55" cy="115" r="10" fill="#16a34a"/>
                <text x="55" y="119" textAnchor="middle" fontSize="9" fill="white">★</text>
                <text x="55" y="132" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)" fontFamily="system-ui">NGO</text>
                <circle cx="235" cy="38" r="10" fill="#ef4444"/>
                <text x="235" y="42" textAnchor="middle" fontSize="9" fill="white">📍</text>
                <text x="235" y="55" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)" fontFamily="system-ui">Pickup</text>
                <circle cx="148" cy="78" r="8" fill="#3b82f6"/>
                <text x="148" y="82" textAnchor="middle" fontSize="8" fill="white">🛵</text>
              </svg>

              {/* Stats grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  ['📏', 'Distance',   `${route.distanceKm} km`],
                  ['⏱️', 'ETA',        `${route.etaMinutes} min`],
                  ['⛽', 'Fuel saved',  `${route.fuelSavedL} L`],
                  ['🔀', 'Algorithm',  route.algorithm],
                ].map(([ic, lbl, val], i) => (
                  <div key={i} style={{ background:'#1a1a1a', borderRadius:9, padding:'9px 12px' }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginBottom:3 }}>{ic} {lbl}</div>
                    <div style={{ fontSize:i === 3 ? 11 : 15, fontWeight:700, color:'#fff' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Turn-by-turn */}
              <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)', marginBottom:8 }}>
                Turn-by-turn directions
              </div>
              {route.steps.map((step, i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background: i === route.steps.length-1 ? '#16a34a' : '#1e293b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', flexShrink:0, marginTop:1 }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:'#fff' }}>{step.instruction}</div>
                    {step.distance && <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:1 }}>{step.distance} · {step.duration}</div>}
                  </div>
                </div>
              ))}

              <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(34,197,94,0.07)', borderRadius:8, fontSize:12, color:'rgba(34,197,94,0.7)', fontWeight:500 }}>
                ↑ {route.timeSavingPct}% faster than unoptimised assignment
              </div>
            </CardBody>
          )}
        </Card>

        {/* Tech note */}
        <div style={{ background:'rgba(167,139,250,0.06)', border:'1px solid rgba(167,139,250,0.14)', borderRadius:12, padding:'13px 14px' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#a78bfa', marginBottom:5 }}>How route optimisation works</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', lineHeight:1.65 }}>
            Uses Haversine distance + Nearest-Neighbour TSP to minimise total travel distance across multiple stops. In production, routes are validated against real-time traffic via Google Maps Directions API.
          </div>
        </div>
      </div>
    </div>
  )
}
