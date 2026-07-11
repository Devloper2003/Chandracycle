'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import AuthScreen, { type SessionUser } from '@/components/auth/auth-screen'
import { useAppStore } from '@/lib/store'

// AppShell (sidebar + 20 modules) only loads AFTER authentication + onboarding.
// This keeps the initial page bundle tiny and prevents memory exhaustion
// during the first compile.
const AppShell = dynamic(() => import('@/components/app-shell'), {
  loading: () => <AppLoader />,
})

// Onboarding is also lazy-loaded so it doesn't bloat the auth-screen bundle.
const OnboardingLazy = dynamic(() => import('@/components/modules/onboarding'), {
  loading: () => <AppLoader />,
})

// Hydration-safe hook using useSyncExternalStore (recommended by React 19)
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// Static, hydration-safe loading screen. Rendered identically on server
// and client (no time/random/locale dependencies) so React never complains
// about a hydration mismatch.
function AppLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">
        C
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading ChandraCycle…</span>
      </div>
    </div>
  )
}

export default function Home() {
  const mounted = useMounted()
  const [authUser, setAuthUser] = useState<SessionUser | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  // Check existing session on mount
  useEffect(() => {
    let cancelled = false
    async function checkSession() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('chandracycle_token') : null
      if (!token) {
        if (!cancelled) setAuthChecking(false)
        return
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!cancelled) {
          if (data.user) {
            setAuthUser(data.user)
          } else {
            localStorage.removeItem('chandracycle_token')
          }
          setAuthChecking(false)
        }
      } catch {
        if (!cancelled) setAuthChecking(false)
      }
    }
    checkSession()
    return () => { cancelled = true }
  }, [])

  const handleAuthed = useCallback((user: SessionUser) => {
    setAuthUser(user)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    localStorage.removeItem('chandracycle_token')
    setAuthUser(null)
    setActiveModule('dashboard')
    toast.success('Signed out successfully')
  }, [setActiveModule])

  // Called when onboarding finishes — re-fetch the user so the profile
  // (lastPeriodStart, onboardingComplete) is fresh, then show the app.
  const handleOnboardingComplete = useCallback(async () => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('chandracycle_token')
      : null
    try {
      const res = await fetch('/api/auth/me', {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.user) {
        setAuthUser(data.user)
      } else {
        // Fallback: just flip the flag locally so the user isn't stuck.
        setAuthUser((prev) => prev ? { ...prev, onboardingComplete: true } : prev)
      }
    } catch {
      setAuthUser((prev) => prev ? { ...prev, onboardingComplete: true } : prev)
    }
    toast.success('Welcome to ChandraCycle! 🌸')
  }, [])

  // Loading screen (prevents hydration mismatch).
  // NOTE: We render the EXACT same JSX on server and client during the
  // loading state so hydration matches byte-for-byte. The brand mark "C"
  // and the text "Loading ChandraCycle…" are static literals — no
  // Date.now(), no Math.random(), no locale-dependent formatting.
  if (!mounted || authChecking) {
    return <AppLoader />
  }

  // Auth gate
  if (!authUser) {
    return <AuthScreen onAuthed={handleAuthed} />
  }

  // Onboarding gate — show the simplified 3-step onboarding for users who
  // haven't completed it yet (new signups, mobile OTP users, etc.).
  if (!authUser.onboardingComplete) {
    return <OnboardingLazy onComplete={handleOnboardingComplete} />
  }

  // Authenticated app (lazy-loaded)
  return <AppShell user={authUser} onLogout={handleLogout} />
}
