import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import ChatBot from '../components/ChatBot'
import useAuthStore from '../store/useAuthStore'
import { getCourses, getStats, analyzeCourse, deleteCourse } from '../api'
import { HiOutlinePlay, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi'
import { HiOutlineTrophy } from 'react-icons/hi2'

// ── Animated counter ───────────────────────────────────────────────────────
function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const n = parseFloat(target) || 0
    if (n === 0) { setCount(0); return }
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(n * ease))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])
  return { count, ref }
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#00f5ff', icon, delay = 0 }) {
  const isPercent = String(value).endsWith('%')
  const numVal = parseFloat(value) || 0
  const { count, ref } = useCounter(numVal)
  const display = isPercent ? `${count}%` : count

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: 'rgba(4,4,14,0.95)',
        border: `1px solid ${color}22`,
        borderTop: `2px solid ${color}`,
        padding: '22px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span><span style={{ fontSize: 14 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 30, fontWeight: 900, color, lineHeight: 1, letterSpacing: 1, textShadow: `0 0 20px ${color}55` }}>
        {display}
      </div>
      {sub && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', marginTop: 8, letterSpacing: 1 }}>{sub}</div>}
    </motion.div>
  )
}

// ── Course card (for horizontal scroll) ───────────────────────────────────
function CourseCard({ course, onOpen, onDelete, delay = 0 }) {
  const analysis = (() => { try { return JSON.parse(course.analysis_json || '{}') } catch { return {} } })()
  const progress = course.progress || 0
  const [hovered, setHovered] = useState(false)

  const diffColor = { Beginner: '#06d6a0', Intermediate: '#f59e0b', Advanced: '#f72585' }[analysis.difficulty] || '#00f5ff'

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 280, flexShrink: 0,
        background: hovered ? 'rgba(0,245,255,0.04)' : 'rgba(4,4,14,0.95)',
        border: `1px solid ${hovered ? 'rgba(0,245,255,0.3)' : 'rgba(0,245,255,0.1)'}`,
        cursor: 'pointer', transition: 'all 0.25s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 48px rgba(0,245,255,0.1), 0 0 0 1px rgba(0,245,255,0.15)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}
      onClick={() => onOpen(course.id)}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, #00f5ff, #7b2fff)`, opacity: hovered ? 1 : 0.4, transition: 'opacity 0.25s' }} />

      {/* Header area */}
      <div style={{ padding: '18px 18px 14px', background: 'linear-gradient(180deg, rgba(0,245,255,0.04) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#00f5ff', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.15)', padding: '2px 7px', letterSpacing: 1 }}>
              {course.video_count} VID
            </span>
            {analysis.difficulty && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: diffColor, background: `${diffColor}14`, border: `1px solid ${diffColor}33`, padding: '2px 7px', letterSpacing: 1 }}>
                {analysis.difficulty.toUpperCase()}
              </span>
            )}
          </div>
          <button onClick={e => { e.stopPropagation(); onDelete(course.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5070', padding: 2, flexShrink: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f72585'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}
          >
            <HiOutlineTrash size={13} />
          </button>
        </div>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: hovered ? '#e0e8f8' : '#9aa4bc', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', transition: 'color 0.25s', minHeight: 33 }}>
          {course.title}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0 18px 18px' }}>
        {analysis.summary && (
          <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#4a5570', fontSize: 12, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 14 }}>
            {analysis.summary.slice(0, 100)}...
          </div>
        )}

        {/* Progress */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#4a5070', marginBottom: 5, letterSpacing: 1 }}>
            <span>PROGRESS</span>
            <span style={{ color: progress > 0 ? '#00f5ff' : '#4a5070' }}>{progress}%</span>
          </div>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #00f5ff, #7b2fff)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: hovered ? '#00f5ff' : '#4a5070', letterSpacing: 2, transition: 'color 0.25s' }}>
          <HiOutlinePlay size={9} /> ENTER COURSE
        </div>
      </div>
    </motion.div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ label, title, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}
    >
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 15, color: '#dde4f0', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
          {title}
          <div style={{ height: 1, width: 60, background: 'linear-gradient(90deg, rgba(0,245,255,0.4), transparent)' }} />
        </div>
      </div>
      {action}
    </motion.div>
  )
}

// ── Analyze Modal ──────────────────────────────────────────────────────────
function AnalyzeModal({ isOpen, onClose, onSuccess }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('')
  const phaseRef = useRef(null)
  const phases = ['FETCHING PLAYLIST...', 'EXTRACTING TRANSCRIPTS...', 'RUNNING AI ANALYSIS...', 'FINALIZING DATA...']

  const run = async () => {
    if (!url.trim()) return toast.error('Paste a YouTube playlist URL')
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return toast.error('Must be a YouTube URL')
    setLoading(true)
    let pi = 0; setPhase(phases[0])
    phaseRef.current = setInterval(() => { pi = (pi + 1) % phases.length; setPhase(phases[pi]) }, 4000)
    try {
      const res = await analyzeCourse(url.trim())
      clearInterval(phaseRef.current)
      toast.success('Course analyzed successfully')
      onSuccess(res.data.course); onClose(); setUrl('')
    } catch (err) {
      clearInterval(phaseRef.current)
      toast.error(err.response?.data?.error || 'Analysis failed. Check the playlist URL.')
    } finally { setLoading(false); setPhase('') }
  }

  if (!isOpen) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,2,9,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(12px)' }}
      onClick={!loading ? onClose : undefined}
    >
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#03030b', border: '1px solid rgba(0,245,255,0.2)', padding: '36px', maxWidth: 520, width: '100%', position: 'relative', clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '2px solid #00f5ff', borderLeft: '2px solid #00f5ff' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '2px solid #7b2fff', borderRight: '2px solid #7b2fff' }} />
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 6 }}>// AI COURSE SCANNER</div>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#dde4f0', letterSpacing: 2, marginBottom: 24 }}>NEW COURSE SCAN</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 20 }}>
              {[0,1,2,3,4].map(i => <div key={i} style={{ width: 3, height: 28, background: '#00f5ff', opacity: 0.4, animation: `glowPulse 0.7s ease-in-out ${i*0.1}s infinite`, borderRadius: 2 }} />)}
            </div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, color: '#00f5ff', letterSpacing: 2, marginBottom: 16 }}>{phase}</div>
            <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', background: 'linear-gradient(90deg, #00f5ff, #7b2fff)', animation: 'shimmer 1.5s linear infinite', backgroundSize: '200% 100%' }} />
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', marginTop: 12, letterSpacing: 1 }}>ETA: 1-3 MIN FOR LARGE PLAYLISTS</div>
          </div>
        ) : (
          <>
            <input placeholder="https://youtube.com/playlist?list=..." value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
              style={{ width: '100%', background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.15)', color: '#c8d0e0', padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 14, transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
            />
            <div style={{ background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.08)', padding: '10px 14px', marginBottom: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 1 }}>
              TIP: Try 3Blue1Brown's Linear Algebra playlist
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#4a5070', fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#c8d0e0' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#4a5070' }}>
                CANCEL
              </button>
              <button onClick={run} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(123,47,255,0.15))', border: '1px solid #00f5ff', color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,245,255,0.25), rgba(123,47,255,0.25))'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(123,47,255,0.15))'}>
                INITIATE SCAN →
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAnalyze, setShowAnalyze] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([getCourses(), getStats()])
      setCourses(cRes.data.courses)
      setStats(sRes.data.stats)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return
    try { await deleteCourse(id); setCourses(c => c.filter(x => x.id !== id)); toast.success('Deleted') }
    catch { toast.error('Failed to delete') }
  }

  const handleAdded = (course) => { setCourses(p => [course, ...p]); refreshUser(); loadData() }

  const quizData = stats?.recentQuizzes?.slice().reverse().map((q, i) => ({ name: `Q${i+1}`, score: Math.round(q.score) })) || []
  const TOOLTIP = { background: '#04040c', border: '1px solid rgba(0,245,255,0.12)', borderRadius: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#c8d0e0' }

  // ── Overview tab ────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── HERO BANNER ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        style={{ position: 'relative', padding: '44px 40px 40px', marginBottom: 48, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(0,245,255,0.04) 0%, rgba(123,47,255,0.06) 50%, rgba(0,0,0,0) 100%)', borderBottom: '1px solid rgba(0,245,255,0.08)' }}
      >
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        {/* Scan line */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.15), transparent)', animation: 'scanDown 5s linear infinite', pointerEvents: 'none' }} />
        {/* Glows */}
        <div style={{ position: 'absolute', top: -60, right: 80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 100, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          {/* Left: greeting */}
          <div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#4a5070', letterSpacing: 3, marginBottom: 10 }}>
              // OPERATOR DASHBOARD
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 900, letterSpacing: 3, lineHeight: 1.1, marginBottom: 14 }}>
              <span style={{ color: '#dde4f0' }}>WELCOME, </span>
              <span style={{ background: 'linear-gradient(135deg, #00f5ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {(user?.name?.split(' ')[0] || 'OPERATOR').toUpperCase()}
              </span>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              style={{ fontFamily: 'Rajdhani, sans-serif', color: '#4a5570', fontSize: 15, maxWidth: 420 }}>
              {courses.length === 0
                ? 'Your knowledge base is empty. Initiate a course scan to begin.'
                : `${courses.length} course${courses.length > 1 ? 's' : ''} active · ${stats?.watchedVideos || 0} videos completed · ${stats?.quizzesTaken || 0} exams taken`}
            </motion.div>
          </div>

          {/* Right: XP + streak showcase */}
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring', damping: 16 }}
            style={{ display: 'flex', gap: 16, alignItems: 'center' }}
          >
            {/* XP Orb */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(123,47,255,0.12))', border: '1px solid rgba(0,245,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(0,245,255,0.15), inset 0 0 24px rgba(0,245,255,0.05)', position: 'relative' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 20, fontWeight: 900, color: '#00f5ff', lineHeight: 1, textShadow: '0 0 16px rgba(0,245,255,0.6)' }}>{stats?.xp || 0}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#4a5070', letterSpacing: 1, marginTop: 3 }}>XP</div>
                <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(0,245,255,0.12)', animation: 'orbPulse 3s ease-in-out infinite' }} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#4a5070', letterSpacing: 1, marginTop: 8 }}>TOTAL XP</div>
            </div>

            {/* Streak */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(247,37,133,0.1), rgba(245,158,11,0.08))', border: '1px solid rgba(247,37,133,0.25)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(247,37,133,0.1)' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 18, fontWeight: 900, color: '#f72585', lineHeight: 1 }}>{stats?.streak || 0}</div>
                <div style={{ fontSize: 12, marginTop: 1 }}>🔥</div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#4a5070', letterSpacing: 1, marginTop: 8 }}>DAY STREAK</div>
            </div>
          </motion.div>
        </div>

        {/* Bottom action row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ position: 'relative', display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}
        >
          <button onClick={() => setShowAnalyze(true)}
            style={{ padding: '10px 22px', background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(123,47,255,0.12))', border: '1px solid rgba(0,245,255,0.35)', color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7 }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(0,245,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <HiOutlinePlus size={12} /> NEW COURSE SCAN
          </button>
          {courses.length > 0 && (
            <button onClick={() => setActiveTab('courses')}
              style={{ padding: '10px 22px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#6a7090', fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#c8d0e0' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6a7090' }}
            >
              VIEW ALL COURSES →
            </button>
          )}
        </motion.div>
      </motion.div>

      {/* ── STATS GRID ── */}
      <div style={{ padding: '0 40px 48px' }}>
        <SectionHeader label="// PERFORMANCE METRICS" title="MISSION STATS" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 12 }}>
          <StatCard label="TOTAL_XP"     value={stats?.xp || 0}             icon="⭐" color="#f59e0b" delay={0} />
          <StatCard label="DAY_STREAK"   value={stats?.streak || 0}          icon="🔥" color="#f72585" sub="DAYS" delay={0.05} />
          <StatCard label="COURSES"      value={stats?.totalCourses || 0}    icon="📚" color="#7b2fff" delay={0.1} />
          <StatCard label="VIDS_WATCHED" value={stats?.watchedVideos || 0}   icon="✅" color="#06d6a0" sub={`OF ${stats?.totalVideos || 0}`} delay={0.15} />
          <StatCard label="QUIZZES"      value={stats?.quizzesTaken || 0}    icon="📝" color="#00f5ff" delay={0.2} />
          <StatCard label="AVG_SCORE"    value={`${stats?.avgScore || 0}%`}  icon="🎯" color="#00f5ff" delay={0.25} />
        </div>
      </div>

      {/* ── COURSES HORIZONTAL SCROLL ── */}
      {courses.length > 0 && (
        <div style={{ padding: '0 0 48px' }}>
          <div style={{ padding: '0 40px' }}>
            <SectionHeader label="// KNOWLEDGE BASE" title="ACTIVE COURSES"
              action={
                <button onClick={() => setActiveTab('courses')}
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 2, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00f5ff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}
                >VIEW ALL →</button>
              }
            />
          </div>

          {/* Scrollable row */}
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 40px 16px', scrollbarWidth: 'thin' }}>
            {courses.map((c, i) => (
              <CourseCard key={c.id} course={c} onOpen={id => navigate(`/course/${id}`)} onDelete={handleDelete} delay={i * 0.08} />
            ))}
            {/* Add new card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: courses.length * 0.08 }}
              onClick={() => setShowAnalyze(true)}
              style={{ width: 280, flexShrink: 0, border: '1px dashed rgba(0,245,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', padding: 32, transition: 'all 0.25s', minHeight: 200 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.4)'; e.currentTarget.style.background = 'rgba(0,245,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.15)'; e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: 44, height: 44, border: '1px solid rgba(0,245,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5070' }}>
                <HiOutlinePlus size={20} />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2, textAlign: 'center' }}>ADD COURSE</div>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      <div style={{ padding: '0 40px 48px' }}>
        <SectionHeader label="// INTELLIGENCE REPORT" title="ANALYTICS" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Quiz performance */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ background: 'rgba(4,4,14,0.95)', border: '1px solid rgba(123,47,255,0.15)', borderTop: '2px solid #7b2fff', padding: '22px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 18 }}>QUIZ_PERFORMANCE</div>
            {quizData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={quizData}>
                  <defs>
                    <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7b2fff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7b2fff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#4a5070', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
                  <YAxis domain={[0,100]} tick={{ fill: '#4a5070', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Area type="monotone" dataKey="score" stroke="#7b2fff" fill="url(#qGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2 }}>NO QUIZ DATA YET</div>
            )}
          </motion.div>

          {/* Videos per course */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ background: 'rgba(4,4,14,0.95)', border: '1px solid rgba(0,245,255,0.12)', borderTop: '2px solid #00f5ff', padding: '22px', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 18 }}>VIDEO_COMPLETION</div>
            {courses.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={courses.map(c => ({ name: c.title.slice(0,12)+'…', total: c.video_count, done: c.progress ? Math.round(c.video_count * c.progress / 100) : 0 }))}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#4a5070', fontSize: 8, fontFamily: 'JetBrains Mono, monospace' }} />
                  <YAxis tick={{ fill: '#4a5070', fontSize: 8, fontFamily: 'JetBrains Mono, monospace' }} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="total" fill="rgba(0,245,255,0.12)" name="TOTAL" />
                  <Bar dataKey="done"  fill="#00f5ff" name="DONE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2 }}>NO COURSES YET</div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── ACHIEVEMENTS STRIP ── */}
      {(stats?.achievements?.length || 0) > 0 && (
        <div style={{ padding: '0 40px 48px' }}>
          <SectionHeader label="// OPERATOR RECORD" title="ACHIEVEMENTS"
            action={
              <button onClick={() => setActiveTab('achievements')}
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: 2, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00f5ff'}
                onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}
              >VIEW ALL →</button>
            }
          />
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 0 12px' }}>
            {stats.achievements.map((a, i) => (
              <motion.div key={a.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                style={{ flexShrink: 0, width: 140, background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.15)', padding: '18px 14px', textAlign: 'center' }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#00f5ff', letterSpacing: 1, marginBottom: 4 }}>{a.name.toUpperCase()}</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#4a5070', fontSize: 11 }}>{a.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {courses.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ margin: '0 40px 48px', padding: '64px 40px', background: 'rgba(4,4,14,0.95)', border: '1px dashed rgba(0,245,255,0.1)', textAlign: 'center' }}
        >
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 13, color: '#4a5070', letterSpacing: 3, marginBottom: 12 }}>NO ACTIVE COURSES</div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#4a5070', fontSize: 14, marginBottom: 28 }}>Analyze a YouTube playlist to populate your knowledge base</div>
          <button onClick={() => setShowAnalyze(true)}
            style={{ padding: '12px 28px', background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(123,47,255,0.12))', border: '1px solid rgba(0,245,255,0.35)', color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: 2, cursor: 'pointer' }}>
            INITIATE FIRST SCAN →
          </button>
        </motion.div>
      )}
    </div>
  )

  // ── Other tabs (courses / progress / achievements / settings) kept intact ─
  const CoursesTab = () => (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 4 }}>// KNOWLEDGE BASE</div>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#dde4f0', letterSpacing: 2 }}>MY COURSES</div>
        </div>
        <button onClick={() => setShowAnalyze(true)} style={{ padding: '9px 18px', background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(123,47,255,0.12))', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <HiOutlinePlus size={12} /> NEW SCAN
        </button>
      </div>
      {courses.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed rgba(0,245,255,0.1)' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 13, color: '#4a5070', letterSpacing: 2, marginBottom: 12 }}>NO COURSES FOUND</div>
          <button onClick={() => setShowAnalyze(true)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(123,47,255,0.12))', border: '1px solid rgba(0,245,255,0.3)', color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: 2, cursor: 'pointer' }}>
            INITIATE FIRST SCAN →
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {courses.map((c, i) => <CourseCard key={c.id} course={c} onOpen={id => navigate(`/course/${id}`)} onDelete={handleDelete} delay={i * 0.06} />)}
        </div>
      )}
    </div>
  )

  const ProgressTab = () => (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 4 }}>// PERFORMANCE METRICS</div><div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#dde4f0', letterSpacing: 2 }}>ANALYTICS</div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="COMPLETION_RATE" value={`${stats?.completionRate || 0}%`} color="#00f5ff" icon="📊" />
        <StatCard label="VIDS_WATCHED"    value={stats?.watchedVideos || 0}         color="#7b2fff" icon="🎥" sub={`OF ${stats?.totalVideos || 0} TOTAL`} />
        <StatCard label="QUIZZES_TAKEN"   value={stats?.quizzesTaken || 0}          color="#06d6a0" icon="📝" />
        <StatCard label="AVG_QUIZ_SCORE"  value={`${stats?.avgScore || 0}%`}        color="#f59e0b" icon="🏆" />
      </div>
      {[
        { title: 'QUIZ_SCORES_TIMELINE', content: quizData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={quizData}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#4a5070', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
              <YAxis domain={[0,100]} tick={{ fill: '#4a5070', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
              <Tooltip contentStyle={TOOLTIP} />
              <Line type="monotone" dataKey="score" stroke="#00f5ff" strokeWidth={2} dot={{ fill: '#00f5ff', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : null, color: '#7b2fff' },
        { title: 'VIDEOS_PER_COURSE', content: courses.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={courses.map(c => ({ name: c.title.slice(0,16)+'…', total: c.video_count, done: c.progress ? Math.round(c.video_count * c.progress / 100) : 0 }))}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: '#4a5070', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
              <YAxis tick={{ fill: '#4a5070', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
              <Tooltip contentStyle={TOOLTIP} />
              <Bar dataKey="total" fill="rgba(123,47,255,0.3)" name="TOTAL" />
              <Bar dataKey="done"  fill="#00f5ff" name="DONE" />
            </BarChart>
          </ResponsiveContainer>
        ) : null, color: '#00f5ff' },
      ].map(({ title, content, color }) => (
        <div key={title} style={{ background: 'rgba(4,4,14,0.95)', border: `1px solid ${color}22`, borderTop: `2px solid ${color}`, padding: '22px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 18 }}>{title}</div>
          {content || <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2 }}>NO DATA YET</div>}
        </div>
      ))}
    </div>
  )

  const AchievementsTab = () => (
    <div style={{ padding: '40px' }}>
      <div style={{ marginBottom: 28 }}><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 4 }}>// OPERATOR RECORD</div><div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#dde4f0', letterSpacing: 2 }}>ACHIEVEMENTS</div></div>
      <div style={{ background: 'rgba(4,4,14,0.95)', border: '1px solid rgba(245,158,11,0.2)', borderTop: '2px solid #f59e0b', padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 36, fontWeight: 900, color: '#f59e0b', letterSpacing: 2, textShadow: '0 0 24px rgba(245,158,11,0.4)' }}>{stats?.xp || 0}</div>
        <div><div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: '#f59e0b', letterSpacing: 2 }}>TOTAL XP EARNED</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', marginTop: 5, letterSpacing: 1 }}>KEEP LEARNING TO RANK UP</div></div>
      </div>
      {(stats?.achievements?.length || 0) > 0 && (
        <><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#00f5ff', letterSpacing: 3, marginBottom: 14 }}>UNLOCKED</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          {stats.achievements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              style={{ background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.2)', padding: '22px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#00f5ff', letterSpacing: 1, marginBottom: 5 }}>{a.name.toUpperCase()}</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#4a5070', fontSize: 12 }}>{a.description}</div>
            </motion.div>
          ))}
        </div></>
      )}
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 14 }}>LOCKED</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { icon: '🎯', name: 'First Course',       desc: 'Analyze your first course' },
          { icon: '📚', name: 'Dedicated Learner',   desc: 'Watch 10 videos' },
          { icon: '✏️', name: 'Quiz Taker',          desc: 'Complete your first quiz' },
          { icon: '🏆', name: 'Quiz Master',          desc: 'Complete 5 quizzes' },
          { icon: '⭐', name: 'High Scorer',          desc: 'Average score above 80%' },
          { icon: '🧠', name: 'Knowledge Seeker',     desc: 'Earn 500 XP' },
          { icon: '🔥', name: 'Week Warrior',         desc: '7-day learning streak' },
        ].filter(a => !stats?.achievements?.find(ea => ea.name === a.name)).map(a => (
          <div key={a.name} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '22px', textAlign: 'center', opacity: 0.4 }}>
            <div style={{ fontSize: 32, marginBottom: 8, filter: 'grayscale(1)' }}>{a.icon}</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#4a5070', letterSpacing: 1, marginBottom: 5 }}>{a.name.toUpperCase()}</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#4a5070', fontSize: 12 }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const SettingsTab = () => <div style={{ padding: '40px', maxWidth: 520 }}><div style={{ marginBottom: 24 }}><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3, marginBottom: 4 }}>// OPERATOR CONFIG</div><div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#dde4f0', letterSpacing: 2 }}>SETTINGS</div></div><ProfileSettings onSaved={() => { refreshUser(); toast.success('Profile updated') }} /></div>

  const TABS = { overview: <OverviewTab />, courses: <CoursesTab />, progress: <ProgressTab />, achievements: <AchievementsTab />, settings: <SettingsTab /> }

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content" style={{ background: '#020209', minHeight: '100vh' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 36, height: 36, border: '2px solid rgba(0,245,255,0.15)', borderTop: '2px solid #00f5ff', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 3 }}>LOADING DATA...</div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {TABS[activeTab] || TABS.overview}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AnalyzeModal isOpen={showAnalyze} onClose={() => setShowAnalyze(false)} onSuccess={handleAdded} />
      <ChatBot courseId={null} courseName={null} />
    </div>
  )
}

// ── Profile Settings ───────────────────────────────────────────────────────
function ProfileSettings({ onSaved }) {
  const { user } = useAuthStore()
  const [form, setForm] = useState({ name: user?.name || '', currentPassword: '', newPassword: '' })
  const [loading, setLoading] = useState(false)
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const fStyle = { width: '100%', background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.12)', color: '#c8d0e0', padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }

  const save = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const { updateProfile } = await import('../api')
      await updateProfile({ name: form.name, currentPassword: form.currentPassword || undefined, newPassword: form.newPassword || undefined })
      onSaved()
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }))
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={save}>
      <div style={{ background: 'rgba(4,4,14,0.95)', border: '1px solid rgba(0,245,255,0.1)', borderTop: '2px solid #00f5ff', padding: '28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {[
          { label: 'DISPLAY_NAME', name: 'name', type: 'text', disabled: false },
          { label: 'EMAIL_ADDRESS', name: 'email', type: 'email', disabled: true, value: user?.email || '' },
        ].map(({ label, name, type, disabled, value }) => (
          <div key={name}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
            <input type={type} name={name} value={value !== undefined ? value : form[name]} onChange={disabled ? undefined : handle} disabled={disabled}
              style={{ ...fStyle, opacity: disabled ? 0.4 : 1 }}
              onFocus={disabled ? undefined : e => e.target.style.borderColor = 'rgba(0,245,255,0.4)'}
              onBlur={disabled ? undefined : e => e.target.style.borderColor = 'rgba(0,245,255,0.12)'}
            />
          </div>
        ))}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2 }}>CHANGE_PASSWORD</div>
        {[
          { label: 'CURRENT_HASH', name: 'currentPassword', placeholder: 'Leave blank to keep' },
          { label: 'NEW_HASH',     name: 'newPassword',     placeholder: 'Min. 8 characters' },
        ].map(({ label, name, placeholder }) => (
          <div key={name}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
            <input type="password" name={name} placeholder={placeholder} value={form[name]} onChange={handle}
              style={fStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.12)'}
            />
          </div>
        ))}
        <button type="submit" disabled={loading}
          style={{ padding: '12px', background: loading ? 'rgba(0,245,255,0.04)' : 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(123,47,255,0.12))', border: `1px solid ${loading ? 'rgba(0,245,255,0.1)' : 'rgba(0,245,255,0.3)'}`, color: loading ? '#4a5070' : '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: 3, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          {loading ? 'SAVING...' : 'SAVE CHANGES →'}
        </button>
      </div>
    </form>
  )
}
