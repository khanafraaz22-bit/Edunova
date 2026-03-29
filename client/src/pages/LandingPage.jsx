import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import useAuthStore from '../store/useAuthStore'
import { useTheme } from '../context/ThemeContext'
import Nova from '../components/Nova'
import {
  HiOutlineAcademicCap, HiOutlineChartBar, HiOutlineLightBulb,
  HiOutlineChatBubbleLeft, HiOutlineArrowRight, HiOutlineSparkles,
  HiOutlineCheckCircle, HiOutlineBookOpen, HiOutlineMapPin,
} from 'react-icons/hi2'
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi'

// ── Nav Bar ────────────────────────────────────────────────────────────────
function NavBar({ onLogin, onSignup }) {
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  if (typeof window !== 'undefined') {
    window.onscroll = () => setScrolled(window.scrollY > 20)
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'var(--bg-surface)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 160 176" fill="none" style={{ width: 28, height: 31 }}>
          <path d="M 32 58 Q 30 28 80 26 Q 130 28 128 58 L 128 118 Q 128 142 108 147 L 80 151 L 52 147 Q 32 142 32 118 Z" fill="#0D1221" stroke="rgba(61,142,240,0.6)" strokeWidth="1.5"/>
          <ellipse cx="60" cy="88" rx="14" ry="9" fill="rgba(8,11,20,0.9)" stroke="rgba(61,142,240,0.5)" strokeWidth="1"/>
          <ellipse cx="60" cy="88" rx="7" ry="5" fill="#3D8EF0" opacity="0.8"/>
          <ellipse cx="100" cy="88" rx="14" ry="9" fill="rgba(8,11,20,0.9)" stroke="rgba(61,142,240,0.5)" strokeWidth="1"/>
          <ellipse cx="100" cy="88" rx="7" ry="5" fill="#3D8EF0" opacity="0.8"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Edunova
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={toggleTheme} style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
          {theme === 'dark' ? <HiOutlineSun size={15} /> : <HiOutlineMoon size={15} />}
        </button>
        <button onClick={onLogin} className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }}>
          Sign in
        </button>
        <button onClick={onSignup} className="btn-primary" style={{ padding: '7px 18px', fontSize: 13 }}>
          Get started
        </button>
      </div>
    </motion.nav>
  )
}

// ── Feature Card ───────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-md)' }}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        cursor: 'default',
        transition: 'border-color 0.2s',
        borderTop: `3px solid ${color}`,
      }}
      onMouseEnter={e => e.currentTarget.style.borderTopColor = color}
    >
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        {desc}
      </div>
    </motion.div>
  )
}

// ── Step Card ──────────────────────────────────────────────────────────────
function StepCard({ num, title, desc, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--accent)', flexShrink: 0 }}>
        {num}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 5 }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
      </div>
    </motion.div>
  )
}

// ── Main Landing Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const heroRef   = useRef(null)
  const novaRef   = useRef(null)

  // Scroll-driven Nova assembly
  const { scrollYProgress } = useScroll({ target: novaRef, offset: ['start end', 'center center'] })
  const assemblyRaw = useTransform(scrollYProgress, [0, 1], [0, 1])
  const assembly    = useSpring(assemblyRaw, { stiffness: 70, damping: 18 })
  const [assemblyVal, setAssemblyVal] = useState(0)

  assembly.on('change', v => setAssemblyVal(v))

  // Disassemble on scroll back up
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroAssembly = useSpring(useTransform(heroProgress, [0, 0.6], [1, 0]), { stiffness: 60, damping: 20 })
  const [heroVal, setHeroVal] = useState(1)
  heroAssembly.on('change', v => setHeroVal(Math.max(0, v)))

  const onLogin  = () => user ? navigate('/dashboard') : navigate('/login')
  const onSignup = () => user ? navigate('/dashboard') : navigate('/signup')

  const features = [
    { icon: HiOutlineMapPin,          title: 'Mind Maps',        desc: 'Instantly visualize any course as an interactive concept map.',         color: 'var(--accent)',         delay: 0    },
    { icon: HiOutlineLightBulb,       title: 'Smart Summaries',  desc: 'Get concise AI-generated summaries of every lecture video.',             color: 'var(--accent-violet)',  delay: 0.05 },
    { icon: HiOutlineAcademicCap,     title: 'Adaptive Exams',   desc: 'Generate personalized quizzes based on your actual course content.',     color: 'var(--accent-success)', delay: 0.1  },
    { icon: HiOutlineChatBubbleLeft,  title: 'Ask Nova',         desc: 'Chat with your AI tutor — explain topics, answer questions, go deeper.',  color: 'var(--accent-warning)', delay: 0.15 },
    { icon: HiOutlineChartBar,        title: 'Progress Tracking', desc: 'Track completion, XP, streaks and quiz scores across all courses.',     color: 'var(--accent-pink)',    delay: 0.2  },
    { icon: HiOutlineBookOpen,        title: 'Gap Analysis',     desc: 'Discover knowledge gaps and get a recommended study path.',              color: 'var(--accent)',         delay: 0.25 },
  ]

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <NavBar onLogin={onLogin} onSignup={onSignup} />

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px 40px 60px', position: 'relative', overflow: 'hidden' }}>

        {/* Subtle grid background */}
        <div className="cyber-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

        {/* Ambient glow blobs */}
        <div style={{ position: 'absolute', top: '20%', left: '25%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-v-dim) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 65%)', pointerEvents: 'none', filter: 'blur(30px)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 60, justifyContent: 'space-between', flexWrap: 'wrap' }}>

          {/* Left: copy */}
          <div style={{ flex: '1 1 480px', maxWidth: 560 }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--accent-dim)', border: '1px solid var(--border-active)', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}
            >
              <HiOutlineSparkles size={13} style={{ color: 'var(--accent)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                Powered by Llama 3.3 · Free to use
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(36px, 5vw, 58px)',
                lineHeight: 1.1,
                letterSpacing: '-1.5px',
                color: 'var(--text-primary)',
                marginBottom: 20,
              }}
            >
              Your AI{' '}
              <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Teaching
              </span>
              {' '}Assistant
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.4 }}
              style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}
            >
              Paste any YouTube playlist and Nova transforms it into an interactive learning experience — with AI summaries, exams, mind maps and a personal tutor.
            </motion.p>

            {/* Trust bullets */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.34, duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 36 }}
            >
              {['No credit card required', 'Works with any YouTube playlist', 'AI-powered in under 2 minutes'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HiOutlineCheckCircle size={15} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>{t}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
            >
              <button onClick={onSignup} className="btn-primary" style={{ fontSize: 15, padding: '12px 28px', gap: 10 }}>
                Start Learning Free
                <HiOutlineArrowRight size={16} />
              </button>
              <button onClick={onLogin} className="btn-ghost" style={{ fontSize: 14, padding: '11px 22px' }}>
                Sign in
              </button>
            </motion.div>
          </div>

          {/* Right: Nova hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.5, type: 'spring', damping: 20 }}
            style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          >
            <div className="nova-float" style={{ position: 'relative' }}>
              <Nova size={220} state="idle" assembly={heroVal} showGlow />
            </div>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
              maxWidth: 280,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-success)', boxShadow: '0 0 6px rgba(16,185,129,0.5)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "What would you like to learn today?"
              </span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>SCROLL</span>
          <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, var(--accent-glow), transparent)' }} />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 40px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '3px', marginBottom: 12, textTransform: 'uppercase' }}>
              Everything you need
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px, 4vw, 38px)', color: 'var(--text-primary)', letterSpacing: '-0.8px' }}>
              One platform, every learning tool
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS + NOVA ASSEMBLY ── */}
      <section ref={novaRef} style={{ padding: '80px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Left: Nova assembles on scroll */}
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Nova size={240} state="thinking" assembly={assemblyVal} showGlow />
            <AnimatePresence>
              {assemblyVal > 0.7 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-lg)', padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '1px' }}
                >
                  Nova · analyzing...
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Steps */}
          <div style={{ flex: '1 1 340px' }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ marginBottom: 40 }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '3px', marginBottom: 12, textTransform: 'uppercase' }}>How it works</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 3.5vw, 34px)', color: 'var(--text-primary)', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
                From playlist to AI-powered course in minutes
              </h2>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <StepCard num="1" title="Paste your YouTube playlist" desc="Any public playlist works — lectures, tutorials, courses. Nova supports any topic." delay={0} />
              <div style={{ height: 1, background: 'var(--border)', marginLeft: 54 }} />
              <StepCard num="2" title="Nova analyzes it automatically" desc="AI extracts transcripts, identifies topics, difficulty, and key concepts across all videos." delay={0.08} />
              <div style={{ height: 1, background: 'var(--border)', marginLeft: 54 }} />
              <StepCard num="3" title="Learn smarter, not harder" desc="Use summaries, mind maps, quizzes, and chat with Nova to master the material faster." delay={0.16} />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              style={{ marginTop: 36 }}
            >
              <button onClick={onSignup} className="btn-primary" style={{ fontSize: 14, padding: '11px 24px' }}>
                Try it free → <HiOutlineArrowRight size={15} />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '72px 40px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <Nova size={80} state="active" assembly={1} showGlow={false} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 38px)', color: 'var(--text-primary)', letterSpacing: '-0.8px', lineHeight: 1.2, marginBottom: 16 }}>
              Ready to learn with Nova?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 }}>
              Join students who are learning faster with AI. No credit card, no limits.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={onSignup} className="btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>
                Get started free
              </button>
              <button onClick={onLogin} className="btn-ghost" style={{ fontSize: 14, padding: '12px 24px' }}>
                Sign in
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '28px 40px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 160 176" fill="none" style={{ width: 22, height: 24 }}>
            <path d="M 32 58 Q 30 28 80 26 Q 130 28 128 58 L 128 118 Q 128 142 108 147 L 80 151 L 52 147 Q 32 142 32 118 Z" fill="#0D1221" stroke="rgba(61,142,240,0.5)" strokeWidth="1.5"/>
            <ellipse cx="60" cy="88" rx="11" ry="7" fill="#3D8EF0" opacity="0.7"/>
            <ellipse cx="100" cy="88" rx="11" ry="7" fill="#3D8EF0" opacity="0.7"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>Edunova</span>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
          Built with AI · Open source
        </div>
      </footer>
    </div>
  )
}
