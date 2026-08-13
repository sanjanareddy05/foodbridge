import React, { useState, useMemo } from 'react'
import { useApp, ACTIONS } from '../context/AppContext.jsx'
import { useListingActions } from '../hooks'
import { Card, CardHeader, Button, Badge, SpoilageBar, EmptyState } from '../components/ui/index.jsx'
import { statusConfig, spoilageColor, minsUntilDeadline, urgencyScore } from '../utils/helpers'
import { FOOD_TYPES } from '../data/mockData'

function AcceptModal({ listing, onClose }) {
  const { state, dispatch, showToast } = useApp()
  const { accept } = useListingActions()
  const [vid, setVid] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const avail = state.volunteers.filter(v => v.status === 'active')

  const confirm = () => {
    if (!vid) return
    if (accept) {
      accept(listing.id, vid).then(() => {
        showToast(`${listing.name} assigned`, 'success')
        onClose()
      }).catch(e => {
        showToast('Failed to accept pickup', 'error')
        console.error(e)
      })
      return
    }
    // fallback to local dispatch in demo mode
    dispatch({ type: ACTIONS.ACCEPT_LISTING, payload: { listingId: listing.id, volunteerId: vid, ngoId: 'N01' } })
    showToast(`${listing.name} assigned to ${avail.find(v => v.id === vid)?.name}`, 'success')
    onClose()
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.72)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,backdropFilter:'blur(5px)' }} onClick={onClose}>
      <div style={{ background:'#141414',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,padding:'1.75rem',width:420,maxWidth:'92vw',animation:'fade-in 0.2s ease' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:17,fontWeight:700,color:'#fff',marginBottom:4 }}>Accept pickup</div>
        <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:20 }}>Assign a volunteer to collect this listing</div>

        {/* Listing summary */}
        <div style={{ background:'#1a1a1a',borderRadius:10,padding:'12px 14px',marginBottom:18 }}>
          <div style={{ fontSize:14,fontWeight:600,color:'#fff',marginBottom:4 }}>{listing.emoji} {listing.name}</div>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.38)',marginBottom:8 }}>{listing.source} · {listing.quantity} {listing.unit} · Deadline {listing.pickupDeadline}</div>
          <SpoilageBar risk={listing.spoilageRisk} />
        </div>

        {/* Volunteer list */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display:'flex',gap:8,marginBottom:8 }}>
            <Button size="sm" variant="ghost" onClick={async ()=>{
              setSuggestLoading(true)
              try {
                const resp = await fetch('/api/match', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ listingId: listing.id, limit:5 }) })
                const json = await resp.json()
                if (resp.ok) setSuggestions(json.suggestions)
              } catch (e) { console.error(e) }
              setSuggestLoading(false)
            }}>{suggestLoading ? 'Suggesting…' : 'Suggest volunteers'}</Button>
            {suggestions.length > 0 && <div style={{ alignSelf:'center',color:'rgba(255,255,255,0.36)',fontSize:12 }}>{suggestions.length} suggestions</div>}
          </div>

          {suggestions.map(s => (
            <div key={s.volunteerId} onClick={() => setVid(s.volunteerId)}
              style={{ display:'flex',alignItems:'center',gap:10,padding:10,borderRadius:8,marginBottom:8,cursor:'pointer',border:`1px solid ${vid===s.volunteerId?'#16a34a':'rgba(255,255,255,0.04)'}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,color:'#fff',fontWeight:600 }}>{s.name} · {s.vehicle}</div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.36)' }}>ETA ~{s.etaMin ?? '—'} min · {s.distanceKm ?? '—'} km · ⭐ {s.rating}</div>
              </div>
              <div style={{ width:64,textAlign:'right',fontSize:12,color: s.score >= 70 ? '#bbf7d0' : s.score >= 40 ? '#fde68a' : '#fca5a5' }}>{s.score}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11,fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',color:'rgba(255,255,255,0.38)',marginBottom:8 }}>Select volunteer</div>
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:20 }}>
          {avail.map(v => (
            <div key={v.id} onClick={() => setVid(v.id)}
              style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,border:`1px solid ${vid===v.id?'#16a34a':'rgba(255,255,255,0.08)'}`,background:vid===v.id?'rgba(22,163,74,0.1)':'none',cursor:'pointer',transition:'all 0.12s' }}
            >
              <div style={{ width:36,height:36,borderRadius:'50%',background:'#1e293b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#94a3b8',flexShrink:0 }}>{v.avatar}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:500,color:'#fff' }}>{v.name}</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:1 }}>{v.vehicle} · {v.deliveries} deliveries · ⭐ {v.rating}</div>
              </div>
              {vid === v.id && <span style={{ color:'#4ade80',fontSize:16 }}>✓</span>}
            </div>
          ))}
          {avail.length === 0 && <div style={{ textAlign:'center',padding:'1.5rem',color:'rgba(255,255,255,0.3)',fontSize:13 }}>No volunteers available right now</div>}
        </div>

        <div style={{ display:'flex',gap:10 }}>
          <Button variant="ghost" onClick={onClose} style={{ flex:1 }}>Cancel</Button>
          <Button onClick={confirm} disabled={!vid} style={{ flex:2 }}>Confirm pickup</Button>
        </div>
      </div>
    </div>
  )
}

export default function Listings() {
  const { state, dispatch } = useApp()
  const [target, setTarget] = useState(null)
  const [search, setSearch] = useState('')
  const { filter } = state

  const filtered = useMemo(() => {
    let list = [...state.listings]
    if (filter.status !== 'all') list = list.filter(l => l.status === filter.status)
    if (filter.type   !== 'all') list = list.filter(l => l.type   === filter.type)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(l => l.name.toLowerCase().includes(q) || l.source.toLowerCase().includes(q))
    }
    if (filter.sort === 'urgency')  list.sort((a, b) => urgencyScore(b) - urgencyScore(a))
    if (filter.sort === 'distance') list.sort((a, b) => a.distance - b.distance)
    if (filter.sort === 'quantity') list.sort((a, b) => b.quantity - a.quantity)
    return list
  }, [state.listings, filter, search])

  const setF = p => dispatch({ type: ACTIONS.SET_FILTER, payload: p })

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14,animation:'fade-in 0.25s ease' }}>

      {/* Filter bar */}
      <div style={{ background:'#111',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'12px 16px',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
        {/* Search */}
        <div style={{ position:'relative',flex:1,minWidth:180 }}>
          <span style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'rgba(255,255,255,0.22)',pointerEvents:'none' }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search food or source…"
            style={{ width:'100%',padding:'8px 12px 8px 30px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'#1a1a1a',color:'#fff',fontSize:13,fontFamily:'inherit',outline:'none' }}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display:'flex',gap:3,background:'#1a1a1a',borderRadius:8,padding:3 }}>
          {['all','available','in-transit','delivered'].map(s => (
            <button key={s} onClick={() => setF({ status:s })}
              style={{ padding:'5px 10px',borderRadius:6,border:'none',fontSize:11,fontWeight:500,background:filter.status===s?'#16a34a':'none',color:filter.status===s?'#fff':'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'inherit',transition:'all 0.12s',textTransform:'capitalize' }}
            >{s === 'all' ? 'All' : s}</button>
          ))}
        </div>

        {/* Type filter */}
        <select value={filter.type} onChange={e => setF({ type: e.target.value })}
          style={{ padding:'7px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'#1a1a1a',color:filter.type==='all'?'rgba(255,255,255,0.38)':'#fff',fontSize:12,fontFamily:'inherit',outline:'none' }}
        >
          <option value="all">All types</option>
          {FOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Sort */}
        <select value={filter.sort} onChange={e => setF({ sort: e.target.value })}
          style={{ padding:'7px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'#1a1a1a',color:'#fff',fontSize:12,fontFamily:'inherit',outline:'none' }}
        >
          <option value="urgency">↑ Urgency</option>
          <option value="distance">↑ Distance</option>
          <option value="quantity">↑ Quantity</option>
        </select>

        <span style={{ fontSize:12,color:'rgba(255,255,255,0.25)',marginLeft:'auto',flexShrink:0 }}>{filtered.length} listing{filtered.length!==1?'s':''}</span>
      </div>

      {/* Cards grid */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
        {filtered.map(l => {
          const sc   = statusConfig[l.status] || statusConfig.available
          const mins = minsUntilDeadline(l.pickupDeadline)
          const urgent = l.spoilageRisk >= 70 && l.status === 'available'
          return (
            <div key={l.id} style={{ background:'#111',border:`1px solid ${urgent?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.07)'}`,borderRadius:14,overflow:'hidden',transition:'border-color 0.15s' }}>
              {/* Header */}
              <div style={{ padding:'14px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10 }}>
                <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
                  <span style={{ fontSize:26,lineHeight:1,flexShrink:0 }}>{l.emoji}</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:600,color:'#fff' }}>{l.name}</div>
                    <div style={{ fontSize:12,color:'rgba(255,255,255,0.38)',marginTop:2 }}>{l.source}</div>
                  </div>
                </div>
                <span style={{ padding:'3px 9px',borderRadius:9999,fontSize:11,fontWeight:600,color:sc.color,background:sc.bg,flexShrink:0 }}>{sc.label}</span>
              </div>

              {/* Meta */}
              <div style={{ padding:'11px 16px',display:'flex',gap:14,flexWrap:'wrap' }}>
                {[['⚖️',`${l.quantity} ${l.unit}`],['📍',`${l.distance} km`],['⏰',`By ${l.pickupDeadline}`],['❄️',l.storage]].map(([ic,val],i)=>(
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,color:'rgba(255,255,255,0.45)' }}><span>{ic}</span><span>{val}</span></div>
                ))}
              </div>

              {/* Spoilage */}
              <div style={{ padding:'0 16px 12px' }}>
                <SpoilageBar risk={l.spoilageRisk} />
                {mins < 120 && l.status === 'available' && (
                  <div style={{ marginTop:5,fontSize:11,color:'#f87171',fontWeight:500 }}>⚡ {mins} min until deadline</div>
                )}
              </div>

              {/* Notes */}
              {l.notes && (
                <div style={{ margin:'0 16px 12px',padding:'7px 10px',background:'rgba(255,255,255,0.03)',borderRadius:7,fontSize:12,color:'rgba(255,255,255,0.32)',fontStyle:'italic' }}>{l.notes}</div>
              )}

              {/* Footer */}
              <div style={{ padding:'10px 16px',borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:12,color:'rgba(255,255,255,0.28)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                  {l.assignedVolunteer ? `👤 ${l.assignedVolunteer}` : `⚠️ ${l.allergens}`}
                </span>
                {l.status === 'available'    && <Button onClick={() => setTarget(l)} size="sm">Accept pickup</Button>}
                {l.status === 'in-transit'   && <Badge color="#3b82f6">🔵 En route</Badge>}
                {l.status === 'delivered'    && <Badge color="#8b5cf6">✓ Delivered</Badge>}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState icon="🔍" title="No listings match your filters" subtitle="Try adjusting the status, type, or search query" />
      )}

      {target && <AcceptModal listing={target} onClose={() => setTarget(null)} />}
    </div>
  )
}
