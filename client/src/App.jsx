import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/useAuthStore'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Dashboard from './pages/Dashboard'
import CoursePage from './pages/CoursePage'

export default function App() {
  const { init, loading } = useAuthStore()

  useEffect(() => { init() }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#02020e', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif', fontSize: 28, fontWeight: 900,
          background: 'linear-gradient(135deg, #00f5ff, #9b5de5)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: 4,
        }}>
          EDUNOVA
        </div>
        <div style={{ color: '#7c83a0', fontSize: 13, letterSpacing: 2, fontFamily: 'Rajdhani, sans-serif' }}>
          INITIALIZING...
        </div>
        <div style={{
          width: 180, height: 3, background: 'rgba(255,255,255,0.08)',
          borderRadius: 2, overflow: 'hidden', marginTop: 8,
        }}>
          <div style={{
            width: '60%', height: '100%',
            background: 'linear-gradient(90deg, #00f5ff, #9b5de5)',
            animation: 'shimmer 1.5s linear infinite',
            backgroundSize: '200% 100%',
          }} />
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/"                element={<LandingPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/signup"          element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/course/:id"      element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
      <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
  )
}
