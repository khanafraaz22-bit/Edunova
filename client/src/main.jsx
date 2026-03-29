import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

// Apply saved theme immediately before React renders (prevents flash)
const savedTheme = localStorage.getItem('edunova-theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: 'var(--accent-success)', secondary: 'var(--bg-base)' } },
          error:   { iconTheme: { primary: 'var(--accent-danger)',  secondary: 'var(--bg-base)' } },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
