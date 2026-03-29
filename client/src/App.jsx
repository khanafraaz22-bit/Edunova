import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useAuthStore from './store/useAuthStore'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Dashboard from './pages/Dashboard'
import CoursePage from './pages/CoursePage'

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const { init, loading } = useAuthStore()

  useEffect(() => { init() }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-base)', flexDirection: 'column', gap: 14,
      }}>
        <svg viewBox="0 0 160 176" fill="none" style={{ width: 52, height: 57 }}>
          <defs>
            <radialGradient id="lg" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#1a2540"/>
              <stop offset="100%" stopColor="#0D1221"/>
            </radialGradient>
          </defs>
          <path d="M 32 58 Q 30 28 80 26 Q 130 28 128 58 L 128 118 Q 128 142 108 147 L 80 151 L 52 147 Q 32 142 32 118 Z" fill="url(#lg)" stroke="rgba(61,142,240,0.5)" strokeWidth="1.5"/>
          <ellipse cx="60" cy="88" rx="17" ry="12" fill="rgba(8,11,20,0.9)" stroke="rgba(61,142,240,0.5)" strokeWidth="1.2"/>
          <ellipse cx="60" cy="88" rx="9" ry="6" fill="#3D8EF0" opacity="0.7"/>
          <ellipse cx="100" cy="88" rx="17" ry="12" fill="rgba(8,11,20,0.9)" stroke="rgba(61,142,240,0.5)" strokeWidth="1.2"/>
          <ellipse cx="100" cy="88" rx="9" ry="6" fill="#3D8EF0" opacity="0.7"/>
        </svg>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          Edunova
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px' }}>
          LOADING...
        </div>
        <div style={{ width: 160, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            animate={{ x: [-160, 160] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 80, height: '100%', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', borderRadius: 2 }}
          />
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"                element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/login"           element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/signup"          element={<PageWrapper><SignupPage /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/course/:id"      element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}
