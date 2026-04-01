import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  email: string
  name: string
  role: 'analyst' | 'observer'
  organisation: string
  token: string
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'nautilus-auth' }
  )
)
