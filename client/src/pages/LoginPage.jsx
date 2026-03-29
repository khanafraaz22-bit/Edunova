import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'
import { useTheme } from '../context/ThemeContext'
import Nova from '../components/Nova'
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi2'
import { HiOutlineArrowRight } from 'react-icons/hi'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
    }}>
      {/* Subtle grid */}
      <div className="cyber-grid" style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }} />

      {/* Theme toggle */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <button onClick={toggleTheme} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
          {theme === 'dark' ? <HiOutlineSun size={15} /> : <HiOutlineMoon size={15} />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Nova size={72} state="idle" assembly={1} showGlow />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>
            Sign in to continue with Nova
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handle('email')}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-dark"
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)', textDecoration: 'none', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
                  onMouseLeave={e => e.currentTarget.style.opacity = 1}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handle('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-dark"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {showPass ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: `glowPulse 1s ease-in-out ${i*0.15}s infinite` }} />)}
                </span>
              ) : (
                <>Sign in <HiOutlineArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
