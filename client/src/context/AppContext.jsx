import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { initialListings, initialNGOs, initialVolunteers, initialNotifications, impactData } from '../data/mockData'
import { api, tokens } from '../lib/api'

export const ACTIONS = {
  ADD_LISTING:'ADD_LISTING', ACCEPT_LISTING:'ACCEPT_LISTING', VERIFY_QR:'VERIFY_QR',
  MARK_DELIVERED:'MARK_DELIVERED', MARK_READ:'MARK_READ', MARK_ALL_READ:'MARK_ALL_READ',
  SET_ROLE:'SET_ROLE', SET_VIEW:'SET_VIEW', SET_FILTER:'SET_FILTER', SET_TOAST:'SET_TOAST', SET_VOLUNTEERS:'SET_VOLUNTEERS',
}

const initialState = {
  listings:initialListings, ngos:initialNGOs, volunteers:initialVolunteers,
  notifications:initialNotifications, impact:impactData,
  role:'ngo', currentView:'dashboard',
  filter:{status:'all',type:'all',sort:'urgency'}, toast:null,
}

function reducer(state, {type, payload}) {
  switch(type) {
    case ACTIONS.ADD_LISTING: {
      const l={...payload,id:`L${String(state.listings.length+1).padStart(3,'0')}`,status:'available',createdAt:new Date().toISOString()}
      const n={id:`NT${Date.now()}`,type:'info',read:false,listingId:l.id,title:`New: ${l.quantity}kg ${l.name}`,desc:`${l.source}`,time:'Just now'}
      return{...state,listings:[l,...state.listings],notifications:[n,...state.notifications]}
    }
    case ACTIONS.ACCEPT_LISTING: {
      const {listingId,volunteerId,ngoId}=payload
      const vol=state.volunteers.find(v=>v.id===volunteerId)
      const n={id:`NT${Date.now()}`,type:'tracking',read:false,listingId,title:`${vol?.name} assigned`,desc:'En route · ETA ~20 min',time:'Just now'}
      return{...state,listings:state.listings.map(l=>l.id===listingId?{...l,status:'in-transit',assignedVolunteer:vol?.name,acceptedAt:new Date().toISOString()}:l),notifications:[n,...state.notifications]}
    }
    case ACTIONS.VERIFY_QR: {
      const l=state.listings.find(x=>x.id===payload.listingId)
      const n={id:`NT${Date.now()}`,type:'success',read:false,listingId:payload.listingId,title:`QR verified`,desc:`${l?.name} · ${payload.qrCode}`,time:'Just now'}
      return{...state,listings:state.listings.map(l=>l.id===payload.listingId?{...l,qrVerified:true,qrCode:payload.qrCode}:l),notifications:[n,...state.notifications]}
    }
    case ACTIONS.MARK_DELIVERED: {
      const l=state.listings.find(x=>x.id===payload.listingId)
      const n={id:`NT${Date.now()}`,type:'success',read:false,listingId:payload.listingId,title:`Delivered — ${l?.name}`,desc:'Mission complete ✓',time:'Just now'}
      return{...state,listings:state.listings.map(l=>l.id===payload.listingId?{...l,status:'delivered',deliveredAt:new Date().toISOString()}:l),notifications:[n,...state.notifications]}
    }
    case ACTIONS.MARK_READ: return{...state,notifications:state.notifications.map(n=>n.id===payload?{...n,read:true}:n)}
    case ACTIONS.MARK_ALL_READ: return{...state,notifications:state.notifications.map(n=>({...n,read:true}))}
    case ACTIONS.SET_ROLE:   return{...state,role:payload}
    case ACTIONS.SET_VIEW:   return{...state,currentView:payload}
    case ACTIONS.SET_FILTER: return{...state,filter:{...state.filter,...payload}}
    case ACTIONS.SET_TOAST:  return{...state,toast:payload}
    case ACTIONS.SET_VOLUNTEERS: return{...state,volunteers:payload}
    default: return state
  }
}

const AppContext = createContext(null)
export function AppProvider({children, initialRole='ngo'}) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, role: initialRole })
  useEffect(() => {
    if (!tokens.access) return

    api.get('/volunteers').then(rows => {
      dispatch({ type: ACTIONS.SET_VOLUNTEERS, payload: rows.map(vol => ({
        id: vol.id,
        name: vol.name,
        phone: vol.phone,
        vehicle: vol.vehicle ? `${vol.vehicle[0].toUpperCase()}${vol.vehicle.slice(1)}` : 'Vehicle not set',
        rating: Number(vol.rating) || 0,
        deliveries: Number(vol.total_deliveries) || 0,
        kgDelivered: Number(vol.kg_delivered) || 0,
        status: vol.is_available ? 'active' : 'busy',
        avatar: vol.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
        joinedAt: vol.created_at,
      })) })
    }).catch(() => {
      // Keep the demo roster when the API is unavailable.
    })
  }, [])
  const showToast = useCallback((message, variant='success') => {
    dispatch({type:ACTIONS.SET_TOAST,payload:{message,variant}})
    setTimeout(()=>dispatch({type:ACTIONS.SET_TOAST,payload:null}),3500)
  }, [])
  return <AppContext.Provider value={{state,dispatch,showToast}}>{children}</AppContext.Provider>
}
export const useApp = () => useContext(AppContext)
