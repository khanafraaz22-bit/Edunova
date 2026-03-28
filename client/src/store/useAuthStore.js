import { create } from 'zustand'
import { getMe, login as apiLogin, signup as apiSignup, logout as apiLogout } from '../api'

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    try {
      const res = await getMe()
      set({ user: res.data.user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const res = await apiLogin({ email, password })
    set({ user: res.data.user })
    return res.data.user
  },

  signup: async (name, email, password) => {
    const res = await apiSignup({ name, email, password })
    set({ user: res.data.user })
    return res.data.user
  },

  logout: async () => {
    await apiLogout()
    set({ user: null })
  },

  setUser: (user) => set({ user }),
  refreshUser: async () => {
    try {
      const res = await getMe()
      set({ user: res.data.user })
    } catch { /* ignore */ }
  },
}))

export default useAuthStore
