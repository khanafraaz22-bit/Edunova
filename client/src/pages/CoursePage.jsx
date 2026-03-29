import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow'
import 'reactflow/dist/style.css'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import ChatBot from '../components/ChatBot'
import { getCourse, summarizeVideo, teachTopic, findTopic, generateMindMap, generateExam, submitExam, analyzeGaps, updateProgress } from '../api'
import { HiOutlinePlay, HiOutlineCheck, HiOutlineChevronDown, HiOutlineChevronRight, HiOutlineArrowLeft, HiOutlineSearch, HiOutlineX } from 'react-icons/hi'

// ── HUD Panel ─────────────────────────────────────────────────────────────
function HudPanel({ children, style = {}, cornerColor = '#00f5ff', accentColor = '#7b2fff' }) {
  return (
    <div style={{
      background: 'rgba(4,4,12,0.92)',
      border: '1px solid var(--border)',
      position: 'relative',
      clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
      ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTop: `1.5px solid ${cornerColor}`, borderLeft: `1.5px solid ${cornerColor}` }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottom: `1.5px solid ${accentColor}`, borderRight: `1.5px solid ${accentColor}` }} />
      {children}
    </div>
  )
}

// ── Markdown renderer ──────────────────────────────────────────────────────
function MarkdownContent({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: '#a8b4c8' }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <div key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--accent)', letterSpacing: 2, marginTop: 12, marginBottom: 4 }}>{line.slice(4)}</div>
        if (line.startsWith('## ')) return <div key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--accent)', letterSpacing: 2, marginTop: 14, marginBottom: 5 }}>{line.slice(3)}</div>
        if (line.startsWith('# '))  return <div key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--accent)', letterSpacing: 2, marginTop: 16, marginBottom: 6 }}>{line.slice(2)}</div>
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ paddingLeft: 14, marginBottom: 3, color: 'var(--text-secondary)' }}>▸ {line.slice(2)}</div>
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        return (
          <div key={i} style={{ marginBottom: 3 }}>
            {parts.map((p, j) => {
              if (p.startsWith('**') && p.endsWith('**')) return <strong key={j} style={{ color: 'var(--text-secondary)' }}>{p.slice(2,-2)}</strong>
              if (p.startsWith('`') && p.endsWith('`'))   return <code key={j} style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,245,255,0.08)', padding: '1px 6px', fontSize: 12, color: 'var(--accent)' }}>{p.slice(1,-1)}</code>
              return <span key={j}>{p}</span>
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── AI Loading ─────────────────────────────────────────────────────────────
function AILoading({ message = 'NYRA IS THINKING...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', gap: 16 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ width: 4, height: 24, background: '#00f5ff', opacity: 0.3, animation: `glowPulse 0.8s ease-in-out ${i*0.1}s infinite`, borderRadius: 2 }} />
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>{message}</div>
    </div>
  )
}

// ── Modal Shell ────────────────────────────────────────────────────────────
function AIModal({ title, label, isOpen, onClose, children, maxWidth = 700 }) {
  if (!isOpen) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,11,20,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-elevated)', border: '1px solid rgba(0,245,255,0.15)',
            width: '100%', maxWidth,
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            position: 'relative',
            clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '2px solid #00f5ff', borderLeft: '2px solid #00f5ff' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '2px solid #7b2fff', borderRight: '2px solid #7b2fff' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 3 }}>{label || '// AI MODULE'}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-primary)', letterSpacing: 2 }}>{title}</div>
            </div>
            <button onClick={onClose}
              style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(247,37,133,0.4)'; e.currentTarget.style.color = '#f72585' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#4a5070' }}
            >
              <HiOutlineX size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '22px 24px' }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const inputStyle = {
  width: '100%', background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.15)',
  color: 'var(--text-secondary)', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
}

const btnPrimary = {
  padding: '10px 20px', background: 'var(--accent-dim)',
  border: '1px solid rgba(0,245,255,0.3)', color: 'var(--accent)',
  fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 2,
  cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8,
}

const btnGhost = {
  padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 2,
  cursor: 'pointer', transition: 'all 0.2s',
}

function ResultBox({ children }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', padding: '20px', maxHeight: 400, overflowY: 'auto' }}>
      {children}
    </div>
  )
}

// ── 1. Summarize Modal ─────────────────────────────────────────────────────
function SummarizeModal({ isOpen, onClose, courseId, videos }) {
  const [selectedVideo, setSelectedVideo] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!selectedVideo) return toast.error('Select a video first')
    setLoading(true); setSummary('')
    try {
      const res = await summarizeVideo(courseId, selectedVideo)
      setSummary(res.data.summary)
      toast.success('+10 XP earned!')
    } catch { toast.error('Summarization failed') }
    finally { setLoading(false) }
  }

  return (
    <AIModal title="SUMMARIZE VIDEO" label="// AI SUMMARY ENGINE" isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <select value={selectedVideo} onChange={e => { setSelectedVideo(e.target.value); setSummary('') }}
          style={{ ...inputStyle, cursor: 'pointer' }}
          onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
        >
          <option value="">Select a video...</option>
          {videos.map(v => <option key={v.id} value={v.id}>{v.order_index + 1}. {v.title}</option>)}
        </select>
        <button style={{ ...btnPrimary, opacity: (!selectedVideo || loading) ? 0.5 : 1, justifyContent: 'center' }} onClick={run} disabled={!selectedVideo || loading}>
          {loading ? 'PROCESSING...' : 'GENERATE SUMMARY →'}
        </button>
        {loading && <AILoading message="GENERATING SUMMARY..." />}
        {summary && <ResultBox><MarkdownContent text={summary} /></ResultBox>}
      </div>
    </AIModal>
  )
}

// ── 2. Teach Me Modal ──────────────────────────────────────────────────────
function TeachModal({ isOpen, onClose, courseId }) {
  const [topic, setTopic] = useState('')
  const [response, setResponse] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState(false)

  const run = async (isFollowUp = false) => {
    const query = isFollowUp ? followUp : topic
    if (!query.trim()) return toast.error('Enter a topic')
    setLoading(true)
    try {
      const res = await teachTopic(courseId, session ? undefined : topic, isFollowUp ? followUp : undefined)
      setResponse(res.data.response)
      setSession(true)
      if (isFollowUp) setFollowUp('')
      if (!isFollowUp) toast.success('+15 XP earned!')
    } catch { toast.error('Failed to get response') }
    finally { setLoading(false) }
  }

  const reset = () => { setTopic(''); setResponse(''); setFollowUp(''); setSession(false) }

  return (
    <AIModal title="TEACH ME A TOPIC" label="// SOCRATIC AI ENGINE" isOpen={isOpen} onClose={onClose} maxWidth={760}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!session ? (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
              Nyra will explain any topic from this course using the Socratic method.
            </div>
            <input style={inputStyle} placeholder="e.g., eigenvalues, dot product, gradient descent..." value={topic}
              onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
              onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
            />
            <button style={{ ...btnPrimary, opacity: (!topic.trim() || loading) ? 0.5 : 1, justifyContent: 'center' }} onClick={() => run()} disabled={!topic.trim() || loading}>
              {loading ? 'NYRA IS THINKING...' : 'BEGIN SESSION →'}
            </button>
            {loading && <AILoading message="COMPOSING EXPLANATION..." />}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', padding: '3px 10px', color: 'var(--accent)', letterSpacing: 1 }}>
                TOPIC: {topic.toUpperCase()}
              </span>
              <button style={{ ...btnGhost, padding: '3px 10px', fontSize: 9 }} onClick={reset}>NEW TOPIC</button>
            </div>
            {loading ? <AILoading message="COMPOSING..." /> : <ResultBox><MarkdownContent text={response} /></ResultBox>}
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Ask a follow-up question..." value={followUp}
                onChange={e => setFollowUp(e.target.value)} onKeyDown={e => e.key === 'Enter' && run(true)}
                onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
              />
              <button style={{ ...btnPrimary, flexShrink: 0, opacity: (!followUp.trim() || loading) ? 0.5 : 1 }} onClick={() => run(true)} disabled={!followUp.trim() || loading}>
                ASK →
              </button>
            </div>
          </>
        )}
      </div>
    </AIModal>
  )
}

// ── 3. Find Topic Modal ────────────────────────────────────────────────────
function FindModal({ isOpen, onClose, courseId }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const run = async () => {
    if (!query.trim()) return toast.error('Enter a search term')
    setLoading(true); setSearched(false)
    try {
      const res = await findTopic(courseId, query)
      setResults(res.data.results); setSearched(true)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  return (
    <AIModal title="SEMANTIC SEARCH" label="// TRANSCRIPT INDEXER" isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Search across all video transcripts..." value={query}
            onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()}
            onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
          />
          <button style={{ ...btnPrimary, flexShrink: 0 }} onClick={run} disabled={loading}>
            <HiOutlineSearch size={14} />
          </button>
        </div>
        {loading && <AILoading message="SCANNING TRANSCRIPTS..." />}
        {searched && results.length === 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '28px', letterSpacing: 1 }}>NO RESULTS FOR "{query.toUpperCase()}"</div>
        )}
        {results.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: 'rgba(0,245,255,0.03)', border: '1px solid var(--border)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--accent)', letterSpacing: 1 }}>{r.videoTitle}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', background: 'rgba(0,245,255,0.06)', padding: '2px 8px', letterSpacing: 1 }}>
                {Math.round((r.relevance || 0.7) * 100)}% MATCH
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{r.excerpt}</div>
          </motion.div>
        ))}
      </div>
    </AIModal>
  )
}

// ── 4. Mind Map Modal ──────────────────────────────────────────────────────
function calculateLayout(rawNodes, rawEdges) {
  const nodeMap = {}
  rawNodes.forEach(n => { nodeMap[n.id] = { ...n, children: [] } })
  const roots = []
  rawEdges.forEach(e => { if (nodeMap[e.source]) nodeMap[e.source].children.push(e.target) })
  rawNodes.forEach(n => { const hasParent = rawEdges.some(e => e.target === n.id); if (!hasParent) roots.push(n.id) })
  const positions = {}
  const placed = new Set()
  const centerX = 400, centerY = 300
  const rootId = roots[0] || rawNodes[0]?.id
  if (!rootId) return { nodes: [], edges: [] }
  positions[rootId] = { x: centerX, y: centerY }
  placed.add(rootId)
  const queue = [{ id: rootId, depth: 0, angle: 0, spread: Math.PI * 2 }]
  while (queue.length > 0) {
    const { id, depth, angle, spread } = queue.shift()
    const children = nodeMap[id]?.children || []
    const radius = 180 + depth * 80
    children.forEach((childId, idx) => {
      if (placed.has(childId)) return
      const childAngle = angle - spread / 2 + (spread / (children.length)) * (idx + 0.5)
      positions[childId] = { x: centerX + Math.cos(childAngle) * radius, y: centerY + Math.sin(childAngle) * radius }
      placed.add(childId)
      queue.push({ id: childId, depth: depth + 1, angle: childAngle, spread: spread / Math.max(children.length, 1) * 1.5 })
    })
  }
  let gx = 50, gy = 50
  rawNodes.forEach(n => { if (!positions[n.id]) { positions[n.id] = { x: gx, y: gy }; gx += 180; if (gx > 800) { gx = 50; gy += 100 } } })
  const nodes = rawNodes.map(n => ({
    id: String(n.id),
    data: { label: n.label || n.id },
    position: positions[n.id] || { x: 0, y: 0 },
    style: n.type === 'main'
      ? { background: 'rgba(0,245,255,0.12)', border: '1px solid #00f5ff', padding: '8px 16px', color: '#e8eaf6', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, minWidth: 120 }
      : { background: 'rgba(123,47,255,0.1)', border: '1px solid rgba(123,47,255,0.4)', padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 12, minWidth: 100 },
  }))
  const edges = rawEdges.map((e, i) => ({
    id: `e${i}`, source: String(e.source), target: String(e.target),
    style: { stroke: 'rgba(0,245,255,0.35)', strokeWidth: 1.5 }, animated: false,
  }))
  return { nodes, edges }
}

function MindMapModal({ isOpen, onClose, courseId }) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const res = await generateMindMap(courseId)
      const { nodes, edges } = calculateLayout(res.data.mindMap.nodes || [], res.data.mindMap.edges || [])
      setRfNodes(nodes); setRfEdges(edges); setGenerated(true)
      toast.success('+20 XP earned!')
    } catch { toast.error('Failed to generate mind map') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (isOpen && !generated) run() }, [isOpen])

  return (
    <AIModal title="KNOWLEDGE GRAPH" label="// MIND MAP GENERATOR" isOpen={isOpen} onClose={onClose} maxWidth={900}>
      {loading && <AILoading message="BUILDING MIND MAP..." />}
      {!loading && generated && (
        <>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 1 }}>
            DRAG NODES · SCROLL TO ZOOM · DOUBLE-CLICK TO EXPAND
          </div>
          <div style={{ height: 480, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-base)' }}>
            <ReactFlow nodes={rfNodes} edges={rfEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
              <Background color="rgba(0,245,255,0.03)" gap={28} />
              <Controls style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 0 }} />
              <MiniMap style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </ReactFlow>
          </div>
          <button style={{ ...btnGhost, marginTop: 12 }} onClick={() => { setGenerated(false); run() }}>REGENERATE</button>
        </>
      )}
    </AIModal>
  )
}

// ── 5. Exam Modal ──────────────────────────────────────────────────────────
function ExamModal({ isOpen, onClose, courseId, analysis }) {
  const [phase, setPhase] = useState('config')
  const [config, setConfig] = useState({ questionCount: 10, timeMinutes: 0 })
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (phase === 'taking' && config.timeMinutes > 0) {
      setTimeLeft(config.timeMinutes * 60)
      timerRef.current = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); submitAnswers(); return 0 } return t - 1 })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const generateQ = async () => {
    setPhase('loading')
    try {
      const topics = analysis?.topics?.slice(0, 5) || []
      const res = await generateExam(courseId, topics, config.questionCount)
      setQuestions(res.data.exam.questions || []); setAnswers({}); setPhase('taking')
    } catch { toast.error('Failed to generate exam'); setPhase('config') }
  }

  const submitAnswers = async () => {
    clearInterval(timerRef.current)
    let correct = 0
    const graded = questions.map(q => {
      const userAns = answers[q.id] || ''
      let isCorrect = false
      if (q.type === 'short-answer') isCorrect = userAns.toLowerCase().trim().includes((q.correctAnswer || '').toLowerCase().trim().slice(0, 10))
      else isCorrect = userAns === q.correctAnswer
      if (isCorrect) correct++
      return { ...q, userAnswer: userAns, isCorrect }
    })
    const score = questions.length > 0 ? (correct / questions.length) * 100 : 0
    try { await submitExam(courseId, questions, answers, score); toast.success(`SCORE: ${Math.round(score)}% — +${Math.round(score * 0.5)} XP`) } catch { /* non-fatal */ }
    setResult({ graded, score, correct, total: questions.length }); setPhase('result')
  }

  const reset = () => { setPhase('config'); setQuestions([]); setAnswers({}); setResult(null) }
  const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  return (
    <AIModal title="AI EXAMINATION" label="// ADAPTIVE EXAM ENGINE" isOpen={isOpen} onClose={() => { clearInterval(timerRef.current); onClose() }} maxWidth={760}>
      {phase === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
            Configure your exam. Nyra generates questions from course content.
          </div>
          {[
            { label: 'QUESTION_COUNT', key: 'questionCount', options: [5,10,15,20].map(n => ({ value: n, label: `${n} questions` })) },
            { label: 'TIME_LIMIT', key: 'timeMinutes', options: [{value:0,label:'No timer'},{value:15,label:'15 min'},{value:30,label:'30 min'},{value:45,label:'45 min'}] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
              <select style={selectStyle} value={config[key]} onChange={e => setConfig({ ...config, [key]: +e.target.value })}
                onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
              >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          <button style={{ ...btnPrimary, justifyContent: 'center' }} onClick={generateQ}>GENERATE EXAM →</button>
        </div>
      )}

      {phase === 'loading' && <AILoading message="NYRA IS WRITING YOUR EXAM..." />}

      {phase === 'taking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,245,255,0.04)', border: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{Object.keys(answers).length} / {questions.length} ANSWERED</span>
            {config.timeMinutes > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: timeLeft < 60 ? '#f72585' : '#00f5ff', fontWeight: 700, letterSpacing: 2 }}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>

          {questions.map((q, qi) => (
            <div key={q.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', padding: '18px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: 1, flexShrink: 0 }}>Q{String(qi+1).padStart(2,'0')}</span>
                <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{q.question}</span>
              </div>

              {q.type === 'mcq' && q.options?.map((opt, oi) => (
                <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 5, cursor: 'pointer', background: answers[q.id] === opt ? 'rgba(0,245,255,0.06)' : 'transparent', border: `1px solid ${answers[q.id] === opt ? 'rgba(0,245,255,0.25)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.15s' }}>
                  <input type="radio" name={`q${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers({ ...answers, [q.id]: opt })} style={{ accentColor: '#00f5ff' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>{opt}</span>
                </label>
              ))}

              {q.type === 'true-false' && ['true','false'].map(val => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 5, cursor: 'pointer', background: answers[q.id] === val ? 'rgba(0,245,255,0.06)' : 'transparent', border: `1px solid ${answers[q.id] === val ? 'rgba(0,245,255,0.25)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.15s' }}>
                  <input type="radio" name={`q${q.id}`} value={val} checked={answers[q.id] === val} onChange={() => setAnswers({ ...answers, [q.id]: val })} style={{ accentColor: '#00f5ff' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{val}</span>
                </label>
              ))}

              {q.type === 'short-answer' && (
                <input style={inputStyle} placeholder="Type your answer..." value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,245,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(0,245,255,0.15)'}
                />
              )}
            </div>
          ))}
          <button style={{ ...btnPrimary, justifyContent: 'center' }} onClick={submitAnswers}>SUBMIT EXAM →</button>
        </div>
      )}

      {phase === 'result' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(0,0,0,0.4)', border: `1px solid ${result.score >= 70 ? 'rgba(0,245,255,0.2)' : result.score >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(247,37,133,0.2)'}` }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, color: result.score >= 70 ? '#00f5ff' : result.score >= 50 ? '#f59e0b' : '#f72585', letterSpacing: 3 }}>
              {Math.round(result.score)}%
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 6, letterSpacing: 2 }}>{result.correct} / {result.total} CORRECT</div>
          </div>

          {result.graded.map((q, i) => (
            <div key={i} style={{ padding: '14px 16px', background: q.isCorrect ? 'rgba(6,214,160,0.04)' : 'rgba(247,37,133,0.04)', border: `1px solid ${q.isCorrect ? 'rgba(6,214,160,0.2)' : 'rgba(247,37,133,0.2)'}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: q.isCorrect ? 0 : 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: q.isCorrect ? '#06d6a0' : '#f72585', letterSpacing: 1, flexShrink: 0 }}>{q.isCorrect ? 'OK' : 'ERR'}</span>
                <span style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: 13 }}>{q.question}</span>
              </div>
              {!q.isCorrect && (
                <div style={{ padding: '8px 12px', background: 'rgba(0,245,255,0.04)', marginTop: 4 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: 1, marginBottom: 4 }}>CORRECT: {q.correctAnswer}</div>
                  {q.explanation && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{q.explanation}</div>}
                </div>
              )}
            </div>
          ))}
          <button style={btnGhost} onClick={reset}>TAKE ANOTHER EXAM</button>
        </div>
      )}
    </AIModal>
  )
}

// ── 6. Gap Analysis Modal ──────────────────────────────────────────────────
function GapModal({ isOpen, onClose, courseId }) {
  const [gapAnalysis, setGapAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { if (isOpen && !done) run() }, [isOpen])

  const run = async () => {
    setLoading(true); setGapAnalysis('')
    try {
      const res = await analyzeGaps(courseId)
      setGapAnalysis(res.data.analysis); setDone(true)
      toast.success('+15 XP earned!')
    } catch { toast.error('Analysis failed') }
    finally { setLoading(false) }
  }

  return (
    <AIModal title="CURRICULUM GAP ANALYSIS" label="// AI LEARNING ADVISOR" isOpen={isOpen} onClose={onClose} maxWidth={760}>
      {loading && <AILoading message="ANALYZING CURRICULUM GAPS..." />}
      {gapAnalysis && (
        <>
          <ResultBox><MarkdownContent text={gapAnalysis} /></ResultBox>
          <button style={{ ...btnGhost, marginTop: 12 }} onClick={() => { setDone(false); run() }}>REFRESH ANALYSIS</button>
        </>
      )}
    </AIModal>
  )
}

// ── Action Card ────────────────────────────────────────────────────────────
function ActionCard({ emoji, title, desc, color, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '18px 16px', cursor: 'pointer',
        background: hovered ? `rgba(${color === '#00f5ff' ? '0,245,255' : color === '#7b2fff' ? '123,47,255' : color === '#06d6a0' ? '6,214,160' : color === '#f59e0b' ? '245,158,11' : color === '#f72585' ? '247,37,133' : '0,245,255'},0.06)` : 'rgba(4,4,12,0.9)',
        border: `1px solid ${hovered ? color : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `3px solid ${color}`,
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: hovered ? '#dde4f0' : '#8a94b0', marginBottom: 6, letterSpacing: 1, transition: 'color 0.2s' }}>{title.toUpperCase()}</div>
      <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
    </motion.div>
  )
}

// ── Main CoursePage ────────────────────────────────────────────────────────
export default function CoursePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [expandedVideo, setExpandedVideo] = useState(null)

  const open  = modal => setActiveModal(modal)
  const close = ()    => setActiveModal(null)

  useEffect(() => { loadCourse() }, [id])

  const loadCourse = async () => {
    setLoading(true)
    try {
      const res = await getCourse(id)
      setCourse(res.data.course)
    } catch { toast.error('Course not found'); navigate('/dashboard') }
    finally { setLoading(false) }
  }

  const markWatched = async (videoId, currentStatus) => {
    const newStatus = currentStatus === 'watched' ? 'unwatched' : 'watched'
    try {
      await updateProgress(videoId, newStatus)
      setCourse(c => ({ ...c, videos: c.videos.map(v => v.id === videoId ? { ...v, status: newStatus } : v) }))
      if (newStatus === 'watched') toast.success('+5 XP earned!')
    } catch { toast.error('Failed to update progress') }
  }

  const analysis = (() => { try { return JSON.parse(course?.analysis_json || '{}') } catch { return {} } })()
  const watchedCount = course?.videos?.filter(v => v.status === 'watched').length || 0
  const progressPct  = course?.videos?.length > 0 ? Math.round((watchedCount / course.videos.length) * 100) : 0

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar activeTab="courses" onTabChange={() => navigate('/dashboard')} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
          <AILoading message="LOADING COURSE DATA..." />
        </main>
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="app-layout">
      <Sidebar activeTab="courses" onTabChange={() => navigate('/dashboard')} />

      <main className="main-content" style={{ padding: '28px 32px', background: 'var(--bg-base)', minHeight: '100vh' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back */}
          <button onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, marginBottom: 24, padding: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#00f5ff'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}
          >
            <HiOutlineArrowLeft size={12} /> BACK TO DASHBOARD
          </button>

          {/* Course header panel */}
          <HudPanel style={{ padding: '22px 24px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>// COURSE BRIEFING</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(13px, 1.8vw, 18px)', color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.3, letterSpacing: 1 }}>
              {course.title}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.15)', padding: '3px 9px', letterSpacing: 1 }}>{course.video_count} VIDEOS</span>
              {analysis.difficulty && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-violet)', background: 'rgba(123,47,255,0.08)', border: '1px solid rgba(123,47,255,0.2)', padding: '3px 9px', letterSpacing: 1 }}>{analysis.difficulty.toUpperCase()}</span>}
              {analysis.estimatedHours && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-success)', background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', padding: '3px 9px', letterSpacing: 1 }}>~{analysis.estimatedHours}H</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 1 }}>
              <span>PROGRESS: {watchedCount}/{course.video_count} WATCHED</span>
              <span style={{ color: 'var(--accent)' }}>{progressPct}%</span>
            </div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.7 }} style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-violet))' }} />
            </div>
          </HudPanel>
        </motion.div>

        {/* Main layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Course overview */}
            {analysis.summary && (
              <HudPanel style={{ padding: '20px 22px' }} accentColor="#06d6a0">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 10 }}>COURSE_OVERVIEW</div>
                <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>{analysis.summary}</div>
                {analysis.prerequisites?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>PREREQUISITES</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {analysis.prerequisites.map(p => <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-pink)', background: 'rgba(247,37,133,0.08)', border: '1px solid rgba(247,37,133,0.2)', padding: '2px 8px', letterSpacing: 1 }}>{p}</span>)}
                    </div>
                  </div>
                )}
              </HudPanel>
            )}

            {/* AI Tools */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 14 }}>AI_STUDY_TOOLS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                <ActionCard emoji="📋" title="Summarize Video"  desc="Structured AI summary of any video"          color="#00f5ff" onClick={() => open('summarize')} />
                <ActionCard emoji="🎓" title="Teach Me"         desc="Socratic method explanation by Nyra"         color="#7b2fff" onClick={() => open('teach')} />
                <ActionCard emoji="🔍" title="Find Topic"       desc="Semantic search across all transcripts"     color="#06d6a0" onClick={() => open('find')} />
                <ActionCard emoji="🧠" title="Mind Map"         desc="Visual knowledge graph of the course"       color="#f59e0b" onClick={() => open('mindmap')} />
                <ActionCard emoji="📝" title="Take Exam"        desc="AI-generated quiz with instant grading"     color="#f72585" onClick={() => open('exam')} />
                <ActionCard emoji="💡" title="Gap Analysis"     desc="Find missing concepts, get resources"       color="#00f5ff" onClick={() => open('gaps')} />
                <ActionCard emoji="💬" title="Chat with Nyra"   desc="Open AI chatbot in course context"          color="#7b2fff" onClick={() => document.getElementById('chatbot-orb')?.click()} />
              </div>
            </div>

            {/* Topics */}
            {analysis.topics?.length > 0 && (
              <HudPanel style={{ padding: '18px 20px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 12 }}>TOPICS_COVERED</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {analysis.topics.map(t => <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', background: 'rgba(0,245,255,0.06)', border: '1px solid var(--border)', padding: '3px 9px', letterSpacing: 1 }}>{t}</span>)}
                </div>
              </HudPanel>
            )}
          </div>

          {/* Right: Video list */}
          <HudPanel style={{ padding: '18px' }} accentColor="#06d6a0">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 14 }}>
              VIDEO_INDEX ({course.video_count})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 560, overflowY: 'auto' }}>
              {course.videos?.map((video, i) => {
                const watched  = video.status === 'watched'
                const expanded = expandedVideo === video.id
                return (
                  <div key={video.id}>
                    <div
                      onClick={() => setExpandedVideo(expanded ? null : video.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', cursor: 'pointer',
                        background: watched ? 'rgba(0,245,255,0.04)' : 'transparent',
                        border: `1px solid ${watched ? 'rgba(0,245,255,0.1)' : 'transparent'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <button
                        onClick={e => { e.stopPropagation(); markWatched(video.id, video.status) }}
                        style={{ width: 20, height: 20, border: `1.5px solid ${watched ? '#00f5ff' : 'rgba(255,255,255,0.15)'}`, background: watched ? 'rgba(0,245,255,0.2)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0, transition: 'all 0.2s' }}
                      >
                        {watched
                          ? <HiOutlineCheck size={10} style={{ color: 'var(--accent)' }} />
                          : <HiOutlinePlay size={9} style={{ color: 'var(--text-muted)' }} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: watched ? '#c8d0e0' : '#6a7090', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginRight: 6 }}>{String(i+1).padStart(2,'0')}</span>
                          {video.title}
                        </div>
                      </div>
                      {expanded ? <HiOutlineChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <HiOutlineChevronRight size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    </div>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', paddingLeft: 38 }}>
                          <a href={`https://youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: 1, margin: '6px 0', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#00f5ff'; e.currentTarget.style.borderColor = 'rgba(0,245,255,0.25)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#4a5070'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                          >
                            ▶ WATCH ON YOUTUBE
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </HudPanel>
        </div>
      </main>

      <SummarizeModal isOpen={activeModal === 'summarize'} onClose={close} courseId={Number(id)} videos={course.videos || []} />
      <TeachModal     isOpen={activeModal === 'teach'}     onClose={close} courseId={Number(id)} />
      <FindModal      isOpen={activeModal === 'find'}      onClose={close} courseId={Number(id)} />
      <MindMapModal   isOpen={activeModal === 'mindmap'}   onClose={close} courseId={Number(id)} />
      <ExamModal      isOpen={activeModal === 'exam'}      onClose={close} courseId={Number(id)} analysis={analysis} />
      <GapModal       isOpen={activeModal === 'gaps'}      onClose={close} courseId={Number(id)} />

      <ChatBot courseId={Number(id)} courseName={course.title} />
    </div>
  )
}
