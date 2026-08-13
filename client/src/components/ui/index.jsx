import React from 'react'
import { spoilageColor } from '../../utils/helpers'

export function Badge({ children, color = '#22c55e', style = {} }) {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:9999,fontSize:11,fontWeight:600,color,background:`${color}1a`,...style }}>
      {children}
    </span>
  )
}

export function Button({ children, variant='primary', size='md', disabled, onClick, style={}, type='button' }) {
  const sizes = { sm:'6px 12px', md:'9px 18px', lg:'12px 24px' }
  const fz    = { sm:12, md:13, lg:15 }
  const vars  = {
    primary:{ background:disabled?'rgba(255,255,255,0.06)':'#16a34a', color:disabled?'rgba(255,255,255,0.2)':'#fff', border:'none' },
    ghost:  { background:'none', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.12)' },
    danger: { background:disabled?'rgba(255,255,255,0.06)':'rgba(239,68,68,0.15)', color:disabled?'rgba(255,255,255,0.2)':'#ef4444', border:'1px solid rgba(239,68,68,0.25)' },
    blue:   { background:'rgba(59,130,246,0.15)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.25)' },
  }
  const v = vars[variant] || vars.primary
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,padding:sizes[size],borderRadius:8,fontSize:fz[size],fontWeight:500,cursor:disabled?'not-allowed':'pointer',fontFamily:'inherit',transition:'all 0.13s',...v,...style }}
      onMouseEnter={e=>{ if(!disabled&&variant==='primary') e.currentTarget.style.background='#15803d' }}
      onMouseLeave={e=>{ if(!disabled&&variant==='primary') e.currentTarget.style.background='#16a34a' }}
    >
      {children}
    </button>
  )
}

export function Card({ children, style={}, padding='0' }) {
  return <div style={{ background:'#111',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,overflow:'hidden',padding,...style }}>{children}</div>
}

export function CardHeader({ children, style={} }) {
  return <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',...style }}>{children}</div>
}

export function CardBody({ children, style={} }) {
  return <div style={{ padding:'16px 18px',...style }}>{children}</div>
}

export function Input({ value, onChange, placeholder, type='text', error, style={} }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${error?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`,background:'#1a1a1a',color:'#fff',fontSize:13,fontFamily:'inherit',outline:'none',transition:'border-color 0.15s',...style }}
      onFocus={e=>e.currentTarget.style.borderColor=error?'rgba(239,68,68,0.7)':'#16a34a'}
      onBlur={e=>e.currentTarget.style.borderColor=error?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}
    />
  )
}

export function Select({ value, onChange, children, error, style={} }) {
  return (
    <select value={value} onChange={onChange}
      style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${error?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`,background:'#1a1a1a',color:value?'#fff':'rgba(255,255,255,0.35)',fontSize:13,fontFamily:'inherit',outline:'none',appearance:'none',...style }}
    >{children}</select>
  )
}

export function FieldLabel({ children, error }) {
  return (
    <label style={{ display:'block',marginBottom:5,fontSize:11,fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',color:error?'#f87171':'rgba(255,255,255,0.38)' }}>
      {children}
      {error && <span style={{ fontWeight:400,textTransform:'none',marginLeft:6 }}>— {error}</span>}
    </label>
  )
}

export function Spinner({ size=28, color='#22c55e' }) {
  return <div style={{ width:size,height:size,borderRadius:'50%',border:`${Math.max(2,size/10)}px solid rgba(255,255,255,0.08)`,borderTopColor:color,animation:'spin 0.75s linear infinite' }} />
}

export function SpoilageBar({ risk, showLabel=true, height=5 }) {
  const color = spoilageColor(risk)
  return (
    <div>
      {showLabel && (
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
          <span style={{ fontSize:11,color:'rgba(255,255,255,0.3)' }}>AI spoilage risk</span>
          <span style={{ fontSize:11,fontWeight:700,color }}>{risk}%</span>
        </div>
      )}
      <div style={{ height,background:'rgba(255,255,255,0.07)',borderRadius:height,overflow:'hidden' }}>
        <div style={{ width:`${risk}%`,height:'100%',background:color,borderRadius:height,transition:'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{ textAlign:'center',padding:'4rem 2rem',color:'rgba(255,255,255,0.22)' }}>
      <div style={{ fontSize:44,marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:15,fontWeight:600,color:'rgba(255,255,255,0.45)',marginBottom:6 }}>{title}</div>
      {subtitle && <div style={{ fontSize:13 }}>{subtitle}</div>}
      {action && <div style={{ marginTop:20 }}>{action}</div>}
    </div>
  )
}

export function SectionTitle({ children, subtitle }) {
  return (
    <div>
      <h2 style={{ fontSize:15,fontWeight:700,color:'#fff',margin:0 }}>{children}</h2>
      {subtitle && <p style={{ fontSize:12,color:'rgba(255,255,255,0.38)',marginTop:3 }}>{subtitle}</p>}
    </div>
  )
}

export function StatCard({ icon, label, value, delta, deltaUp, accentColor='#22c55e' }) {
  return (
    <div style={{ background:'#111',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'1rem 1.25rem' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.38)',marginBottom:6 }}>{label}</div>
          <div style={{ fontSize:26,fontWeight:800,color:'#fff',lineHeight:1 }}>{value}</div>
          {delta && <div style={{ fontSize:11,marginTop:5,color:deltaUp?accentColor:'rgba(255,255,255,0.32)' }}>{delta}</div>}
        </div>
        <span style={{ fontSize:24 }}>{icon}</span>
      </div>
    </div>
  )
}

export function LiveBadge() {
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:12,color:'#22c55e',fontWeight:600,background:'rgba(34,197,94,0.1)',padding:'4px 10px',borderRadius:20 }}>
      <span style={{ width:6,height:6,borderRadius:'50%',background:'#22c55e',display:'inline-block',animation:'pulse-dot 2s infinite' }} />
      Live
    </span>
  )
}
