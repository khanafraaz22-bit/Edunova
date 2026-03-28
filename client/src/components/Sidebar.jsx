import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'
import {
  HiOutlineHome, HiOutlineBookOpen, HiOutlineChartBar,
  HiOutlineCog, HiOutlineLogout,
} from 'react-icons/hi'
import { HiOutlineSparkles, HiOutlineTrophy } from 'react-icons/hi2'

const NAV = [
  { tab: 'overview',      label: 'OVERVIEW',      icon: HiOutlineHome },
  { tab: 'courses',       label: 'COURSES',        icon: HiOutlineBookOpen },
  { tab: 'progress',      label: 'ANALYTICS',      icon: HiOutlineChartBar },
  { tab: 'achievements',  label: 'ACHIEVEMENTS',   icon: HiOutlineTrophy },
  { tab: 'settings',      label: 'SETTINGS',       icon: HiOutlineCog },
]

export default function Sidebar({ activeTab, onTabChange }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Session terminated')
    navigate('/')
  }

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', background: '#020209', borderRight: '1px solid rgba(0,245,255,0.08)' }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(0,245,255,0.06)' }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 17, letterSpacing: 4, background: 'linear-gradient(135deg, #00f5ff, #7b2fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          EDUNOVA
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', marginTop: 4, letterSpacing: 2 }}>
          AI LEARNING SYSTEM
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,245,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(123,47,255,0.12))',
            border: '1px solid rgba(0,245,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 13, color: '#00f5ff',
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, fontWeight: 600, color: '#c8d0e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Operator'}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <HiOutlineSparkles style={{ color: '#f59e0b', fontSize: 10 }} />
              {user?.xp || 0} XP
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ tab, label, icon: Icon }) => {
          const isActive = activeTab === tab || (!activeTab && tab === 'overview')
          return (
            <button key={tab} onClick={() => { onTabChange(tab); navigate('/dashboard') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 11px', cursor: 'pointer',
                background: isActive ? 'rgba(0,245,255,0.06)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(0,245,255,0.18)' : 'transparent'}`,
                borderLeft: isActive ? '2px solid #00f5ff' : '2px solid transparent',
                color: isActive ? '#00f5ff' : '#4a5070',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2,
                transition: 'all 0.15s', width: '100%', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#8a94b0'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = '#4a5070'; e.currentTarget.style.background = 'transparent' } }}
            >
              <Icon style={{ fontSize: 14, flexShrink: 0 }} />
              {label}
              {isActive && <div style={{ marginLeft: 'auto', width: 3, height: 3, background: '#00f5ff' }} />}
            </button>
          )
        })}
      </nav>

      {/* Status indicator */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,245,255,0.06)', borderBottom: '1px solid rgba(0,245,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 5, height: 5, background: '#06d6a0', borderRadius: '50%', boxShadow: '0 0 6px rgba(6,214,160,0.6)', animation: 'glowPulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4a5070', letterSpacing: 1 }}>SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '10px 10px' }}>
        <button onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 11px', cursor: 'pointer',
            background: 'transparent', border: '1px solid transparent',
            color: '#4a5070', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: 2,
            transition: 'all 0.15s', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f72585'; e.currentTarget.style.background = 'rgba(247,37,133,0.05)'; e.currentTarget.style.borderColor = 'rgba(247,37,133,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#4a5070'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
        >
          <HiOutlineLogout style={{ fontSize: 14 }} />
          SIGN OUT
        </button>
      </div>
    </aside>
  )
}
