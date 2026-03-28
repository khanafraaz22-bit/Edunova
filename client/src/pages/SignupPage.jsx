import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'
import TCModal from '../components/TCModal'

function passwordStrength(pwd) {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const strengthLabels = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG']
const strengthColors = ['', '#f72585', '#f59e0b', '#06d6a0', '#00f5ff']

function GridLines() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#7b2fff" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid2)" />
    </svg>
  )
}

const inputStyle = {
  width: '100%', background: 'rgba(123,47,255,0.04)',
  border: '1px solid rgba(123,47,255,0.2)',
  color: '#c8d0e0', padding: '11px 14px',
  fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [showTCModal, setShowTCModal] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const strength = passwordStrength(form.password)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Fill in all fields')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await signup(form.name, form.email, form.password)
      setShowTCModal(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
      setLoading(false)
    }
  }

  const acceptTC = () => {
    setShowTCModal(false)
    toast.success(`Access granted, ${form.name.split(' ')[0]}`)
    navigate('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020209', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <GridLines />
      <div style={{ position: 'absolute', top: '15%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ width: '100%', maxWidth: 460 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 26, letterSpacing: 4, background: 'linear-gradient(135deg, #00f5ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EDUNOVA
            </div>
          </Link>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', letterSpacing: 3, marginTop: 6 }}>// NEW OPERATOR REGISTRATION</div>
        </div>

        {/* Panel */}
        <div style={{
          background: 'rgba(6,6,15,0.85)',
          border: '1px solid rgba(123,47,255,0.2)',
          padding: '36px 32px',
          position: 'relative',
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '2px solid #7b2fff', borderLeft: '2px solid #7b2fff' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '2px solid #00f5ff', borderRight: '2px solid #00f5ff' }} />

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { label: 'OPERATOR_NAME', name: 'name', type: 'text', placeholder: 'Your Name', autoComplete: 'name' },
              { label: 'EMAIL_ADDRESS', name: 'email', type: 'email', placeholder: 'operator@domain.com', autoComplete: 'email' },
            ].map(({ label, name, type, placeholder, autoComplete }) => (
              <div key={name}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
                <input
                  type={type} name={name} placeholder={placeholder}
                  value={form[name]} onChange={handle} autoComplete={autoComplete}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(123,47,255,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(123,47,255,0.2)'}
                />
              </div>
            ))}

            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', letterSpacing: 2, marginBottom: 8 }}>PASSWORD_HASH</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'} name="password"
                  placeholder="Min. 8 characters"
                  value={form.password} onChange={handle}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(123,47,255,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(123,47,255,0.2)'}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5070', fontSize: 13, padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#7b2fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}
                >
                  {showPwd ? '●' : '○'}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 2, background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: strengthColors[strength], letterSpacing: 2 }}>PWD_STRENGTH: {strengthLabels[strength]}</div>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', letterSpacing: 2, marginBottom: 8 }}>CONFIRM_HASH</div>
              <input
                type="password" name="confirm"
                placeholder="Repeat password"
                value={form.confirm} onChange={handle}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(123,47,255,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(123,47,255,0.2)'}
              />
              {form.confirm && form.password !== form.confirm && (
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#f72585', marginTop: 4, letterSpacing: 1 }}>ERR: HASH_MISMATCH</div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '13px', marginTop: 4,
                background: loading ? 'rgba(123,47,255,0.06)' : 'linear-gradient(135deg, rgba(123,47,255,0.2), rgba(0,245,255,0.1))',
                border: `1px solid ${loading ? 'rgba(123,47,255,0.2)' : '#7b2fff'}`,
                color: loading ? '#4a5070' : '#c4a9ff',
                fontFamily: 'Orbitron, sans-serif', fontSize: 11, letterSpacing: 3,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'INITIALIZING...' : 'CREATE ACCOUNT →'}
            </motion.button>
          </form>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4a5070', letterSpacing: 1 }}>
          HAVE CREDENTIALS?{' '}
          <Link to="/login" style={{ color: '#7b2fff', textDecoration: 'none' }}>
            LOGIN →
          </Link>
        </div>
      </motion.div>

      <TCModal isOpen={showTCModal} onAccept={acceptTC} />
    </div>
  )
}
