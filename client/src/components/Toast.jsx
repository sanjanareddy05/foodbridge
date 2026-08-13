import React from 'react'
import { useApp } from '../context/AppContext.jsx'

const VARIANTS = {
  success: { bg:'#052e16', border:'#166534', iconBg:'#166534', iconColor:'#4ade80', icon:'✓' },
  error:   { bg:'#450a0a', border:'#991b1b', iconBg:'#991b1b', iconColor:'#f87171', icon:'✕' },
  info:    { bg:'#172554', border:'#1d4ed8', iconBg:'#1d4ed8', iconColor:'#93c5fd', icon:'ℹ' },
  warning: { bg:'#422006', border:'#92400e', iconBg:'#92400e', iconColor:'#fcd34d', icon:'⚠' },
}

export default function Toast() {
  const { state } = useApp()
  const t = state.toast
  const v = VARIANTS[t?.variant ?? 'success']
  return (
    <div style={{ position:'fixed',bottom:'1.5rem',right:'1.5rem',zIndex:9999,transform:t?'translateY(0)':'translateY(120px)',opacity:t?1:0,transition:'all 0.3s cubic-bezier(.16,1,.3,1)',pointerEvents:t?'auto':'none' }}>
      {t && (
        <div style={{ display:'flex',alignItems:'center',gap:12,background:v.bg,border:`1px solid ${v.border}`,borderRadius:12,padding:'12px 18px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',maxWidth:360,color:'#fff',fontSize:13,animation:'slide-up 0.3s ease' }}>
          <span style={{ width:24,height:24,borderRadius:'50%',background:v.iconBg,color:v.iconColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0 }}>{v.icon}</span>
          <span style={{ lineHeight:1.45 }}>{t.message}</span>
        </div>
      )}
    </div>
  )
}
