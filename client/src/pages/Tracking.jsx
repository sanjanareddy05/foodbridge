import React, { useState } from 'react'
import { useApp, ACTIONS } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.tsx'
import { Card, CardHeader, CardBody, Button, Badge, SpoilageBar, EmptyState, LiveBadge, Spinner } from '../components/ui/index.jsx'
import { spoilageColor, generateQRCode } from '../utils/helpers'

const STEPS = [
  { label:'Listed',       icon:'📋' },
  { label:'NGO Accepted', icon:'✓'  },
  { label:'Assigned',     icon:'👤' },
  { label:'En Route',     icon:'🛵' },
  { label:'QR Verified',  icon:'📱' },
  { label:'Delivered',    icon:'🏠' },
]

const getStep = l =>
  l.status === 'delivered' ? 5 :
  l.qrVerified             ? 4 :
  l.status === 'in-transit'? 3 :
  l.assignedVolunteer      ? 2 :
  l.acceptedAt             ? 1 : 0

function QRModal({ listing, onClose }) {
  const { dispatch, showToast } = useApp()
  const [verified, setVerified] = useState(!!listing.qrVerified)
  const [scanning, setScanning] = useState(false)

  const scan = () => {
    setScanning(true)
    setTimeout(() => {
      const qr = generateQRCode(listing.id)
      dispatch({ type: ACTIONS.VERIFY_QR, payload: { listingId: listing.id, qrCode: qr.code } })
      setVerified(true)
      setScanning(false)
      showToast(`QR ${qr.code} verified — pickup confirmed`, 'success')
    }, 1400)
  }

  const deliver = () => {
    dispatch({ type: ACTIONS.MARK_DELIVERED, payload: { listingId: listing.id } })
    showToast(`${listing.name} marked as delivered ✓`, 'success')
    onClose()
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,backdropFilter:'blur(6px)' }} onClick={onClose}>
      <div style={{ background:'#141414',border:'1px solid rgba(255,255,255,0.1)',borderRadius:18,padding:'2rem',width:360,maxWidth:'92vw',textAlign:'center',animation:'fade-in 0.2s ease' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:16,fontWeight:700,color:'#fff',marginBottom:4 }}>QR Verification</div>
        <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:24 }}>Volunteer scans this at the pickup point</div>

        {/* QR visual */}
        <div style={{ width:180,height:180,margin:'0 auto 16px',background:verified?'#052e16':'#fff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.4s',position:'relative',overflow:'hidden' }}>
          {verified ? (
            <div style={{ fontSize:64,animation:'pop 0.35s ease' }}>✅</div>
          ) : scanning ? (
            <div style={{ position:'relative',width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                <rect width="160" height="160" fill="white"/>
                <rect x="10" y="10" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="4"/>
                <rect x="20" y="20" width="30" height="30" rx="2" fill="#111"/>
                <rect x="100" y="10" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="4"/>
                <rect x="110" y="20" width="30" height="30" rx="2" fill="#111"/>
                <rect x="10" y="100" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="4"/>
                <rect x="20" y="110" width="30" height="30" rx="2" fill="#111"/>
                <rect x="72" y="10" width="8" height="8" fill="#111"/><rect x="72" y="24" width="8" height="8" fill="#111"/>
                <rect x="10" y="72" width="8" height="8" fill="#111"/><rect x="24" y="72" width="8" height="8" fill="#111"/>
                <rect x="72" y="72" width="8" height="8" fill="#16a34a"/>
                <rect x="100" y="72" width="8" height="8" fill="#111"/><rect x="114" y="86" width="8" height="8" fill="#111"/>
                <rect x="100" y="100" width="8" height="8" fill="#111"/><rect x="128" y="100" width="8" height="8" fill="#111"/>
              </svg>
              <div style={{ position:'absolute',left:0,right:0,height:3,background:'rgba(22,163,74,0.7)',top:0,animation:'scan-bar 1.4s ease-in-out infinite',boxShadow:'0 0 8px #16a34a' }}/>
            </div>
          ) : (
            <svg width="160" height="160" viewBox="0 0 160 160">
              <rect width="160" height="160" fill="white"/>
              <rect x="10" y="10" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="4"/>
              <rect x="20" y="20" width="30" height="30" rx="2" fill="#111"/>
              <rect x="100" y="10" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="4"/>
              <rect x="110" y="20" width="30" height="30" rx="2" fill="#111"/>
              <rect x="10" y="100" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="4"/>
              <rect x="20" y="110" width="30" height="30" rx="2" fill="#111"/>
              <rect x="72" y="10" width="8" height="8" fill="#111"/><rect x="72" y="24" width="8" height="8" fill="#111"/>
              <rect x="10" y="72" width="8" height="8" fill="#111"/><rect x="24" y="72" width="8" height="8" fill="#111"/>
              <rect x="72" y="72" width="8" height="8" fill="#16a34a"/>
              <rect x="100" y="72" width="8" height="8" fill="#111"/><rect x="114" y="86" width="8" height="8" fill="#111"/>
              <rect x="100" y="100" width="8" height="8" fill="#111"/>
            </svg>
          )}
        </div>

        <div style={{ fontFamily:'monospace',fontSize:12,color:'rgba(255,255,255,0.4)',background:'#1a1a1a',padding:'6px 12px',borderRadius:6,display:'inline-block',marginBottom:20 }}>
          {listing.qrCode ?? `FB-${listing.id}-PENDING`}
        </div>

        {verified ? (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px',background:'rgba(22,163,74,0.15)',borderRadius:9,fontSize:13,color:'#4ade80',fontWeight:600 }}>
              ✓ Pickup verified successfully
            </div>
            <Button onClick={deliver} style={{ width:'100%' }}>Mark as delivered</Button>
          </div>
        ) : (
          <Button
            onClick={scan}
            disabled={scanning}
            style={{ width:'100%',marginBottom:10,background:scanning?'#0d1f0d':'#16a34a',color:scanning?'#4ade80':'#fff' }}
          >
            {scanning ? '📡 Scanning…' : '📱 Simulate QR scan'}
          </Button>
        )}

        {!verified && (
          <Button variant="ghost" onClick={onClose} style={{ width:'100%',marginTop:8 }}>Close</Button>
        )}
      </div>
      <style>{`@keyframes scan-bar{0%{top:0;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:calc(100% - 3px);opacity:0}} @keyframes pop{0%{transform:scale(0.3)}70%{transform:scale(1.1)}100%{transform:scale(1)}}`}</style>
    </div>
  )
}

export default function Tracking() {
  const { state, dispatch, showToast } = useApp()
  const { user } = useAuth()
  const [qrTarget, setQrTarget] = useState(null)

  const active  = state.listings.filter(l => l.status === 'in-transit')
  const recent  = state.listings.filter(l => l.status === 'delivered').slice(0, 3)

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:16,animation:'fade-in 0.25s ease' }}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <span style={{ fontSize:15,fontWeight:700,color:'#fff' }}>Active pickups</span>
        <LiveBadge />
        <span style={{ marginLeft:'auto',fontSize:12,color:'rgba(255,255,255,0.28)' }}>{active.length} active · {recent.length} delivered today</span>
      </div>

      {/* Empty state */}
      {active.length === 0 && (
        <Card>
          <EmptyState icon="🛵" title="No active pickups" subtitle="Accept a listing from the Listings page to see it tracked here" />
        </Card>
      )}

      {/* Active pickup cards */}
      {active.map(l => {
        const step = getStep(l)
        return (
          <Card key={l.id}>
            <CardHeader>
              <div>
                <div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{l.emoji} {l.name}</div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.38)',marginTop:2 }}>
                  {l.source} → Shelter · Volunteer: <span style={{ color:'#60a5fa' }}>{l.assignedVolunteer ?? 'Assigning…'}</span>
                </div>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                {(user?.role === 'volunteer' || user?.role === 'admin') && <Button variant="ghost" size="sm" onClick={() => setQrTarget(l)}>📱 QR Verify</Button>}
                {(user?.role === 'volunteer' || user?.role === 'admin') && l.qrVerified && l.status !== 'delivered' && (
                  <Button size="sm" onClick={() => {
                    dispatch({ type: ACTIONS.MARK_DELIVERED, payload: { listingId: l.id } })
                    showToast(`${l.name} delivered ✓`, 'success')
                  }}>✓ Mark delivered</Button>
                )}
              </div>
            </CardHeader>

            {/* Step tracker */}
            <CardBody>
              <div style={{ display:'flex',gap:0,overflowX:'auto',paddingBottom:4 }}>
                {STEPS.map((s, i) => {
                  const done = i < step
                  const cur  = i === step
                  return (
                    <div key={i} style={{ flex:1,minWidth:72,display:'flex',flexDirection:'column',alignItems:'center',gap:6,position:'relative' }}>
                      {i < STEPS.length - 1 && (
                        <div style={{ position:'absolute',left:'50%',top:14,right:'-50%',height:2,background:done?'#16a34a':'rgba(255,255,255,0.07)',zIndex:0,transition:'background 0.4s' }} />
                      )}
                      <div style={{ width:28,height:28,borderRadius:'50%',zIndex:1,background:done?'#16a34a':cur?'#0d2a1a':'#181818',border:`2px solid ${done?'#16a34a':cur?'#4ade80':'rgba(255,255,255,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,transition:'all 0.3s',boxShadow:cur?'0 0 0 4px rgba(74,222,128,0.12)':'none' }}>
                        {done ? <span style={{ color:'#fff',fontSize:10,fontWeight:700 }}>✓</span> : <span style={{ opacity:cur?1:0.35,fontSize:11 }}>{s.icon}</span>}
                      </div>
                      <div style={{ fontSize:9.5,color:done?'#4ade80':cur?'#fff':'rgba(255,255,255,0.25)',textAlign:'center',lineHeight:1.3,fontWeight:cur?600:400 }}>{s.label}</div>
                    </div>
                  )
                })}
              </div>

              {/* Info row */}
              <div style={{ display:'flex',gap:10,marginTop:16,flexWrap:'wrap' }}>
                {[['⏱️','ETA','~18 min','#60a5fa'],[l.emoji,'Qty',`${l.quantity} ${l.unit}`,'#fff']].map(([ic,lbl,val,col],i)=>(
                  <div key={i} style={{ background:'#1a1a1a',borderRadius:9,padding:'9px 13px',display:'flex',gap:8,alignItems:'center',flex:1,minWidth:100 }}>
                    <span style={{ fontSize:18 }}>{ic}</span>
                    <div>
                      <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)' }}>{lbl}</div>
                      <div style={{ fontSize:14,fontWeight:700,color:col }}>{val}</div>
                    </div>
                  </div>
                ))}
                <div style={{ background:'#1a1a1a',borderRadius:9,padding:'9px 13px',flex:1,minWidth:140 }}>
                  <SpoilageBar risk={l.spoilageRisk} />
                </div>
                {l.qrVerified && (
                  <div style={{ background:'rgba(22,163,74,0.08)',border:'1px solid rgba(22,163,74,0.2)',borderRadius:9,padding:'9px 13px',flex:1,minWidth:140,display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:18 }}>✅</span>
                    <div>
                      <div style={{ fontSize:10,color:'rgba(22,163,74,0.55)' }}>QR verified</div>
                      <div style={{ fontSize:10,fontFamily:'monospace',color:'#4ade80' }}>{l.qrCode}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )
      })}

      {/* Recently delivered */}
      {recent.length > 0 && (
        <>
          <div style={{ fontSize:14,fontWeight:600,color:'#fff',marginTop:4 }}>Recently delivered</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
            {recent.map(l => (
              <Card key={l.id} padding="14px 16px">
                <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:8 }}>
                  <span style={{ fontSize:24 }}>{l.emoji}</span>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600,color:'#fff' }}>{l.name}</div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)' }}>{l.quantity} {l.unit} · {l.source}</div>
                  </div>
                </div>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                  <Badge color="#8b5cf6">✓ Delivered</Badge>
                  {l.qrVerified && <Badge color="#22c55e">QR verified</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {qrTarget && <QRModal listing={qrTarget} onClose={() => setQrTarget(null)} />}
    </div>
  )
}
