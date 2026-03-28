import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { sendMessage as apiSendMessage, getChat } from '../api'
import useAuthStore from '../store/useAuthStore'
import { HiOutlineX, HiOutlinePaperAirplane, HiOutlineChevronDown, HiOutlineTrash } from 'react-icons/hi'

// Simple inline markdown
function MsgContent({ text }) {
  const lines = text.split('\n')
  return (
    <div style={{ fontSize: 13, lineHeight: 1.65 }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <div key={i} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: '#00f5ff', letterSpacing: 1, marginTop: 10, marginBottom: 4 }}>{line.slice(4)}</div>
        if (line.startsWith('## ')) return <div key={i} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, color: '#00f5ff', letterSpacing: 1, marginTop: 10, marginBottom: 4 }}>{line.slice(3)}</div>
        if (line.startsWith('# '))  return <div key={i} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 13, color: '#00f5ff', letterSpacing: 1, marginTop: 10, marginBottom: 4 }}>{line.slice(2)}</div>
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ paddingLeft: 12, marginBottom: 2 }}>· {line.slice(2)}</div>
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />
        // Inline **bold** and `code`
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        return (
          <div key={i} style={{ marginBottom: 2 }}>
            {parts.map((p, j) => {
              if (p.startsWith('**') && p.endsWith('**')) return <strong key={j} style={{ color: '#00f5ff' }}>{p.slice(2,-2)}</strong>
              if (p.startsWith('`') && p.endsWith('`'))   return <code key={j} style={{ fontFamily: 'JetBrains Mono, monospace', background: 'rgba(0,245,255,0.1)', padding: '1px 5px', borderRadius: 3, fontSize: 11, color: '#00f5ff' }}>{p.slice(1,-1)}</code>
              return <span key={j}>{p}</span>
            })}
          </div>
        )
      })}
    </div>
  )
}

export default function ChatBot({ courseId, courseName }) {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen]     = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const endRef = useRef(null)

  // courseId can be null (general) or a number (course-specific)
  const activeCourseId = courseId || null

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isOpen) return
    if (activeCourseId) {
      loadHistory()
    } else {
      setMessages([{
        role: 'assistant',
        content: `**Hi! I'm Nyra** 🤖\n\nI'm your AI study companion. I can explain any concept, teach topics using the Socratic method, or help you understand difficult material.\n\nOpen a course for context-aware chat, or just ask me anything!`,
        timestamp: new Date().toISOString(),
      }])
    }
  }, [isOpen, activeCourseId])

  const loadHistory = async () => {
    if (!activeCourseId) return
    setHistoryLoading(true)
    try {
      const res = await getChat(activeCourseId)
      const msgs = res.data.chat.messages || []
      if (msgs.length === 0) {
        setMessages([{
          role: 'assistant',
          content: `**Course loaded: ${courseName || 'Ready'}** ✓\n\nAsk me anything about this course — I can explain topics, summarise content, quiz you, or help you understand difficult concepts.`,
          timestamp: new Date().toISOString(),
        }])
      } else {
        setMessages(msgs)
      }
    } catch {
      setMessages([{ role: 'assistant', content: "Connection issue. Please try again.", timestamp: new Date().toISOString() }])
    } finally {
      setHistoryLoading(false)
    }
  }

  const send = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    const sentInput = input.trim()
    setInput('')
    setLoading(true)

    try {
      const res = await apiSendMessage(activeCourseId || 0, sentInput)
      setMessages(res.data.messages)
    } catch (err) {
      const errMsg = err.response?.data?.error || "I'm having trouble right now. Please try again."
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg, timestamp: new Date().toISOString() }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: activeCourseId
        ? `**Chat cleared.** Ask me anything about ${courseName || 'this course'}.`
        : `**Chat cleared.** I'm ready — what would you like to learn?`,
      timestamp: new Date().toISOString(),
    }])
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (!user) return null

  return (
    <>
      {/* Orb button */}
      <motion.button
        id="chatbot-orb"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 999,
          width: 54, height: 54, borderRadius: '50%', border: 'none',
          background: isOpen
            ? 'linear-gradient(135deg, #f72585, #7b2fff)'
            : 'linear-gradient(135deg, #7b2fff, #00f5ff)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, animation: 'orbPulse 2.5s ease-in-out infinite',
          boxShadow: '0 0 24px rgba(123,47,255,0.5)',
        }}
      >
        {isOpen ? '×' : '🤖'}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              position: 'fixed', bottom: 92, right: 28, zIndex: 998,
              width: 370, maxHeight: 540,
              display: 'flex', flexDirection: 'column',
              background: '#08081a',
              border: '1px solid rgba(123,47,255,0.35)',
              borderRadius: 12,
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(123,47,255,0.12)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px',
              background: 'linear-gradient(135deg, rgba(123,47,255,0.12), rgba(0,245,255,0.06))',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 20 }}>🤖</div>
                <div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 700, color: '#dde4f0', letterSpacing: 1 }}>NYRA</div>
                  <div style={{ fontSize: 10, color: '#4a5070', fontFamily: 'JetBrains Mono, monospace' }}>
                    {activeCourseId ? `COURSE #${activeCourseId}` : 'GENERAL MODE'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={clearChat} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5070', padding: '4px 6px', borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f72585'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}
                  title="Clear chat">
                  <HiOutlineTrash size={15} />
                </button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5070', padding: '4px 6px', borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dde4f0'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a5070'}>
                  <HiOutlineChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#4a5070', fontSize: 12, fontFamily: 'Orbitron, sans-serif', letterSpacing: 1 }}>
                  LOADING...
                </div>
              ) : messages.map((msg, i) => {
                const isUser = msg.role === 'user'
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 7 }}
                  >
                    {!isUser && (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #7b2fff, #00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, marginBottom: 2 }}>🤖</div>
                    )}
                    <div style={{
                      maxWidth: '80%', padding: '9px 13px',
                      borderRadius: isUser ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
                      background: isUser
                        ? 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(123,47,255,0.12))'
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isUser ? 'rgba(0,245,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
                      color: '#c8d0e0',
                    }}>
                      {isUser ? <span style={{ fontSize: 13 }}>{msg.content}</span> : <MsgContent text={msg.content} />}
                    </div>
                  </motion.div>
                )
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #7b2fff, #00f5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>🤖</div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '3px 12px 12px 12px', padding: '11px 16px', display: 'flex', gap: 5 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#7b2fff', animation: `glowPulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask Nyra anything..."
                  rows={1}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, color: '#c8d0e0', padding: '9px 12px',
                    fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 500,
                    resize: 'none', outline: 'none', maxHeight: 90, overflowY: 'auto',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(123,47,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: input.trim() && !loading
                      ? 'linear-gradient(135deg, #7b2fff, #00f5ff)'
                      : 'rgba(255,255,255,0.08)',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <HiOutlinePaperAirplane size={15} style={{ color: input.trim() && !loading ? '#fff' : '#4a5070', transform: 'rotate(90deg)' }} />
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#4a5070', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                ENTER ↵ send  ·  SHIFT+ENTER newline
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
