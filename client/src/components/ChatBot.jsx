import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { sendMessage as apiSendMessage, getChat } from '../api'
import useAuthStore from '../store/useAuthStore'
import { MiniNova } from './Nova'
import {
  HiOutlineChevronDown, HiOutlineTrash, HiOutlinePaperAirplane, HiOutlineXMark,
} from 'react-icons/hi2'

// Simple inline markdown renderer
function MsgContent({ text }) {
  const lines = text.split('\n')
  return (
    <div style={{ fontSize: 13, lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <div key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--accent)', marginTop: 10, marginBottom: 4, fontWeight: 600 }}>{line.slice(4)}</div>
        if (line.startsWith('## '))  return <div key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--accent)', marginTop: 10, marginBottom: 4, fontWeight: 600 }}>{line.slice(3)}</div>
        if (line.startsWith('# '))   return <div key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--accent)', marginTop: 10, marginBottom: 4, fontWeight: 700 }}>{line.slice(2)}</div>
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ paddingLeft: 12, marginBottom: 3, color: 'var(--text-primary)' }}>· {line.slice(2)}</div>
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        return (
          <div key={i} style={{ marginBottom: 2, color: 'var(--text-primary)' }}>
            {parts.map((p, j) => {
              if (p.startsWith('**') && p.endsWith('**')) return <strong key={j} style={{ color: 'var(--accent)', fontWeight: 600 }}>{p.slice(2,-2)}</strong>
              if (p.startsWith('`') && p.endsWith('`'))   return <code key={j} style={{ fontFamily: 'var(--font-mono)', background: 'var(--accent-dim)', padding: '1px 5px', borderRadius: 4, fontSize: 11, color: 'var(--accent)' }}>{p.slice(1,-1)}</code>
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
  const activeCourseId = courseId || null

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!isOpen) return
    if (activeCourseId) { loadHistory() }
    else {
      setMessages([{
        role: 'assistant',
        content: `**Hi! I'm Nova** ✦\n\nI'm your AI study companion. I can explain concepts, quiz you, or help you understand anything.\n\nOpen a course for context-aware learning, or just ask me anything!`,
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
          content: `**Course loaded** ✓\n\nAsk me anything about **${courseName || 'this course'}** — I can explain topics, summarize content, quiz you, or help with anything you find difficult.`,
          timestamp: new Date().toISOString(),
        }])
      } else { setMessages(msgs) }
    } catch {
      setMessages([{ role: 'assistant', content: 'Connection issue. Please try again.', timestamp: new Date().toISOString() }])
    } finally { setHistoryLoading(false) }
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
    } finally { setLoading(false) }
  }

  const clearChat = () => setMessages([{
    role: 'assistant',
    content: activeCourseId
      ? `Chat cleared. Ready to help with **${courseName || 'this course'}**.`
      : 'Chat cleared. What would you like to learn?',
    timestamp: new Date().toISOString(),
  }])

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  if (!user) return null

  return (
    <>
      {/* Nova orb button */}
      <motion.button
        id="chatbot-orb"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          width: 52, height: 52, borderRadius: '50%', border: 'none',
          background: isOpen ? 'var(--accent-danger)' : 'var(--bg-surface)',
          borderColor: isOpen ? 'transparent' : 'var(--border-active)',
          borderWidth: 1, borderStyle: 'solid',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen ? '0 0 20px rgba(239,68,68,0.3)' : 'var(--shadow-glow)',
          transition: 'all 0.2s',
        }}
      >
        {isOpen
          ? <HiOutlineXMark size={20} style={{ color: '#fff' }} />
          : <MiniNova size={36} state="idle" />
        }
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 86, right: 24, zIndex: 998,
              width: 360, maxHeight: 520,
              display: 'flex', flexDirection: 'column',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MiniNova size={32} state={loading ? 'thinking' : 'idle'} />
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Nova</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {activeCourseId ? courseName || `Course #${activeCourseId}` : 'General mode'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={clearChat}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Clear chat"
                >
                  <HiOutlineTrash size={14} />
                </button>
                <button onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <HiOutlineChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 12 }}>Loading history...</div>
              ) : messages.map((msg, i) => {
                const isUser = msg.role === 'user'
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}
                  >
                    {!isUser && <MiniNova size={24} state={loading && i === messages.length - 1 ? 'thinking' : 'idle'} />}
                    <div style={{
                      maxWidth: '80%', padding: '8px 12px',
                      borderRadius: isUser ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
                      background: isUser ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${isUser ? 'var(--border-active)' : 'var(--border)'}`,
                    }}>
                      {isUser
                        ? <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>{msg.content}</span>
                        : <MsgContent text={msg.content} />
                      }
                    </div>
                  </motion.div>
                )
              })}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  <MiniNova size={24} state="thinking" />
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '3px 12px 12px 12px', padding: '11px 14px', display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: `glowPulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '8px 10px 10px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask Nova anything..."
                  rows={1}
                  style={{
                    flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', padding: '8px 12px',
                    fontSize: 13, fontFamily: 'var(--font-body)', resize: 'none', outline: 'none',
                    maxHeight: 80, overflowY: 'auto', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{
                    width: 34, height: 34, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                    background: input.trim() && !loading ? 'var(--accent)' : 'var(--border)',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <HiOutlinePaperAirplane size={14} style={{ color: input.trim() && !loading ? '#fff' : 'var(--text-muted)', transform: 'rotate(-45deg)' }} />
                </button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontFamily: 'var(--font-mono)', paddingLeft: 2 }}>
                Enter to send · Shift+Enter for newline
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
