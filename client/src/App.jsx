import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import { useAuth } from './context/AuthContext.tsx'
import { roleViews } from './utils/helpers'
import Navbar from './components/Navbar.jsx'
import Toast from './components/Toast.jsx'
import Dashboard  from './pages/Dashboard.jsx'
import Listings   from './pages/Listings.jsx'
import AddListing from './pages/AddListing.jsx'
import Tracking   from './pages/Tracking.jsx'
import Volunteers from './pages/Volunteers.jsx'
import Impact     from './pages/Impact.jsx'

const PAGES = { dashboard: Dashboard, listings: Listings, add: AddListing, tracking: Tracking, volunteers: Volunteers, impact: Impact }

function AppShell() {
  const { state, dispatch } = useApp()
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (user?.role && user.role !== state.role) dispatch({ type: 'SET_ROLE', payload: user.role })
  }, [user?.role, state.role, dispatch])

  useEffect(() => {
    const path = location.pathname.split('/').filter(Boolean)
    const view = path[1] || 'dashboard'
    const views = roleViews[state.role] || roleViews.ngo
    dispatch({ type: 'SET_VIEW', payload: views.includes(view) && PAGES[view] ? view : 'dashboard' })
  }, [location.pathname, state.role, dispatch])

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(180deg, #060606 0%, #0a0a0a 100%)',color:'#fff',fontFamily:"'Inter',system-ui,sans-serif" }}>
      <Navbar />
      <main style={{ paddingTop:56, minHeight:'100vh' }}>
        <div style={{ maxWidth:1320,margin:'0 auto',padding:'24px 24px 64px' }}>
          {(() => {
            const Component = PAGES[state.currentView] || Dashboard
            return <Component />
          })()}
        </div>
      </main>
      <Toast />
    </div>
  )
}

export default function App() {
  const { user } = useAuth()
  return <AppProvider initialRole={user?.role ?? 'ngo'}><AppShell /></AppProvider>
}
