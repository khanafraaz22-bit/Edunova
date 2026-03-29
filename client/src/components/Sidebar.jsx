import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'
import { MiniNova } from './Nova'
import { useTheme } from '../context/ThemeContext'
import {
  HiOutlineHome, HiOutlineBookOpen, HiOutlineChartBar,
  HiOutlineCog, HiOutlineLogout,
} from 'react-icons/hi'
import { HiOutlineTrophy, HiOutlineSparkles } from 'react-icons/hi2'
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi'

const NAV = [
  { tab: 'overview',     label: 'Overview',    icon: HiOutlineHome },
  { tab: 'courses',      label: 'Courses',     icon: HiOutlineBookOpen },
  { tab: 'progress',     label: 'Analytics',   icon: HiOutlineChartBar },
  { tab: 'achievements', label: 'Achievements',icon: HiOutlineTrophy },
  { tab: 'settings',     label: 'Settings',    icon: HiOutlineCog },
]

export default function Sidebar({ activeTab, onTabChange }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/')
  }

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <MiniNova size={36} state="idle" />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Edunova
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1.5px', marginTop: 2 }}>
            AI LEARNING
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ tab, label, icon: Icon }, i) => {
          const isActive = activeTab === tab || (!activeTab && tab === 'overview')
          return (
            <motion.button
              key={tab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              onClick={() => { onTabChange(tab); navigate('/dashboard') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', cursor: 'pointer',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s', width: '100%', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' } }}
            >
              <Icon style={{ fontSize: 16, flexShrink: 0 }} />
              {label}
            </motion.button>
          )
        })}
      </nav>

      {/* Status + theme toggle */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, background: 'var(--accent-success)', borderRadius: '50%', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px' }}>online</span>
        </div>
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            padding: '4px 8px', cursor: 'pointer', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <HiOutlineSun size={13} /> : <HiOutlineMoon size={13} />}
        </button>
      </div>

      {/* User + logout */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, flexShrink: 0, background: 'linear-gradient(135deg, var(--accent), var(--accent-violet))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#fff' }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <HiOutlineSparkles style={{ color: 'var(--accent-warning)', fontSize: 10 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{user?.xp || 0} XP</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 13, transition: 'all 0.15s', width: '100%' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-danger)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
        >
          <HiOutlineLogout size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
