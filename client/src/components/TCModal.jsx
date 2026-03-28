import { motion, AnimatePresence } from 'framer-motion'

export default function TCModal({ isOpen, onAccept }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              background: '#080820',
              border: '1px solid rgba(0,245,255,0.2)',
              borderRadius: 16,
              padding: '40px',
              maxWidth: 560,
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40,
                background: 'linear-gradient(135deg, #00f5ff20, #9b5de520)',
                border: '1px solid rgba(0,245,255,0.3)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>📋</div>
              <div>
                <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 18, color: '#e8eaf6', margin: 0 }}>
                  Terms & Conditions
                </h2>
                <p style={{ color: '#7c83a0', fontSize: 13, margin: 0 }}>Please read and accept to continue</p>
              </div>
            </div>

            <div style={{
              flex: 1, overflowY: 'auto', marginBottom: 24,
              padding: '20px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, fontSize: 14, lineHeight: 1.8,
              color: '#7c83a0',
            }}>
              <h3 style={{ color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 13, marginBottom: 12 }}>
                1. ACCEPTANCE OF TERMS
              </h3>
              <p style={{ marginBottom: 12 }}>
                By accessing EduNova, you agree to be bound by these Terms and Conditions. EduNova is an AI-powered
                educational platform designed to enhance your learning experience.
              </p>
              <h3 style={{ color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 13, marginBottom: 12, marginTop: 16 }}>
                2. USE OF AI FEATURES
              </h3>
              <p style={{ marginBottom: 12 }}>
                AI-generated content is provided for educational purposes only. While we strive for accuracy,
                AI responses may contain errors. Always verify critical information from authoritative sources.
              </p>
              <h3 style={{ color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 13, marginBottom: 12, marginTop: 16 }}>
                3. USER DATA & PRIVACY
              </h3>
              <p style={{ marginBottom: 12 }}>
                Your learning data (progress, quiz scores, chat history) is stored securely. We do not share
                personal information with third parties. Course data from YouTube is processed to enhance your
                learning experience.
              </p>
              <h3 style={{ color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 13, marginBottom: 12, marginTop: 16 }}>
                4. INTELLECTUAL PROPERTY
              </h3>
              <p style={{ marginBottom: 12 }}>
                EduNova is developed and maintained by students at Bennett University. All platform features,
                designs, and AI integrations are original work created for educational purposes.
              </p>
              <h3 style={{ color: '#00f5ff', fontFamily: 'Orbitron, sans-serif', fontSize: 13, marginBottom: 12, marginTop: 16 }}>
                5. RESPONSIBLE USE
              </h3>
              <p>
                You agree to use EduNova for lawful educational purposes only. You must not attempt to
                misuse the AI systems, circumvent authentication, or access other users' data.
              </p>
            </div>

            <button className="btn-primary" onClick={onAccept} style={{ width: '100%', justifyContent: 'center' }}>
              ✓ &nbsp; I Accept the Terms & Conditions
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
