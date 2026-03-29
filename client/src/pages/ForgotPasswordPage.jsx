import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { forgotPassword } from '../api'
import Nova from '../components/Nova'
import { HiOutlineArrowLeft } from 'react-icons/hi'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)

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
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      <div className="cyber-grid" style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Nova size={68} state={sent ? 'active' : 'idle'} assembly={1} showGlow />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 6 }}>
            {sent ? 'Check your inbox' : 'Reset password'}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>
            {sent ? `We sent a link to ${email}` : "Enter your email and we'll send a reset link"}
          </p>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '32px 28px', boxShadow: 'var(--shadow-md)' }}>
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Check your spam folder if it doesn't arrive within a few minutes.
              </p>
              <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', width: '100%' }}>
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Email address
                </label>
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="input-dark" />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <HiOutlineArrowLeft size={13} /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
