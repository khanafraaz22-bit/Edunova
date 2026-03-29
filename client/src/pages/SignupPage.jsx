import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'
import { useTheme } from '../context/ThemeContext'
import Nova from '../components/Nova'
import TCModal from '../components/TCModal'
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi2'
import { HiOutlineArrowRight } from 'react-icons/hi'

function pwdStrength(p) {
  let s = 0
  if (p.length >= 8)              s++
  if (/[A-Z]/.test(p))            s++
  if (/[0-9]/.test(p))            s++
  if (/[^A-Za-z0-9]/.test(p))    s++
  return s
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', 'var(--accent-danger)', 'var(--accent-warning)', 'var(--accent)', 'var(--accent-success)']

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [showTC, setShowTC]     = useState(false)

  const handle = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const strength = pwdStrength(form.password)
  const pwdMatch = form.confirm && form.password !== form.confirm

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.confirm) return toast.error('Please fill in all fields')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setShowTC(true)
  }

  const onAccept = async () => {
    setShowTC(false)
    setLoading(true)
    try {
      await signup(form.name, form.email, form.password)
      toast.success('Account created! Welcome to Edunova.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', position: 'relative' }}>
      <div className="cyber-grid" style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }} />

      {/* Theme toggle */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <button onClick={toggleTheme} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
          {theme === 'dark' ? <HiOutlineSun size={15} /> : <HiOutlineMoon size={15} />}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Nova size={72} state="idle" assembly={1} showGlow />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)' }}>
            Start learning with Nova for free
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '32px 28px', boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Full name</label>
              <input type="text" value={form.name} onChange={handle('name')} placeholder="Aarav Khan" autoComplete="name" className="input-dark" />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email} onChange={handle('email')} placeholder="you@example.com" autoComplete="email" className="input-dark" />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={handle('password')} placeholder="Min. 6 characters" autoComplete="new-password" className="input-dark" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {showPass ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
              {/* Strength meter */}
              {form.password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--border)', transition: 'background 0.25s' }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Confirm password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={handle('confirm')}
                placeholder="••••••••"
                autoComplete="new-password"
                className="input-dark"
                style={{ borderColor: pwdMatch ? 'var(--accent-danger)' : undefined }}
              />
              {pwdMatch && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--accent-danger)', marginTop: 5 }}>
                  Passwords don't match
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || !!pwdMatch} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, marginTop: 4 }}>
              {loading ? (
                <span style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: `glowPulse 1s ease-in-out ${i*0.15}s infinite` }} />)}
                </span>
              ) : (
                <>Create account <HiOutlineArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </motion.div>

      {showTC && <TCModal onAccept={onAccept} onClose={() => setShowTC(false)} />}
    </div>
  )
}
