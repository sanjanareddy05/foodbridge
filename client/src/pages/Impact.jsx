import React from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Card, CardHeader, CardBody, Badge, StatCard, SectionTitle } from '../components/ui/index.jsx'

function BarChart({ data, height = 130, color = '#16a34a', valueKey = 'kg' }) {
  const max = Math.max(...data.map(d => d[valueKey]))
  const W = 52
  return (
    <svg viewBox={`0 0 ${data.length * W} ${height + 28}`} style={{ width:'100%', height:height+28, display:'block', overflow:'visible' }}>
      {data.map((d, i) => {
        const bh = (d[valueKey] / max) * height
        const x  = i * W + 6
        const y  = height - bh
        return (
          <g key={d.day || d.month}>
            <rect x={x+2} y={y} width={36} height={bh} rx={5} fill={color} opacity="0.85"/>
            <text x={x+20} y={y-4} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8.5" fontFamily="system-ui">{d[valueKey]}</text>
            <text x={x+20} y={height+18} textAnchor="middle" fill="rgba(255,255,255,0.32)" fontSize="9.5" fontFamily="system-ui">{d.day || d.month}</text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.pct, 0)
  let cum = 0
  const cx = 75, cy = 75, r = 58, inn = 36
  const arcs = segments.map(seg => {
    const sa  = (cum / total) * 2 * Math.PI - Math.PI / 2
    cum       += seg.pct
    const ea  = (cum / total) * 2 * Math.PI - Math.PI / 2
    const x1  = cx + r   * Math.cos(sa), y1 = cy + r   * Math.sin(sa)
    const x2  = cx + r   * Math.cos(ea), y2 = cy + r   * Math.sin(ea)
    const ix1 = cx + inn * Math.cos(ea), iy1= cy + inn * Math.sin(ea)
    const ix2 = cx + inn * Math.cos(sa), iy2= cy + inn * Math.sin(sa)
    const lg  = (ea - sa) > Math.PI ? 1 : 0
    return { ...seg, d:`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${ix1},${iy1} A${inn},${inn} 0 ${lg},0 ${ix2},${iy2} Z` }
  })
  return (
    <svg viewBox="0 0 150 150" style={{ width:150, height:150, flexShrink:0 }}>
      {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} opacity="0.9"/>)}
      <text x={cx} y={cy-4} textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="system-ui">{segments[0].pct}%</text>
      <text x={cx} y={cy+13} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="system-ui">cooked meals</text>
    </svg>
  )
}

function LineChart({ data, height = 80, color = '#16a34a', valueKey = 'meals' }) {
  const max  = Math.max(...data.map(d => d[valueKey]))
  const W    = 620
  const pts  = data.map((d, i) => [
    (i / (data.length - 1)) * (W - 20) + 10,
    height - 6 - (d[valueKey] / max) * (height - 16),
  ])
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const areaD = `${pathD} L${pts[pts.length-1][0]},${height} L${pts[0][0]},${height} Z`
  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width:'100%', height, display:'block' }}>
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" y1={height * f} x2={W} y2={height * f} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      <path d={areaD} fill="url(#lg1)"/>
      <path d={pathD} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.5" fill={color}/>
          <text x={x} y={y - 7} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="system-ui">
            {data[i][valueKey]}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function Impact() {
  const { state } = useApp()
  const { impact, ngos } = state

  const topStats = [
    { icon:'🍽️', label:'Meals rescued (MTD)',  value: impact.mealsMTD.toLocaleString(),              color:'#4ade80'  },
    { icon:'⚖️', label:'Food rescued',          value:`${(impact.kgRescuedMTD/1000).toFixed(1)}t`,   color:'#60a5fa'  },
    { icon:'🌿', label:'CO₂ prevented',         value:`${impact.co2PreventedMTD.toLocaleString()} kg`,color:'#a78bfa'  },
    { icon:'👥', label:'Beneficiaries fed',      value: impact.beneficiariesMTD.toLocaleString(),      color:'#f59e0b'  },
    { icon:'🏪', label:'Partner restaurants',    value: impact.partnersTotal,                           color:'#f472b6'  },
    { icon:'⏱️', label:'Avg delivery',           value:`${impact.avgDeliveryMin} min`,                 color:'#4ade80'  },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fade-in 0.25s ease' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <SectionTitle subtitle="July 2026 · Bhopal network">Impact report</SectionTitle>
        <Badge color="#4ade80">Month to date</Badge>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
        {topStats.map((s, i) => (
          <div key={i} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 10px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:5, lineHeight:1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart + Donut */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14 }}>
        <Card>
          <CardHeader>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Weekly food rescued (kg)</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', marginTop:2 }}>Last 7 days</div>
            </div>
            <span style={{ fontSize:20, fontWeight:800, color:'#4ade80' }}>
              {impact.weeklyTrend.reduce((s, d) => s + d.kg, 0)} kg total
            </span>
          </CardHeader>
          <CardBody>
            <BarChart data={impact.weeklyTrend} color="#16a34a" valueKey="kg"/>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>By food category</div>
          </CardHeader>
          <CardBody style={{ display:'flex', gap:14, alignItems:'center' }}>
            <DonutChart segments={impact.byCategory}/>
            <div style={{ flex:1 }}>
              {impact.byCategory.map((seg, i) => (
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <div style={{ width:9, height:9, borderRadius:3, background:seg.color, flexShrink:0 }}/>
                    <span style={{ fontSize:11, color:'#fff', fontWeight:500, flex:1 }}>{seg.label}</span>
                    <span style={{ fontSize:11, color:seg.color, fontWeight:700 }}>{seg.pct}%</span>
                  </div>
                  <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ width:`${seg.pct}%`, height:'100%', background:seg.color, borderRadius:2 }}/>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Line chart */}
      <Card>
        <CardHeader>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Meals saved per day (this week)</div>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
            Total: {impact.weeklyTrend.reduce((s, d) => s + d.meals, 0).toLocaleString()} meals
          </span>
        </CardHeader>
        <CardBody>
          <LineChart data={impact.weeklyTrend} valueKey="meals" color="#16a34a"/>
        </CardBody>
      </Card>

      {/* Monthly trend */}
      <Card>
        <CardHeader>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Monthly food rescued (kg) — 6-month trend</div>
        </CardHeader>
        <CardBody>
          <BarChart data={impact.monthlyTrend} color="#3b82f6" valueKey="kg"/>
        </CardBody>
      </Card>

      {/* NGO partner table */}
      <Card>
        <CardHeader>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Partner NGOs</div>
          <Badge color="#22c55e">{ngos.filter(n=>n.verified).length} verified</Badge>
        </CardHeader>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {['NGO','Director','Capacity','Meals received','Address','Status'].map(h => (
                  <th key={h} style={{ padding:'8px 18px', textAlign:'left', fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ngos.map(n => (
                <tr key={n.id}
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}
                >
                  <td style={{ padding:'12px 18px', fontSize:13, fontWeight:600, color:'#fff' }}>{n.name}</td>
                  <td style={{ padding:'12px 18px', fontSize:12, color:'rgba(255,255,255,0.45)' }}>{n.director}</td>
                  <td style={{ padding:'12px 18px', fontSize:13, color:'#fff', fontWeight:500 }}>{n.capacity}</td>
                  <td style={{ padding:'12px 18px', fontSize:13, color:'#4ade80', fontWeight:600 }}>{n.mealsReceived.toLocaleString()}</td>
                  <td style={{ padding:'12px 18px', fontSize:12, color:'rgba(255,255,255,0.45)' }}>{n.address}</td>
                  <td style={{ padding:'12px 18px' }}>
                    {n.verified
                      ? <span style={{ padding:'3px 9px', borderRadius:9999, fontSize:11, fontWeight:600, color:'#22c55e', background:'rgba(34,197,94,0.12)' }}>✓ Verified</span>
                      : <span style={{ padding:'3px 9px', borderRadius:9999, fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.06)' }}>Pending</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Volunteer leaderboard */}
      <Card>
        <CardHeader>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Volunteer leaderboard</div>
          <Badge color="#f59e0b">This month</Badge>
        </CardHeader>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {['#','Volunteer','Vehicle','Deliveries','Kg delivered','Rating'].map(h => (
                  <th key={h} style={{ padding:'8px 18px', textAlign:'left', fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...state.volunteers].sort((a,b) => b.kgDelivered - a.kgDelivered).map((v, i) => (
                <tr key={v.id}
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}
                >
                  <td style={{ padding:'12px 18px', fontSize:13, fontWeight:700, color: i===0?'#f59e0b':i===1?'rgba(255,255,255,0.6)':i===2?'#cd7f32':'rgba(255,255,255,0.3)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                  </td>
                  <td style={{ padding:'12px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#94a3b8' }}>{v.avatar}</div>
                      <span style={{ fontSize:13, fontWeight:500, color:'#fff' }}>{v.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 18px', fontSize:12, color:'rgba(255,255,255,0.45)' }}>{v.vehicle}</td>
                  <td style={{ padding:'12px 18px', fontSize:13, color:'#fff', fontWeight:600 }}>{v.deliveries}</td>
                  <td style={{ padding:'12px 18px', fontSize:13, color:'#4ade80', fontWeight:700 }}>{v.kgDelivered.toLocaleString()} kg</td>
                  <td style={{ padding:'12px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ fontSize:12, color: s <= Math.floor(v.rating) ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}>★</span>
                      ))}
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginLeft:4 }}>{v.rating}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
