export const FOOD_TYPE_LABELS = {
  cooked_meals:'Cooked Meals',bakery:'Bakery',raw_produce:'Raw Produce',
  dairy:'Dairy',catering_event:'Catering / Event',packaged_food:'Packaged Food',
}
export const FOOD_TYPE_EMOJIS = {
  cooked_meals:'🍛',bakery:'🍞',raw_produce:'🥦',
  dairy:'🥛',catering_event:'🎊',packaged_food:'📦',
}
export const STORAGE_LABELS = {
  room_temperature:'Room Temperature',refrigerated:'Refrigerated',
  hot_heated:'Hot / Heated',frozen:'Frozen',
}
export const STATUS_CONFIG = {
  available:  {label:'Available',  color:'#22c55e',bg:'rgba(34,197,94,0.12)'},
  in_transit: {label:'In Transit', color:'#3b82f6',bg:'rgba(59,130,246,0.12)'},
  delivered:  {label:'Delivered',  color:'#8b5cf6',bg:'rgba(139,92,246,0.12)'},
  expired:    {label:'Expired',    color:'#ef4444',bg:'rgba(239,68,68,0.12)'},
  cancelled:  {label:'Cancelled',  color:'#6b7280',bg:'rgba(107,114,128,0.12)'},
}
export const VEHICLE_ICONS = {Car:'🚗',Scooter:'🛵',Bicycle:'🚲',Van:'🚐'}
export const NOTIF_CONFIG = {
  urgent:  {color:'#ef4444',bg:'rgba(239,68,68,0.1)',  icon:'⚡'},
  tracking:{color:'#3b82f6',bg:'rgba(59,130,246,0.1)', icon:'📍'},
  success: {color:'#22c55e',bg:'rgba(34,197,94,0.1)',  icon:'✓'},
  info:    {color:'#a78bfa',bg:'rgba(167,139,250,0.1)',icon:'ℹ'},
  system:  {color:'#6b7280',bg:'rgba(107,114,128,0.1)',icon:'⚙'},
}
export const spoilageColor = (r) => r>=70?'#ef4444':r>=40?'#f59e0b':'#22c55e'
export const timeAgo = (iso) => {
  const m=Math.floor((Date.now()-new Date(iso).getTime())/60000)
  if(m<1)return'Just now';if(m<60)return`${m}m ago`
  const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`
}
export const minsUntilDeadline = (dl) => Math.max(0,Math.round((new Date(dl).getTime()-Date.now())/60000))
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
export const urgencyScore = (l) => { const m=minsUntilDeadline(l.pickupDeadline); return l.spoilageRisk*0.6+Math.max(0,100-m/2)*0.4 }
export const FOOD_TYPES=['cooked_meals','bakery','raw_produce','dairy','catering_event','packaged_food']
export const STORAGE_CONDITIONS=['room_temperature','refrigerated','hot_heated','frozen']
