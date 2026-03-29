import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

/**
 * Nova — Humanoid AI assistant SVG
 * Props:
 *   size       — px size (default 200)
 *   state      — 'idle' | 'thinking' | 'active'
 *   assembly   — 0-1 float that controls draw-in (for scroll assembly)
 *   showGlow   — show ambient glow behind head
 *   className  — extra class names
 */
export default function Nova({ size = 200, state = 'idle', assembly = 1, showGlow = true, className = '', style = {} }) {
  const s = size
  const assembled = assembly >= 0.98

  // How much each element is visible based on assembly progress
  const a = (threshold) => Math.max(0, Math.min(1, (assembly - threshold) / (1 - threshold + 0.001)))

  const eyeAnim = state === 'thinking'
    ? { opacity: [0.4, 1, 0.4], transition: { duration: 0.5, repeat: Infinity } }
    : state === 'active'
    ? { opacity: 1, filter: 'blur(0px) brightness(1.4)' }
    : {}  // idle handled by CSS

  return (
    <div className={`nova-wrapper ${className}`} style={{ width: s, height: s * 1.1, position: 'relative', ...style }}>
      {/* Ambient glow behind */}
      {showGlow && (
        <motion.div
          animate={{ opacity: assembly > 0.5 ? [0.4, 0.7, 0.4] : 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '10%', left: '50%',
            transform: 'translateX(-50%)',
            width: s * 0.9,
            height: s * 0.9,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(61,142,240,0.18) 0%, rgba(124,58,237,0.1) 40%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <svg
        viewBox="0 0 160 176"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: s,
          height: s * 1.1,
          position: 'relative',
          zIndex: 1,
          filter: state === 'active' ? 'drop-shadow(0 0 12px rgba(61,142,240,0.5))' : 'none',
          transition: 'filter 0.3s',
        }}
      >
        <defs>
          <radialGradient id="headGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#1a2540"/>
            <stop offset="100%" stopColor="#0D1221"/>
          </radialGradient>
          <radialGradient id="eyeGradL" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3D8EF0" stopOpacity="1"/>
            <stop offset="60%" stopColor="#2563EB" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#1a2540" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="eyeGradR" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3D8EF0" stopOpacity="1"/>
            <stop offset="60%" stopColor="#2563EB" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#1a2540" stopOpacity="0"/>
          </radialGradient>
          <filter id="eyeBlur">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <clipPath id="headClip">
            <path d="M 32 58 Q 30 28 80 26 Q 130 28 128 58 L 128 118 Q 128 142 108 147 L 80 151 L 52 147 Q 32 142 32 118 Z"/>
          </clipPath>
        </defs>

        {/* ── Neck (assembles first) ── */}
        <motion.g animate={{ opacity: a(0) }} transition={{ duration: 0.3 }}>
          <rect x="67" y="152" width="26" height="20" rx="3" fill="#0D1221" stroke="rgba(61,142,240,0.3)" strokeWidth="1"/>
          <line x1="72" y1="159" x2="88" y2="159" stroke="rgba(61,142,240,0.25)" strokeWidth="0.8"/>
          <line x1="72" y1="164" x2="88" y2="164" stroke="rgba(61,142,240,0.25)" strokeWidth="0.8"/>
          {/* Collar ring */}
          <rect x="62" y="150" width="36" height="5" rx="2" fill="#0D1221" stroke="rgba(61,142,240,0.4)" strokeWidth="1"/>
        </motion.g>

        {/* ── Head shape ── */}
        <motion.path
          d="M 32 58 Q 30 28 80 26 Q 130 28 128 58 L 128 118 Q 128 142 108 147 L 80 151 L 52 147 Q 32 142 32 118 Z"
          fill="url(#headGrad)"
          stroke="rgba(61,142,240,0.55)"
          strokeWidth="1.2"
          animate={{ opacity: a(0.05) }}
          transition={{ duration: 0.4 }}
        />

        {/* ── Inner face plate (slightly lighter area) ── */}
        <motion.path
          d="M 44 65 Q 42 42 80 40 Q 118 42 116 65 L 116 116 Q 116 130 100 134 L 80 136 L 60 134 Q 44 130 44 116 Z"
          fill="rgba(30,42,70,0.45)"
          animate={{ opacity: a(0.1) }}
          transition={{ duration: 0.3 }}
        />

        {/* ── Forehead accent line ── */}
        <motion.g animate={{ opacity: a(0.15) }} transition={{ duration: 0.3 }}>
          <line x1="52" y1="50" x2="108" y2="50" stroke="rgba(61,142,240,0.5)" strokeWidth="0.8"/>
          <line x1="60" y1="46" x2="100" y2="46" stroke="rgba(61,142,240,0.25)" strokeWidth="0.5"/>
          {/* Center forehead dot */}
          <circle cx="80" cy="38" r="2" fill="rgba(61,142,240,0.6)"/>
          <circle cx="80" cy="38" r="4" fill="none" stroke="rgba(61,142,240,0.2)" strokeWidth="0.8"/>
        </motion.g>

        {/* ── Left ear/temple sensor ── */}
        <motion.g animate={{ opacity: a(0.2) }} transition={{ duration: 0.3 }}>
          <rect x="22" y="75" width="9" height="22" rx="2" fill="#0D1221" stroke="rgba(61,142,240,0.35)" strokeWidth="0.9"/>
          <rect x="24" y="80" width="5" height="5" rx="1" fill="rgba(61,142,240,0.7)"/>
          <rect x="24" y="88" width="5" height="3" rx="1" fill="rgba(61,142,240,0.3)"/>
          {/* Connection to head */}
          <line x1="31" y1="82" x2="32" y2="82" stroke="rgba(61,142,240,0.4)" strokeWidth="1"/>
        </motion.g>

        {/* ── Right ear/temple sensor ── */}
        <motion.g animate={{ opacity: a(0.2) }} transition={{ duration: 0.3 }}>
          <rect x="129" y="75" width="9" height="22" rx="2" fill="#0D1221" stroke="rgba(61,142,240,0.35)" strokeWidth="0.9"/>
          <rect x="131" y="80" width="5" height="5" rx="1" fill="rgba(61,142,240,0.7)"/>
          <rect x="131" y="88" width="5" height="3" rx="1" fill="rgba(61,142,240,0.3)"/>
          <line x1="128" y1="82" x2="129" y2="82" stroke="rgba(61,142,240,0.4)" strokeWidth="1"/>
        </motion.g>

        {/* ── Left eye ── */}
        <motion.g animate={{ opacity: a(0.35) }} transition={{ duration: 0.4 }}>
          {/* Eye socket */}
          <ellipse cx="60" cy="88" rx="17" ry="12" fill="rgba(8,11,20,0.9)" stroke="rgba(61,142,240,0.5)" strokeWidth="1.2"/>
          {/* Iris glow */}
          <motion.ellipse
            cx="60" cy="88" rx="11" ry="7.5"
            fill="url(#eyeGradL)"
            className="nova-eye-l"
            style={state === 'thinking' ? {} : {}}
          />
          {state === 'thinking' && (
            <motion.ellipse
              cx="60" cy="88" rx="11" ry="7.5"
              fill="url(#eyeGradL)"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.45, repeat: Infinity }}
            />
          )}
          {/* Pupil */}
          <ellipse cx="60" cy="88" rx="4.5" ry="3.2" fill="rgba(8,11,20,0.95)"/>
          {/* Specular highlight */}
          <ellipse cx="57.5" cy="86.5" rx="1.8" ry="1.2" fill="rgba(255,255,255,0.65)"/>
          {/* Eye rim glow */}
          <ellipse cx="60" cy="88" rx="17" ry="12" fill="none" stroke="rgba(61,142,240,0.2)" strokeWidth="2.5" filter="url(#eyeBlur)"/>
        </motion.g>

        {/* ── Right eye ── */}
        <motion.g animate={{ opacity: a(0.35) }} transition={{ duration: 0.4 }}>
          <ellipse cx="100" cy="88" rx="17" ry="12" fill="rgba(8,11,20,0.9)" stroke="rgba(61,142,240,0.5)" strokeWidth="1.2"/>
          <motion.ellipse
            cx="100" cy="88" rx="11" ry="7.5"
            fill="url(#eyeGradR)"
            className="nova-eye-r"
          />
          {state === 'thinking' && (
            <motion.ellipse
              cx="100" cy="88" rx="11" ry="7.5"
              fill="url(#eyeGradR)"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.45, repeat: Infinity, delay: 0.15 }}
            />
          )}
          <ellipse cx="100" cy="88" rx="4.5" ry="3.2" fill="rgba(8,11,20,0.95)"/>
          <ellipse cx="97.5" cy="86.5" rx="1.8" ry="1.2" fill="rgba(255,255,255,0.65)"/>
          <ellipse cx="100" cy="88" rx="17" ry="12" fill="none" stroke="rgba(61,142,240,0.2)" strokeWidth="2.5" filter="url(#eyeBlur)"/>
        </motion.g>

        {/* ── Nose bridge (subtle) ── */}
        <motion.g animate={{ opacity: a(0.45) }} transition={{ duration: 0.3 }}>
          <line x1="80" y1="100" x2="80" y2="109" stroke="rgba(61,142,240,0.15)" strokeWidth="0.6"/>
          <ellipse cx="75" cy="109" rx="4" ry="2" fill="none" stroke="rgba(61,142,240,0.12)" strokeWidth="0.8"/>
          <ellipse cx="85" cy="109" rx="4" ry="2" fill="none" stroke="rgba(61,142,240,0.12)" strokeWidth="0.8"/>
        </motion.g>

        {/* ── Lower face / chin detail ── */}
        <motion.g animate={{ opacity: a(0.5) }} transition={{ duration: 0.3 }}>
          <line x1="62" y1="122" x2="98" y2="122" stroke="rgba(61,142,240,0.18)" strokeWidth="0.7"/>
          <line x1="68" y1="126" x2="92" y2="126" stroke="rgba(61,142,240,0.1)" strokeWidth="0.6"/>
          {/* Status light on chin */}
          <circle cx="80" cy="140" r="2.5" fill="rgba(16,185,129,0.8)"/>
          <circle cx="80" cy="140" r="4" fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="0.8"/>
        </motion.g>

        {/* ── Thinking scan line ── */}
        {state === 'thinking' && (
          <motion.line
            x1="44" y1="88" x2="44" y2="88"
            stroke="rgba(61,142,240,0.6)" strokeWidth="1"
            animate={{ x1: [44, 116, 44], x2: [116, 44, 116] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            clipPath="url(#headClip)"
          />
        )}

        {/* ── Edge highlight (rim light effect) ── */}
        <motion.path
          d="M 32 58 Q 30 28 80 26 Q 130 28 128 58 L 128 118 Q 128 142 108 147 L 80 151 L 52 147 Q 32 142 32 118 Z"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          animate={{ opacity: a(0.05) }}
          transition={{ duration: 0.3 }}
        />
      </svg>
    </div>
  )
}

/**
 * ScrollAssemblyNova — Nova that assembles as user scrolls down on landing page
 */
export function ScrollAssemblyNova({ containerRef, size = 260 }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  })

  const assembly = useSpring(scrollYProgress, { stiffness: 80, damping: 20 })
  const opacity  = useTransform(assembly, [0, 0.15], [0, 1])
  const scale    = useTransform(assembly, [0, 0.2], [0.85, 1])
  const y        = useTransform(assembly, [0, 1], [30, 0])

  return (
    <motion.div style={{ opacity, scale, y }} className="nova-float">
      <Nova size={size} state="idle" assembly={1} showGlow />
    </motion.div>
  )
}

/**
 * MiniNova — small version for sidebar / headers
 */
export function MiniNova({ size = 40, state = 'idle' }) {
  return <Nova size={size} state={state} assembly={1} showGlow={false} />
}
