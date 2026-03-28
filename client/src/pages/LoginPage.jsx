import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'

const FEATURES = [
  { label: 'AI COURSE ANALYSIS', desc: 'Any YouTube playlist in minutes' },
  { label: 'MIND MAP ENGINE', desc: 'Visual knowledge graphs auto-generated' },
  { label: 'NYRA AI TUTOR', desc: 'Socratic learning companion 24/7' },
  { label: 'ADAPTIVE EXAMS', desc: 'Gap-detection & targeted quizzes' },
]

function GridLines() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00f5ff" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Fill in all fields')
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Access granted')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020209', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <GridLines />

      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left panel — hidden on mobile, shown md+ */}
      <div className="hidden md:flex" style={{
        flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '60px 48px',
        borderRight: '1px solid rgba(0,245,255,0.08)',
        background: 'linear-gradient(135deg, rgba(0,245,255,0.02) 0%, rgba(123,47,255,0.03) 100%)',
        display: 'none',
      }}>
        <div style={{ maxWidth: 380 }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 42, letterSpacing: 6, marginBottom: 4, background: 'linear-gradient(135deg, #00f5ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EDUNOVA
            </div>
          </Link>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4a5070', letterSpacing: 3, marginBottom: 56 }}>
            &gt; AI LEARNING PLATFORM v2.0
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
                style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
              >
                <div style={{ width: 2, height: 36, background: 'linear-gradient(180deg, #00f5ff, transparent)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, color: '#00f5ff', letterSpacing: 2, marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: '#4a5070', letterSpacing: 0.5 }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Corner ornament */}
          <div style={{ marginTop: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,245,255,0.3), transparent)' }} />
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2 }}>BENNETT UNIVERSITY</div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Mobile logo */}
          <div className="block md:hidden" style={{ textAlign: 'center', marginBottom: 40 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 26, letterSpacing: 4, background: 'linear-gradient(135deg, #00f5ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                EDUNOVA
              </div>
            </Link>
          </div>

          {/* Panel header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', letterSpacing: 3, marginBottom: 8 }}>// AUTHENTICATION</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 18, color: '#dde4f0', letterSpacing: 2 }}>SYSTEM ACCESS</div>
          </div>

          {/* Form panel */}
          <div style={{
            background: 'rgba(6,6,15,0.8)',
            border: '1px solid rgba(0,245,255,0.12)',
            padding: '32px',
            position: 'relative',
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
          }}>
            {/* Corner accents */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: '2px solid #00f5ff', borderLeft: '2px solid #00f5ff' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '2px solid #7b2fff', borderRight: '2px solid #7b2fff' }} />

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', letterSpacing: 2, marginBottom: 8 }}>EMAIL_ADDRESS</div>
                <input
                  type="email" name="email"
                  placeholder="operator@domain.com"
                  value={form.email} onChange={handle}
                  autoComplete="email"
                  style={{
                    width: '100%', background: 'rgba(0,245,255,0.03)',
                    border: '1px solid rgba(0,245,255,0.15)',
                    color: '#c8d0e0', padding: '11px 14px',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
                />
              </div>

              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', letterSpacing: 2, marginBottom: 8 }}>PASSWORD_HASH</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'} name="password"
                    placeholder="••••••••••••"
                    value={form.password} onChange={handle}
                    autoComplete="current-password"
                    style={{
                      width: '100%', background: 'rgba(0,245,255,0.03)',
                      border: '1px solid rgba(0,245,255,0.15)',
                      color: '#c8d0e0', padding: '11px 44px 11px 14px',
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                      outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5070', fontSize: 14, padding: 2 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#00f5ff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}
                  >
                    {showPwd ? '●' : '○'}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Link to="/forgot-password" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', textDecoration: 'none', letterSpacing: 1 }}
                  onMouseEnter={e => e.target.style.color = '#00f5ff'}
                  onMouseLeave={e => e.target.style.color = '#4a5070'}
                >
                  RESET_ACCESS &gt;
                </Link>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '13px',
                  background: loading ? 'rgba(0,245,255,0.06)' : 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(123,47,255,0.15))',
                  border: `1px solid ${loading ? 'rgba(0,245,255,0.15)' : '#00f5ff'}`,
                  color: loading ? '#4a5070' : '#00f5ff',
                  fontFamily: 'Orbitron, sans-serif', fontSize: 12, letterSpacing: 3,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4a5070', animation: 'glowPulse 1s ease-in-out 0s infinite' }} />
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4a5070', animation: 'glowPulse 1s ease-in-out 0.2s infinite' }} />
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4a5070', animation: 'glowPulse 1s ease-in-out 0.4s infinite' }} />
                  </>
                ) : 'AUTHENTICATE →'}
              </motion.button>
            </form>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4a5070', letterSpacing: 1 }}>
            NO CREDENTIALS?{' '}
            <Link to="/signup" style={{ color: '#00f5ff', textDecoration: 'none' }}>
              REGISTER →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
