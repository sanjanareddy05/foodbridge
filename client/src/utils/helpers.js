export const spoilageColor = (r) => r>=70?'#ef4444':r>=40?'#f59e0b':'#22c55e'
export const spoilageBg    = (r) => r>=70?'rgba(239,68,68,0.1)':r>=40?'rgba(245,158,11,0.1)':'rgba(34,197,94,0.1)'
export const spoilageLabel = (r) => r>=70?'High Risk':r>=40?'Moderate':'Low Risk'

export const statusConfig = {
  available:   {label:'Available',  color:'#22c55e',bg:'rgba(34,197,94,0.12)'},
  'in-transit':{label:'In Transit', color:'#3b82f6',bg:'rgba(59,130,246,0.12)'},
  delivered:   {label:'Delivered',  color:'#8b5cf6',bg:'rgba(139,92,246,0.12)'},
  expired:     {label:'Expired',    color:'#ef4444',bg:'rgba(239,68,68,0.12)'},
}

export const roleConfig = {
  ngo:       {label:'NGO',        color:'#22c55e',bg:'rgba(34,197,94,0.12)'},
  restaurant:{label:'Restaurant', color:'#60a5fa',bg:'rgba(96,165,250,0.12)'},
  volunteer: {label:'Volunteer',  color:'#a78bfa',bg:'rgba(167,139,250,0.12)'},
}

export const roleViews = {
  ngo:       ['dashboard','listings','tracking','volunteers','impact'],
  restaurant:['dashboard','listings','add','tracking','impact'],
  volunteer: ['dashboard','tracking','impact'],
  admin:     ['dashboard','listings','add','tracking','volunteers','impact'],
}

export const notifConfig = {
  urgent:  {color:'#ef4444',bg:'rgba(239,68,68,0.1)',  icon:'⚡'},
  tracking:{color:'#3b82f6',bg:'rgba(59,130,246,0.1)', icon:'📍'},
  success: {color:'#22c55e',bg:'rgba(34,197,94,0.1)',  icon:'✓'},
  info:    {color:'#a78bfa',bg:'rgba(167,139,250,0.1)',icon:'ℹ'},
}

export const vehicleIcon = {Car:'🚗',Scooter:'🛵',Bicycle:'🚲'}

export const timeAgo = (iso) => {
  const m = Math.floor((Date.now()-new Date(iso).getTime())/60000)
  if(m<1)return'Just now'; if(m<60)return`${m}m ago`
  const h=Math.floor(m/60); if(h<24)return`${h}h ago`; return`${Math.floor(h/24)}d ago`
}

export const minsUntilDeadline = (dl) => {
  const [h,m]=dl.split(':').map(Number)
  const dlMs=h*3600000+m*60000
  const nowMs=new Date().getHours()*3600000+new Date().getMinutes()*60000
  return Math.max(0,Math.round((dlMs-nowMs)/60000))
}

export const formatTime = (iso) => {
  if(!iso)return'—'
  return new Date(iso).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
}

export const urgencyScore = (l) => {
  const mins=minsUntilDeadline(l.pickupDeadline)
  return l.spoilageRisk*0.6+Math.max(0,100-mins/2)*0.4
}

export const generateQRCode = (listingId) => ({
  code:`FB-${listingId}-${Date.now().toString(36).toUpperCase().slice(-6)}`,
  generatedAt:new Date().toISOString(),
})

export const haversine = (a,b) => {
  const R=6371
  const dLat=(b.lat-a.lat)*Math.PI/180
  const dLng=(b.lng-a.lng)*Math.PI/180
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))
}

export const fmtNum = (n) => n>=1000?`${(n/1000).toFixed(1)}k`:String(n)
