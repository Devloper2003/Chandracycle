import { create } from 'zustand'

export type ActiveModule =
  | 'dashboard'
  | 'period'
  | 'hormone'
  | 'symptoms'
  | 'pcos'
  | 'fertility'
  | 'pregnancy'
  | 'menopause'
  | 'coach'
  | 'diet'
  | 'doctors'
  | 'mental'
  | 'fitness'
  | 'beauty'
  | 'community'
  | 'reports'
  | 'marketplace'
  | 'ai-insights'
  | 'premium'
  | 'settings'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
  provider?: 'email' | 'google' | 'apple'
}

/**
 * Modules that require an active ChandraCycle Premium subscription.
 * Used by the mobile bottom-nav (and any future paywall logic) to decide
 * whether to show the upgrade sheet when a free user taps a premium feature.
 * 'premium' itself is the upgrade page — always accessible.
 */
export const PREMIUM_MODULES: ActiveModule[] = [
  'coach',
  'diet',
  'ai-insights',
  'mental',
  'fitness',
  'beauty',
  'marketplace',
]

interface AppState {
  activeModule: ActiveModule
  setActiveModule: (module: ActiveModule) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile | null) => void
  isOnboarded: boolean
  setOnboarded: (done: boolean) => void
  isPremium: boolean
  setPremium: (premium: boolean) => void
  hasPremium: () => boolean
  openPaywall: (attemptedModule?: ActiveModule) => void
  isAuthenticated: boolean
  setAuthenticated: (authed: boolean) => void
}

// Helper to get today's date in YYYY-MM-DD format (client-safe)
const todayISO = () => {
  if (typeof window === 'undefined') return ''
  return new Date().toISOString().split('T')[0]
}

// HMR-safe store creation: cache on globalThis so HMR doesn't break the module
// factory reference (fixes "module factory is not available" Turbopack error).
function createStore() {
  return create<AppState>((set, get) => ({
    activeModule: 'dashboard',
    setActiveModule: (module) => set({ activeModule: module }),
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    selectedDate: todayISO(),
    setSelectedDate: (date) => set({ selectedDate: date }),
    userProfile: null,
    setUserProfile: (profile) => set({ userProfile: profile }),
    isOnboarded: true,
    setOnboarded: (done) => set({ isOnboarded: done }),
    isPremium: false,
    setPremium: (premium) => set({ isPremium: premium }),
    hasPremium: () => get().isPremium,
    openPaywall: (_attemptedModule?: ActiveModule) => {
      // Route the user to the upgrade page. The attempted module is accepted
      // for future analytics but currently we just open the premium page.
      set({ activeModule: 'premium' })
    },
    isAuthenticated: false,
    setAuthenticated: (authed) => set({ isAuthenticated: authed }),
  }))
}

const globalForStore = globalThis as Record<string, unknown>
export const useAppStore =
  (globalForStore.__CHANDRACYCLE_STORE__ as ReturnType<typeof createStore> | undefined) ?? createStore()
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__CHANDRACYCLE_STORE__ = useAppStore
}
