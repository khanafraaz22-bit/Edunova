import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { forgotPassword } from '../api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
      toast.success('Reset link sent if account exists')
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#02020e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: '30%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 28, background: 'linear-gradient(135deg, #00f5ff, #9b5de5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 3 }}>
              EDUNOVA
            </div>
          </Link>
          <p style={{ color: '#7c83a0', fontSize: 14, marginTop: 8 }}>Reset your password</p>
        </div>

        <div className="glass-card" style={{ padding: '40px 36px', textAlign: 'center' }}>
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>📬</div>
              <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#00f5ff', marginBottom: 12 }}>CHECK YOUR EMAIL</h3>
              <p style={{ color: '#7c83a0', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                If an account with <strong style={{ color: '#e8eaf6' }}>{email}</strong> exists,
                you'll receive a reset link within a few minutes.
              </p>
              <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                Back to Login
              </Link>
            </motion.div>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🔐</div>
              <p style={{ color: '#7c83a0', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Enter your email and we'll send a secure reset link
              </p>
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: 12, color: '#7c83a0', letterSpacing: 1, display: 'block', marginBottom: 8, fontFamily: 'Orbitron, sans-serif' }}>EMAIL ADDRESS</label>
                  <input
                    className="input-dark"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#7c83a0', textDecoration: 'none', fontSize: 14 }}>
            ← Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
