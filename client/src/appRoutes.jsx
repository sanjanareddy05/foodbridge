import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/auth', element: <AuthPage /> },
  { path: '/app/*', element: <App /> },
])

export default function AppRoutes() {
  return <RouterProvider router={router} />
}
