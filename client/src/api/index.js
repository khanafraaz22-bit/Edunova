import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 120000, // 2 min for AI operations
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Don't toast here — let components handle it
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────
export const signup          = (data)           => api.post('/auth/signup', data)
export const login           = (data)           => api.post('/auth/login', data)
export const logout          = ()               => api.post('/auth/logout')
export const getMe           = ()               => api.get('/auth/me')
export const forgotPassword  = (email)          => api.post('/auth/forgot-password', { email })
export const resetPassword   = (data)           => api.post('/auth/reset-password', data)
export const updateProfile   = (data)           => api.put('/auth/profile', data)

// ── Courses ───────────────────────────────────────────────
export const analyzeCourse   = (playlistUrl)    => api.post('/courses/analyze', { playlistUrl })
export const getCourses      = ()               => api.get('/courses')
export const getCourse       = (id)             => api.get(`/courses/${id}`)
export const deleteCourse    = (id)             => api.delete(`/courses/${id}`)

// ── AI Features ───────────────────────────────────────────
export const summarizeVideo  = (courseId, videoId)             => api.post('/ai/summarize', { courseId, videoId })
export const teachTopic      = (courseId, topic, followUp)     => api.post('/ai/teach', { courseId, topic, followUp })
export const findTopic       = (courseId, query)               => api.post('/ai/find-topic', { courseId, query })
export const generateMindMap = (courseId)                      => api.post('/ai/mindmap', { courseId })
export const generateExam    = (courseId, topics, questionCount) => api.post('/ai/exam', { courseId, topics, questionCount })
export const submitExam      = (courseId, questions, answers, score) => api.post('/ai/exam/submit', { courseId, questions, answers, score })
export const analyzeGaps     = (courseId)                      => api.post('/ai/gap-analysis', { courseId })

// ── Chat ──────────────────────────────────────────────────
export const getChat         = (courseId)       => api.get(`/chat/${courseId}`)
export const sendMessage     = (courseId, message) => api.post('/chat/send', { courseId, message })

// ── Progress ──────────────────────────────────────────────
export const updateProgress  = (videoId, status) => api.post('/progress/update', { videoId, status })
export const getStats        = ()               => api.get('/progress/stats')
