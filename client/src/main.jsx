import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0d0d2b',
            color: '#e8eaf6',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00f5ff', secondary: '#02020e' } },
          error:   { iconTheme: { primary: '#f72585', secondary: '#02020e' } },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
