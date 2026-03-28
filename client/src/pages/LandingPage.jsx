import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import useAuthStore from '../store/useAuthStore'

// ── Text Scramble Hook ────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&'
function useTextScramble(target, duration = 1200) {
  const [text, setText] = useState(() => Array(target.length).fill('?').join(''))
  const [done, setDone] = useState(false)
  useEffect(() => {
    let frame = 0
    const totalFrames = Math.floor(duration / 16)
    const interval = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      const revealed = Math.floor(progress * target.length)
      let result = ''
      for (let i = 0; i < target.length; i++) {
        if (i < revealed)      result += target[i]
        else if (target[i] === ' ') result += ' '
        else result += CHARS[Math.floor(Math.random() * CHARS.length)]
      }
      setText(result)
      if (frame >= totalFrames) { setText(target); setDone(true); clearInterval(interval) }
    }, 16)
    return () => clearInterval(interval)
  }, [target, duration])
  return { text, done }
}

// ── Stars background ──────────────────────────────────────────────────────
function StarField({ count = 200 }) {
  const stars = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.7 + 0.1,
      dur: Math.random() * 4 + 2,
    }))
  )
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {stars.current.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white">
          <animate attributeName="opacity" values={`${s.opacity};${s.opacity * 0.2};${s.opacity}`} dur={`${s.dur}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  )
}

// ── Particle Orb Canvas ───────────────────────────────────────────────────
function ParticleOrb({ progressRef }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ particles: [], rotation: 0, animId: null })

  useEffect(() => {
    const N = 500
    const R = 130
    const phi = Math.PI * (3 - Math.sqrt(5))

    const particles = Array.from({ length: N }, (_, i) => {
      const y   = 1 - (i / (N - 1)) * 2
      const r   = Math.sqrt(1 - y * y)
      const ang = phi * i
      const hue = i % 3 === 0 ? 185 : i % 3 === 1 ? 270 : 320
      const spread = 280

      return {
        // sphere target
        tx: Math.cos(ang) * r * R,
        ty: y * R,
        tz: Math.sin(ang) * r * R,
        // scattered origin
        sx: (Math.random() - 0.5) * spread,
        sy: (Math.random() - 0.5) * spread,
        sz: (Math.random() - 0.5) * spread,
        hue,
        size: Math.random() * 1.8 + 0.4,
        speed: 0.6 + Math.random() * 0.4,
      }
    })

    stateRef.current.particles = particles

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = () => {
      const t    = progressRef.current
      const W    = canvas.width
      const H    = canvas.height
      const cx   = W / 2
      const cy   = H / 2
      const rot  = stateRef.current.rotation
      const cosR = Math.cos(rot)
      const sinR = Math.sin(rot)

      ctx.clearRect(0, 0, W, H)

      // Central glow when assembled
      if (t > 0.3) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5)
        g.addColorStop(0,   `rgba(0,245,255,${0.04 * t})`)
        g.addColorStop(0.5, `rgba(123,47,255,${0.03 * t})`)
        g.addColorStop(1,   'transparent')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }

      // Project particles
      const projected = particles.map(p => {
        const eased = Math.pow(t * p.speed, 0.6)
        const px = p.sx + (p.tx - p.sx) * Math.min(1, eased)
        const py = p.sy + (p.ty - p.sy) * Math.min(1, eased)
        const pz = p.sz + (p.tz - p.sz) * Math.min(1, eased)

        // Rotate Y
        const rx =  px * cosR + pz * sinR
        const ry =  py
        const rz = -px * sinR + pz * cosR

        const fov   = 450
        const scale = fov / (fov + rz + 200)
        return {
          sx: cx + rx * scale,
          sy: cy + ry * scale,
          rz,
          scale,
          p,
          alpha: Math.max(0, Math.min(1, scale * 1.4)),
        }
      }).sort((a, b) => a.rz - b.rz)

      // Draw connections (only when >60% assembled)
      if (t > 0.6) {
        const linkAlpha = (t - 0.6) * 2.5 * 0.08
        ctx.lineWidth = 0.4
        for (let i = 0; i < projected.length; i += 4) {
          for (let j = i + 1; j < Math.min(i + 12, projected.length); j++) {
            const a = projected[i], b = projected[j]
            const dx = a.sx - b.sx, dy = a.sy - b.sy
            const dist = Math.sqrt(dx*dx + dy*dy)
            if (dist < 40) {
              ctx.beginPath()
              ctx.moveTo(a.sx, a.sy)
              ctx.lineTo(b.sx, b.sy)
              ctx.strokeStyle = `rgba(0,245,255,${linkAlpha * (1 - dist / 40)})`
              ctx.stroke()
            }
          }
        }
      }

      // Draw particles
      projected.forEach(({ sx, sy, alpha, scale, p }) => {
        const size = p.size * scale * (0.5 + t * 0.8)
        if (size < 0.2) return

        // Particle core
        ctx.beginPath()
        ctx.arc(sx, sy, size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},100%,72%,${alpha * (0.3 + t * 0.7)})`
        ctx.fill()

        // Glow halo (only assembled particles)
        if (t > 0.4 && size > 0.8) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 4)
          glow.addColorStop(0, `hsla(${p.hue},100%,70%,${alpha * 0.25 * t})`)
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(sx, sy, size * 4, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      stateRef.current.rotation += 0.004
      stateRef.current.animId = requestAnimationFrame(draw)
    }

    stateRef.current.animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(stateRef.current.animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      style={{ display: 'block', maxWidth: '100%' }}
    />
  )
}

// ── Feature slide data ─────────────────────────────────────────────────────
const SLIDES = [
  { icon: '🎬', label: 'ANALYZE', title: 'Any YouTube Course', desc: 'Paste a playlist link. Nyra fetches transcripts, runs deep AI analysis, and maps the entire course in seconds.' },
  { icon: '🧠', label: 'UNDERSTAND', title: 'With Socratic Teaching', desc: 'Nyra uses GPT-4o to explain concepts step by step, provide analogies, and check your comprehension.' },
  { icon: '🗺️', label: 'VISUALIZE', title: 'Interactive Mind Maps', desc: 'Drag-and-drop neural graphs of every topic. Zoom, explore, and see how concepts connect.' },
  { icon: '📝', label: 'TEST', title: 'AI-Generated Exams', desc: 'MCQs, True/False, and short answers with instant grading, explanations, and XP rewards.' },
  { icon: '💬', label: 'CHAT', title: 'With Your Course AI', desc: 'Context-aware chatbot that knows every video in your course. Ask anything, get precise answers.' },
]

const credits = [
  { role: 'Backend', name: 'Afraaz Khan',    id: 'S24CSEU2051' },
  { role: 'Backend', name: 'Aayush Patel',   id: 'S24CSEU2032' },
  { role: 'Frontend', name: 'Aarush Singhal', id: 'S24CSEU2091' },
  { role: 'Frontend', name: 'Piyush Kumar',   id: 'S24CSEU2037' },
]

// ── Landing Page ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Redirect if logged in
  useEffect(() => { if (user) navigate('/dashboard') }, [user])

  // Orb scroll progress
  const orbProgressRef   = useRef(0)
  const stickyWrapRef    = useRef(null)
  const [orbProgress, setOrbProgress] = useState(0)
  const [slideIndex,  setSlideIndex]  = useState(0)

  // Title scramble
  const { text: title } = useTextScramble('EDUNOVA', 1400)

  // Scroll handler — drives orb assembly
  useEffect(() => {
    const onScroll = () => {
      const el = stickyWrapRef.current
      if (!el) return
      const rect    = el.getBoundingClientRect()
      const scrolled = -rect.top
      const total    = rect.height - window.innerHeight
      const prog     = Math.max(0, Math.min(1, scrolled / total))
      orbProgressRef.current = prog
      setOrbProgress(prog)
      // Which slide to show (0-4)
      setSlideIndex(Math.min(SLIDES.length - 1, Math.floor(prog * SLIDES.length)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ── HERO SECTION (100vh) ──────────────────────────────────── */}
      <section
        style={{
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Deep space gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0a0020 0%, #020209 100%)' }} />

        {/* Cyber grid */}
        <div className="cyber-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />

        {/* Scanline */}
        <div className="scanline-overlay" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} />

        {/* Stars */}
        <StarField count={180} />

        {/* Ambient orbs */}
        <div style={{ position: 'absolute', top: '25%', left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.05) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.06) 0%, transparent 70%)', animation: 'float 8s ease-in-out 2s infinite' }} />

        {/* ── MAIN HERO CONTENT ── */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 20px', maxWidth: 760 }}>

          {/* Status chip */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,245,255,0.06)',
              border: '1px solid rgba(0,245,255,0.2)',
              borderRadius: 40, padding: '6px 18px',
              fontSize: 11, color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-display)', letterSpacing: 2,
              marginBottom: 40,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block', animation: 'glowPulse 1.5s ease-in-out infinite' }} />
            GPT-4o POWERED · BENNETT UNIVERSITY
          </motion.div>

          {/* EDUNOVA — scramble effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="cursor-blink"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(52px, 12vw, 120px)',
                letterSpacing: '-1px',
                lineHeight: 1,
                marginBottom: 16,
                background: 'linear-gradient(135deg, #ffffff 0%, var(--accent-cyan) 40%, var(--accent-violet) 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(0,245,255,0.3))',
                animation: 'flicker 8s ease-in-out infinite',
              }}
            >
              {title}
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(13px, 2vw, 18px)',
              fontWeight: 500,
              letterSpacing: 6,
              color: 'var(--text-muted)',
              marginBottom: 56,
              textTransform: 'uppercase',
            }}
          >
            THE FUTURE OF LEARNING
          </motion.p>

          {/* ENTER button */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            <motion.button
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: '18px 56px',
                background: 'transparent',
                border: '1px solid rgba(0,245,255,0.5)',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 8,
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,245,255,0.07)'
                e.currentTarget.style.boxShadow = '0 0 40px rgba(0,245,255,0.2), 0 0 80px rgba(0,245,255,0.08), inset 0 0 40px rgba(0,245,255,0.04)'
                e.currentTarget.style.borderColor = 'var(--accent-cyan)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'rgba(0,245,255,0.5)'
              }}
            >
              {/* Corner marks */}
              {[['0 0', '0 0'], ['100% 0', '0 0'], ['0 100%', '0 0'], ['100% 100%', '0 0']].map(([tl], ci) => (
                <span key={ci} style={{
                  position: 'absolute',
                  width: 8, height: 8,
                  border: '1px solid var(--accent-cyan)',
                  top:    ci < 2 ? -1 : 'auto',
                  bottom: ci >= 2 ? -1 : 'auto',
                  left:   ci % 2 === 0 ? -1 : 'auto',
                  right:  ci % 2 === 1 ? -1 : 'auto',
                  borderRight:  ci % 2 === 0 ? 'none' : undefined,
                  borderLeft:   ci % 2 === 1 ? 'none' : undefined,
                  borderBottom: ci < 2  ? 'none' : undefined,
                  borderTop:    ci >= 2 ? 'none' : undefined,
                }} />
              ))}
              ENTER
            </motion.button>
          </motion.div>

          {/* Already have an account */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{ marginTop: 24, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: 0.5 }}
          >
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-cyan)', fontSize: 13, fontFamily: 'var(--font-body)', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 4 }}
            >
              Sign in
            </button>
          </motion.div>
        </div>

        {/* ── CREDITS (bottom) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            padding: '24px 40px',
            background: 'linear-gradient(to top, rgba(2,2,9,0.95) 0%, transparent 100%)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}
        >
          {/* Team */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {credits.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9 + i * 0.08 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontSize: 9, color: 'var(--accent-cyan)', letterSpacing: 2, fontFamily: 'var(--font-display)', marginBottom: 3 }}>
                  {c.role.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 0.5 }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{c.id}</div>
              </motion.div>
            ))}
          </div>
          {/* University */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, fontFamily: 'var(--font-display)' }}>BENNETT UNIVERSITY</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>Greater Noida · CSE · 2024–25</div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            color: 'var(--text-muted)', fontSize: 10, letterSpacing: 3, fontFamily: 'var(--font-display)',
            zIndex: 10,
          }}
        >
          SCROLL
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, var(--accent-cyan), transparent)' }}
          />
        </motion.div>
      </section>

      {/* ── STICKY SCROLL ORB SECTION ─────────────────────────────── */}
      <div
        ref={stickyWrapRef}
        style={{ height: `${(SLIDES.length + 1) * 100}vh`, position: 'relative' }}
      >
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
          {/* Background grid */}
          <div className="cyber-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />

          {/* Ambient light from orb */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 600, height: 600, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,245,255,${0.04 + orbProgress * 0.04}) 0%, rgba(123,47,255,${0.03 + orbProgress * 0.03}) 40%, transparent 70%)`,
            transition: 'background 0.3s',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80, padding: '0 60px', maxWidth: 1200, width: '100%', flexWrap: 'wrap' }}>

            {/* ── Orb ── */}
            <div style={{ flexShrink: 0, position: 'relative' }}>
              {/* Ring glow */}
              {orbProgress > 0.7 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: orbProgress > 0.7 ? (orbProgress - 0.7) * 3 : 0, scale: 1 }}
                  style={{
                    position: 'absolute', inset: -30,
                    borderRadius: '50%',
                    border: '1px solid rgba(0,245,255,0.2)',
                    boxShadow: '0 0 40px rgba(0,245,255,0.1)',
                    animation: 'spin-slow 8s linear infinite',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <ParticleOrb progressRef={orbProgressRef} />
            </div>

            {/* ── Feature text ── */}
            <div style={{ maxWidth: 420 }}>
              {/* Progress indicator */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 2,
                      flex: 1,
                      borderRadius: 1,
                      background: i <= slideIndex ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                      boxShadow: i <= slideIndex ? '0 0 8px var(--accent-cyan)' : 'none',
                      transition: 'background 0.4s, box-shadow 0.4s',
                    }}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={slideIndex}
                  initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 10,
                    letterSpacing: 4, color: 'var(--accent-cyan)', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 24 }}>{SLIDES[slideIndex].icon}</span>
                    {SLIDES[slideIndex].label}
                  </div>

                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 900,
                    fontSize: 'clamp(24px, 3.5vw, 42px)',
                    color: 'var(--text-primary)', lineHeight: 1.15,
                    marginBottom: 20,
                    letterSpacing: '-0.5px',
                  }}>
                    {SLIDES[slideIndex].title}
                  </h2>

                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 17,
                    fontWeight: 400, color: 'var(--text-muted)',
                    lineHeight: 1.75, marginBottom: 36,
                  }}>
                    {SLIDES[slideIndex].desc}
                  </p>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                      onClick={() => navigate('/signup')}
                      className="btn-primary"
                      style={{ fontSize: 11, padding: '12px 28px', letterSpacing: 2 }}
                    >
                      GET STARTED
                    </button>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {slideIndex + 1} / {SLIDES.length}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Scroll progress bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: 'rgba(255,255,255,0.06)',
          }}>
            <div style={{
              height: '100%',
              width: `${orbProgress * 100}%`,
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))',
              boxShadow: '0 0 10px var(--accent-cyan)',
              transition: 'width 0.1s',
            }} />
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section style={{
        padding: '120px 40px',
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, #030315 100%)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="cyber-grid" style={{ position: 'absolute', inset: 0, opacity: 0.2 }} />
        <div style={{ position: 'relative', zIndex: 5 }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 5, color: 'var(--accent-cyan)', marginBottom: 24 }}>
              READY TO BEGIN
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: 'clamp(28px, 5vw, 60px)',
              background: 'linear-gradient(135deg, #fff 30%, var(--accent-cyan) 70%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 20, letterSpacing: -1,
            }}>
              INITIALIZE YOUR LEARNING
            </h2>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 17, marginBottom: 48, maxWidth: 440, margin: '0 auto 48px' }}>
              Drop any YouTube course link. Let Nyra transform it into a complete AI-powered study experience.
            </p>
            <motion.button
              onClick={() => navigate('/signup')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              style={{ fontSize: 13, padding: '16px 48px', letterSpacing: 3 }}
            >
              LAUNCH EDUNOVA →
            </motion.button>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
