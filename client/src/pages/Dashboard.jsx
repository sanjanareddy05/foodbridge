import React from 'react'
import { useApp, ACTIONS } from '../context/AppContext.jsx'
import { StatCard, Card, CardHeader, CardBody, SpoilageBar } from '../components/ui/index.jsx'
import { statusConfig, notifConfig, timeAgo, spoilageColor } from '../utils/helpers'
import { roleConfig } from '../utils/helpers'

export default function Dashboard() {
  const { state, dispatch, showToast } = useApp()
  const { impact, listings, notifications } = state
  const role = state.role
  const roleLabel = roleConfig[role]?.label || 'Workspace'
  const stats = role === 'restaurant'
    ? [
        ['🍽️', 'Meals donated today', impact.mealsToday, '↑ 18% vs yesterday'],
        ['📋', 'Your active listings', listings.filter(l => l.status === 'available').length, `${listings.filter(l => l.status === 'in-transit').length} in transit`],
        ['🛵', 'Pickup teams active', impact.volunteersActive, 'Assigned to your listings'],
        ['⚖️', 'Food donated (MTD)', `${(impact.kgRescuedMTD/1000).toFixed(1)}t`, '↑ this week'],
      ]
    : role === 'volunteer'
      ? [
          ['🛵', 'My active pickups', listings.filter(l => l.status === 'in-transit').length, 'Current assignments'],
          ['📋', 'Available opportunities', listings.filter(l => l.status === 'available').length, 'Nearby listings'],
          ['✓', 'Deliveries completed', impact.mealsToday, 'This month'],
          ['⚖️', 'Food delivered (MTD)', `${(impact.kgRescuedMTD/1000).toFixed(1)}t`, '↑ this week'],
        ]
      : [
          ['🍽️', 'Meals saved today', impact.mealsToday, '↑ 18% vs yesterday'],
          ['📋', 'Active listings', listings.filter(l => l.status === 'available').length, `${listings.filter(l => l.status === 'in-transit').length} in transit`],
          ['🛵', 'Volunteers active', impact.volunteersActive, '2 pending assignment'],
          ['⚖️', 'Food rescued (MTD)', `${(impact.kgRescuedMTD/1000).toFixed(1)}t`, '↑ this week'],
        ]

  const markRead = id => dispatch({ type: ACTIONS.MARK_READ, payload: id })
  const markAll  = () => { dispatch({ type: ACTIONS.MARK_ALL_READ }); showToast('All notifications marked read', 'info') }
  const unread   = notifications.filter(n => !n.read).length

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:18,animation:'fade-in 0.25s ease' }}>

      {/* ── Stat row ── */}
      <div>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:22,fontWeight:800 }}>{roleLabel} dashboard</div>
          <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:4 }}>Rescue operations for your {roleLabel.toLowerCase()} workspace</div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12 }}>
        {stats.map(([icon,label,value,delta]) => <StatCard key={label} icon={icon} label={label} value={value} delta={delta} deltaUp />)}
        </div>
      </div>

      {/* ── Notifications + Map ── */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ fontSize:14,fontWeight:700,color:'#fff' }}>Alerts</span>
              {unread > 0 && <span style={{ background:'#ef4444',color:'#fff',borderRadius:9999,padding:'1px 7px',fontSize:10,fontWeight:800 }}>{unread}</span>}
            </div>
            <button onClick={markAll} style={{ fontSize:12,color:'#4ade80',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit' }}>Mark all read</button>
          </CardHeader>
          <div style={{ maxHeight:300,overflowY:'auto' }}>
            {notifications.map(n => {
              const nc = notifConfig[n.type]
              return (
                <div key={n.id} onClick={() => markRead(n.id)}
                  style={{ display:'flex',gap:12,padding:'11px 18px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',background:n.read?'none':'rgba(22,163,74,0.03)',transition:'background 0.12s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                  onMouseLeave={e=>e.currentTarget.style.background=n.read?'none':'rgba(22,163,74,0.03)'}
                >
                  <div style={{ width:32,height:32,borderRadius:9,flexShrink:0,background:nc.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:nc.color }}>{nc.icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',gap:8 }}>
                      <span style={{ fontSize:12,fontWeight:n.read?400:600,color:'#fff',lineHeight:1.3 }}>{n.title}</span>
                      <span style={{ fontSize:10,color:'rgba(255,255,255,0.25)',flexShrink:0 }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,0.38)',marginTop:3,lineHeight:1.35 }}>{n.desc}</div>
                  </div>
                  {!n.read && <div style={{ width:6,height:6,borderRadius:'50%',background:'#4ade80',flexShrink:0,marginTop:4 }} />}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Live Map SVG */}
        <Card>
          <CardHeader>
            <span style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{roleLabel} live map — 5 km radius</span>
            <span style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#4ade80',fontWeight:600 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:'#4ade80',animation:'pulse-dot 2s infinite',display:'inline-block' }} />Live
            </span>
          </CardHeader>
          <svg viewBox="0 0 400 260" style={{ width:'100%',height:260,display:'block' }}>
            <rect width="400" height="260" fill="#0d0d0d"/>
            {[65,130,195].map(y=><line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#181818" strokeWidth="14"/>)}
            {[100,200,300].map(x=><line key={x} x1={x} y1="0" x2={x} y2="260" stroke="#181818" strokeWidth="14"/>)}
            {[32,97,162,227].map(y=><line key={`m${y}`} x1="0" y1={y} x2="400" y2={y} stroke="#141414" strokeWidth="4"/>)}
            {[50,150,250,350].map(x=><line key={`m${x}`} x1={x} y1="0" x2={x} y2="260" stroke="#141414" strokeWidth="4"/>)}
            <polyline points="200,130 155,130 118,100 95,100" stroke="#16a34a" strokeWidth="2" fill="none" strokeDasharray="5,3" opacity="0.8"/>
            <polyline points="200,130 248,130 290,65" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5,3" opacity="0.8"/>
            <polyline points="200,130 200,185 108,195" stroke="#d97706" strokeWidth="2" fill="none" strokeDasharray="5,3" opacity="0.6"/>
            {[
              {cx:95,cy:100,em:'🍛',label:'Spice Route',c:'#ef4444'},
              {cx:290,cy:65,em:'🍞',label:'Sunrise Bkry',c:'#22c55e'},
              {cx:108,cy:195,em:'🎊',label:'Raj Hall',c:'#d97706'},
              {cx:316,cy:188,em:'🍲',label:'Grand Hotel',c:'#3b82f6'},
            ].map((p,i)=>(
              <g key={i}>
                <circle cx={p.cx} cy={p.cy} r="16" fill={p.c} opacity="0.12"/>
                <circle cx={p.cx} cy={p.cy} r="11" fill={p.c} opacity="0.9"/>
                <text x={p.cx} y={p.cy+4} textAnchor="middle" fontSize="9">{p.em}</text>
                <rect x={p.cx-30} y={p.cy+14} width="60" height="13" rx="4" fill="#1a1a1a"/>
                <text x={p.cx} y={p.cy+24} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7.5" fontFamily="system-ui">{p.label}</text>
              </g>
            ))}
            <circle cx="200" cy="130" r="20" fill="#16a34a" opacity="0.15"/>
            <circle cx="200" cy="130" r="13" fill="#16a34a"/>
            <text x="200" y="135" textAnchor="middle" fontSize="11" fill="white">★</text>
            <text x="200" y="151" textAnchor="middle" fill="#4ade80" fontSize="8" fontWeight="700" fontFamily="system-ui">Your {roleLabel}</text>
            <circle cx="162" cy="120" r="8" fill="#3b82f6" opacity="0.9"/>
            <text x="162" y="124" textAnchor="middle" fontSize="7">🛵</text>
            <rect x="8" y="8" width="108" height="54" rx="6" fill="#111" stroke="#222" strokeWidth="0.5"/>
            <circle cx="20" cy="22" r="4.5" fill="#ef4444"/><text x="29" y="26" fill="rgba(255,255,255,0.45)" fontSize="7.5" fontFamily="system-ui">Food source</text>
            <circle cx="20" cy="37" r="4.5" fill="#16a34a"/><text x="29" y="41" fill="rgba(255,255,255,0.45)" fontSize="7.5" fontFamily="system-ui">NGO / recipient</text>
            <circle cx="20" cy="52" r="4.5" fill="#3b82f6"/><text x="29" y="56" fill="rgba(255,255,255,0.45)" fontSize="7.5" fontFamily="system-ui">Volunteer</text>
          </svg>
        </Card>
      </div>

      {/* ── Recent activity table ── */}
      <Card>
        <CardHeader>
          <span style={{ fontSize:14,fontWeight:700,color:'#fff' }}>Recent activity</span>
          <button onClick={() => dispatch({ type:ACTIONS.SET_VIEW, payload:'listings' })}
            style={{ fontSize:12,color:'#4ade80',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit' }}>
            View all →
          </button>
        </CardHeader>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',minWidth:600 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {['Food','Source','Qty','AI Risk','Deadline','Status','Posted'].map(h=>(
                  <th key={h} style={{ padding:'8px 18px',textAlign:'left',fontSize:11,color:'rgba(255,255,255,0.3)',fontWeight:500,letterSpacing:'0.05em',textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.slice(0,6).map(l => {
                const sc  = statusConfig[l.status] || statusConfig.available
                const rc  = spoilageColor(l.spoilageRisk)
                return (
                  <tr key={l.id}
                    style={{ borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',transition:'background 0.1s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}
                    onClick={()=>dispatch({type:ACTIONS.SET_VIEW,payload:'listings'})}
                  >
                    <td style={{ padding:'10px 18px',fontSize:13,color:'#fff',fontWeight:500 }}>{l.emoji} {l.name}</td>
                    <td style={{ padding:'10px 18px',fontSize:12,color:'rgba(255,255,255,0.45)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{l.source}</td>
                    <td style={{ padding:'10px 18px',fontSize:13,color:'#fff',fontWeight:600 }}>{l.quantity} {l.unit}</td>
                    <td style={{ padding:'10px 18px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                        <div style={{ width:44,height:4,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden' }}>
                          <div style={{ width:`${l.spoilageRisk}%`,height:'100%',background:rc,borderRadius:2 }}/>
                        </div>
                        <span style={{ fontSize:11,color:rc,fontWeight:700 }}>{l.spoilageRisk}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 18px',fontSize:12,color:'rgba(255,255,255,0.45)' }}>{l.pickupDeadline}</td>
                    <td style={{ padding:'10px 18px' }}>
                      <span style={{ padding:'3px 9px',borderRadius:9999,fontSize:11,fontWeight:600,color:sc.color,background:sc.bg }}>{sc.label}</span>
                    </td>
                    <td style={{ padding:'10px 18px',fontSize:11,color:'rgba(255,255,255,0.25)' }}>{timeAgo(l.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
