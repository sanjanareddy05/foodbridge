import React, { useState } from 'react'
import { useApp, ACTIONS } from '../context/AppContext.jsx'
import { roleConfig } from '../utils/helpers'

const NAV = [
  { id:'dashboard',  label:'Dashboard',   icon:'◈' },
  { id:'listings',   label:'Listings',    icon:'≡' },
  { id:'add',        label:'Add Surplus', icon:'+' },
  { id:'tracking',   label:'Live Track',  icon:'◎' },
  { id:'volunteers', label:'Volunteers',  icon:'⬡' },
  { id:'impact',     label:'Impact',      icon:'▲' },
]

export default function Navbar() {
  const { state, dispatch, showToast } = useApp()
  const [roleOpen, setRoleOpen] = useState(false)

  const unread   = state.notifications.filter(n => !n.read).length
  const rc       = roleConfig[state.role]
  const setView  = v => { dispatch({ type: ACTIONS.SET_VIEW, payload: v }); setRoleOpen(false) }
  const setRole  = r => {
    dispatch({ type: ACTIONS.SET_ROLE, payload: r })
    showToast(`Switched to ${roleConfig[r].label} view`, 'info')
    setRoleOpen(false)
  }

  const availCount = state.listings.filter(l => l.status === 'available').length

  return (
    <>
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:200,
        height:56,display:'flex',alignItems:'center',padding:'0 20px',gap:8,
        background:'rgba(8,8,8,0.96)',backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Logo */}
        <div style={{ display:'flex',alignItems:'center',gap:9,marginRight:16,flexShrink:0 }}>
          <div style={{ width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#16a34a,#4ade80)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>🌿</div>
          <span style={{ fontWeight:800,fontSize:15,color:'#fff',letterSpacing:'-0.3px' }}>FoodBridge</span>
          <span style={{ fontSize:10,color:'rgba(255,255,255,0.25)',fontWeight:400,marginLeft:-4 }}>v1.0</span>
        </div>

        {/* Nav items */}
        <div style={{ display:'flex',gap:2,flex:1,justifyContent:'center' }}>
          {NAV.map(item => {
            const active = state.currentView === item.id
            return (
              <button key={item.id} onClick={() => setView(item.id)}
                style={{
                  display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:7,
                  border:'none',background:active?'rgba(22,163,74,0.18)':'none',
                  color:active?'#4ade80':'rgba(255,255,255,0.45)',
                  fontSize:12,fontWeight:active?700:400,cursor:'pointer',
                  fontFamily:'inherit',transition:'all 0.12s',position:'relative',
                }}
                onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,0.06)' }}
                onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='none' }}
              >
                <span style={{ fontSize:10,opacity:0.7 }}>{item.icon}</span>
                {item.label}
                {item.id === 'listings' && availCount > 0 && (
                  <span style={{ position:'absolute',top:2,right:2,background:'#16a34a',color:'#fff',borderRadius:9999,padding:'0 5px',fontSize:9,fontWeight:800,lineHeight:'14px' }}>
                    {availCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
          {/* Role switcher */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setRoleOpen(o => !o)}
              style={{ display:'flex',alignItems:'center',gap:7,padding:'5px 12px 5px 9px',borderRadius:20,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit' }}
            >
              <span style={{ width:6,height:6,borderRadius:'50%',background:rc.color,flexShrink:0 }} />
              {rc.label}
              <span style={{ fontSize:9,opacity:0.45,marginLeft:2 }}>▾</span>
            </button>
            {roleOpen && (
              <div style={{ position:'absolute',top:38,right:0,background:'#161616',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,overflow:'hidden',minWidth:160,boxShadow:'0 8px 32px rgba(0,0,0,0.6)',zIndex:300 }}>
                {['ngo','restaurant','volunteer'].map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    style={{ display:'block',width:'100%',padding:'10px 16px',background:state.role===r?'rgba(22,163,74,0.15)':'none',color:state.role===r?'#4ade80':'rgba(255,255,255,0.65)',border:'none',textAlign:'left',fontSize:13,cursor:'pointer',fontFamily:'inherit',transition:'background 0.12s' }}
                    onMouseEnter={e=>{ if(state.role!==r) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
                    onMouseLeave={e=>{ if(state.role!==r) e.currentTarget.style.background='none' }}
                  >
                    {roleConfig[r].label} view
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification bell */}
          <button onClick={() => setView('dashboard')}
            style={{ position:'relative',width:34,height:34,borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}
          >
            🔔
            {unread > 0 && (
              <span style={{ position:'absolute',top:5,right:5,width:7,height:7,borderRadius:'50%',background:'#ef4444',border:'2px solid #080808' }} />
            )}
          </button>
        </div>
      </nav>
      {roleOpen && <div style={{ position:'fixed',inset:0,zIndex:199 }} onClick={() => setRoleOpen(false)} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse-dot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:0.5}} @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </>
  )
}
