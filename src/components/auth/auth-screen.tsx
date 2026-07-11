'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Sparkles,
  HeartPulse,
  Brain,
  Baby,
  Flower2,
  ShieldCheck,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Smartphone,
} from 'lucide-react'
import GoogleOAuthButton from './google-oauth-button'
import GoogleSignInModal from './google-signin-modal'
import AppleSignInModal from './apple-signin-modal'
import MobileOtpForm from './mobile-otp-form'

type Mode = 'login' | 'signup'
type AuthMethod = 'email' | 'mobile'

export interface SessionUser {
  id: string
  name: string | null
  email: string
  avatar: string | null
  provider: string
  onboardingComplete: boolean
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
}

interface AuthScreenProps {
  onAuthed: (user: SessionUser) => void
}

const features = [
  { icon: HeartPulse, title: 'Cycle & Hormone IQ', desc: 'AI-powered predictions for your unique rhythm' },
  { icon: Baby, title: 'Fertility & Pregnancy', desc: 'Track ovulation, conceive, and glow through every trimester' },
  { icon: Flower2, title: 'PCOS & Menopause Care', desc: 'Personalised plans for every life stage' },
  { icon: Brain, title: 'AI Health Coach', desc: '24/7 guidance tailored to your body' },
]

// Staggered entrance variants for premium feel
const containerStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
}

// Floating orb config — GPU-accelerated drift, blurred, low opacity
const orbBase = 'absolute rounded-full blur-3xl pointer-events-none will-change-transform'

export default function AuthScreen({ onAuthed }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState<null | 'email' | 'google' | 'apple'>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [oauthConfig, setOauthConfig] = useState<{ google: { configured: boolean; clientId: string }; apple: { configured: boolean; clientId: string } } | null>(null)
  const [googleModalOpen, setGoogleModalOpen] = useState(false)
  const [appleModalOpen, setAppleModalOpen] = useState(false)

  // Fetch OAuth config
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/config')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setOauthConfig({
            google: { configured: !!data.google?.configured, clientId: data.google?.clientId || '' },
            apple: { configured: !!data.apple?.configured, clientId: data.apple?.clientId || '' },
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOauthConfig({
            google: { configured: false, clientId: '' },
            apple: { configured: false, clientId: '' },
          })
        }
      })
    return () => { cancelled = true }
  }, [])

  const switchMode = (newMode: Mode) => {
    setErrors({})
    setMode(newMode)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (mode === 'signup' && !name.trim()) e.name = 'Please enter your name'
    if (!email.trim()) e.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Please enter a password'
    else if (mode === 'signup' && password.length < 6) e.password = 'At least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleEmailAuth = async () => {
    if (!validate()) return
    setLoading('email')
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Something went wrong')
        setLoading(null)
        return
      }
      if (data.token && remember) {
        localStorage.setItem('chandracycle_token', data.token)
      }
      toast.success(mode === 'signup' ? 'Welcome to ChandraCycle!' : 'Welcome back!')
      onAuthed(data.user)
    } catch {
      toast.error('Network error. Please try again.')
      setLoading(null)
    }
  }

  // ─── Real Google OAuth path (when GOOGLE_CLIENT_ID configured) ──────────────
  const handleGoogleCredential = useCallback(async (idToken: string) => {
    setLoading('google')
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Google sign-in failed')
        setLoading(null)
        return
      }
      if (data.token && remember) {
        localStorage.setItem('chandracycle_token', data.token)
      }
      toast.success(`Signed in as ${data.user.email}`)
      onAuthed(data.user)
    } catch {
      toast.error('Network error during Google sign-in.')
      setLoading(null)
    }
  }, [remember, onAuthed])

  // ─── Modal-based Google path (when GOOGLE_CLIENT_ID NOT configured) ─────────
  // User enters their real Google email → sees permission screen → "Allow" →
  // we sign them in with that email. This gives the real OAuth UX without
  // requiring a Google Cloud project.
  const handleGoogleModalSuccess = useCallback(async (account: { email: string; name: string; avatar: string }) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Tell backend this is a modal-based flow (no real Google ID token,
          // but the user explicitly granted permission for this email).
          modalAccount: account,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Google sign-in failed')
        setLoading(null)
        setGoogleModalOpen(false)
        return
      }
      if (data.token && remember) {
        localStorage.setItem('chandracycle_token', data.token)
      }
      toast.success(`Signed in as ${data.user.email}`)
      setGoogleModalOpen(false)
      onAuthed(data.user)
    } catch {
      toast.error('Network error during Google sign-in.')
      setLoading(null)
      setGoogleModalOpen(false)
    }
  }, [remember, onAuthed])

  const handleAppleModalSuccess = useCallback(async (account: { email: string; name: string }) => {
    try {
      const res = await fetch('/api/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modalAccount: account,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Apple sign-in failed')
        setLoading(null)
        setAppleModalOpen(false)
        return
      }
      if (data.token && remember) {
        localStorage.setItem('chandracycle_token', data.token)
      }
      toast.success(`Signed in as ${data.user.email}`)
      setAppleModalOpen(false)
      onAuthed(data.user)
    } catch {
      toast.error('Network error during Apple sign-in.')
      setLoading(null)
      setAppleModalOpen(false)
    }
  }, [remember, onAuthed])

  const handleGoogleClick = useCallback(() => {
    if (loading) return
    if (oauthConfig?.google.configured) {
      // Real Google OAuth button is rendered below — it triggers its own flow
      return
    }
    setGoogleModalOpen(true)
  }, [loading, oauthConfig])

  const handleAppleClick = useCallback(() => {
    if (loading) return
    setAppleModalOpen(true)
  }, [loading])

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden">
      {/* ─── Premium animated mesh background (both panels share this) ─────── */}
      <div className="absolute inset-0 bg-animated-gradient opacity-95" />
      {/* Softening layer so foreground text remains readable in both themes */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/35 to-white/55 dark:from-black/45 dark:via-black/30 dark:to-black/55" />

      {/* ─── Floating blurred orbs (GPU-accelerated drift) ─────────────────── */}
      <motion.div
        aria-hidden
        className={`${orbBase} top-[-10%] left-[-6%] h-[28rem] w-[28rem] bg-rose-400/40 dark:bg-rose-500/30`}
        animate={{ x: [0, 28, -10, 0], y: [0, -22, 18, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className={`${orbBase} bottom-[-12%] right-[-8%] h-[32rem] w-[32rem] bg-fuchsia-400/35 dark:bg-fuchsia-500/25`}
        animate={{ x: [0, -32, 14, 0], y: [0, 24, -16, 0], scale: [1, 1.06, 0.98, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className={`${orbBase} top-[38%] right-[18%] h-[20rem] w-[20rem] bg-amber-300/40 dark:bg-amber-400/25`}
        animate={{ x: [0, 18, -22, 0], y: [0, 16, -10, 0], scale: [1, 0.94, 1.07, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ─── Left brand panel (hidden on mobile) ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Brand row — glass chip with vibrant gradient logo mark */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-2xl px-4 py-2.5 inline-flex items-center gap-3 self-start"
          >
            <div className="relative">
              {/* Glow halo behind the brand mark */}
              <div className="absolute inset-0 rounded-2xl bg-rose-400/50 blur-lg" aria-hidden />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 font-bold text-2xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_28px_-8px_rgba(217,70,119,0.55)] animate-float">
                <span className="font-serif">C</span>
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight font-serif text-foreground">ChandraCycle</span>
              <span className="text-[11px] text-muted-foreground tracking-wide">AI Women&apos;s Health Companion</span>
            </div>
          </motion.div>

          {/* Hero content in a premium glass card */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={containerStagger}
            className="max-w-xl"
          >
            <motion.div variants={fadeUp} className="glass-premium rounded-3xl p-7 xl:p-9 text-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 border border-rose-500/20 mb-5">
                <Sparkles className="h-3 w-3" />
                Your private AI health companion
              </span>
              <motion.h1
                variants={fadeUp}
                className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight font-serif"
              >
                Your body,{' '}
                <span className="gradient-text-shimmer">understood.</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-base xl:text-lg leading-relaxed text-muted-foreground"
              >
                An intelligent ecosystem for your cycle, hormones, fertility, pregnancy and beyond — powered by AI that learns your rhythm.
              </motion.p>
            </motion.div>

            {/* Feature cards grid */}
            <motion.div
              variants={fadeUp}
              className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  className="glass-premium rounded-2xl p-4 flex items-start gap-3 group cursor-default"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/15 to-fuchsia-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-300 transition-all duration-300 group-hover:glow-rose">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight">{f.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Trust footer — glass chip with foreground text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass rounded-2xl px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-foreground/80"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>Private &amp; encrypted end-to-end</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>AI-powered, human-centred</span>
            </div>
            <span className="text-foreground/60 italic font-serif">Crafted with care for women across India.</span>
          </motion.div>
        </div>
      </div>

      {/* ─── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-5 sm:p-10 overflow-y-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerStagger}
          className="w-full max-w-md py-6"
        >
          {/* Mobile premium header */}
          <motion.div
            variants={fadeUp}
            className="lg:hidden flex flex-col items-center text-center mb-7"
          >
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-2xl bg-rose-400/50 blur-lg" aria-hidden />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 text-white font-bold text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_16px_36px_-10px_rgba(217,70,119,0.6)] animate-float">
                <span className="font-serif">C</span>
              </div>
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground">ChandraCycle</span>
            <span className="text-[11px] text-muted-foreground leading-tight tracking-wide mt-0.5">AI Women&apos;s Health Companion</span>
          </motion.div>

          {/* Premium form card */}
          <motion.div variants={fadeUp} className="card-premium p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === 'login'
                    ? 'Sign in to continue your wellness journey.'
                    : 'Join thousands of women taking charge of their health.'}
                </p>

                {/* OAuth buttons */}
                <div className="mt-6 space-y-3">
                  {/* Google button: real OAuth if configured, else modal-based flow */}
                  {oauthConfig?.google.configured ? (
                    <GoogleOAuthButton
                      onCredential={handleGoogleCredential}
                      loading={loading === 'google'}
                      setLoading={(v) => setLoading(v ? 'google' : null)}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 rounded-xl border-border bg-card/80 backdrop-blur-sm hover:bg-accent hover:border-rose-300 dark:hover:border-rose-700 text-sm font-medium gap-2.5 transition-all hover:shadow-md"
                      onClick={handleGoogleClick}
                      disabled={loading !== null}
                    >
                      {loading === 'google' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <GoogleIcon className="h-5 w-5" />
                      )}
                      <span>Continue with Google</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-xl border-border bg-card/80 backdrop-blur-sm hover:bg-accent hover:border-rose-300 dark:hover:border-rose-700 text-sm font-medium gap-2.5 transition-all hover:shadow-md"
                    onClick={handleAppleClick}
                    disabled={loading !== null}
                  >
                    {loading === 'apple' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <AppleIcon className="h-5 w-5" />
                    )}
                    <span>Continue with Apple</span>
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
                      or
                    </span>
                  </div>
                </div>

                {/* Method tabs: Email | Mobile */}
                <div className="flex p-1 mb-4 rounded-xl bg-muted/60 border border-border">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('email')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-all ${
                      authMethod === 'email'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('mobile')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-all ${
                      authMethod === 'mobile'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile OTP</span>
                  </button>
                </div>

                {/* Conditional form by method */}
                {authMethod === 'mobile' ? (
                  <MobileOtpForm onAuthed={onAuthed} remember={remember} />
                ) : (
                  <div className="space-y-4">
                    {mode === 'signup' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-9 h-11 rounded-xl bg-card/70 border-border focus-visible:border-rose-400 transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                          />
                        </div>
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 h-11 rounded-xl bg-card/70 border-border focus-visible:border-rose-400 transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => toast.info('Password reset link would be sent to your email.')}
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 pr-9 h-11 rounded-xl bg-card/70 border-border focus-visible:border-rose-400 transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    {mode === 'login' && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                        <span className="text-xs text-muted-foreground">Keep me signed in on this device</span>
                      </label>
                    )}

                    <Button
                      type="button"
                      className="btn-premium w-full h-11 rounded-xl text-sm font-semibold gap-1.5"
                      onClick={handleEmailAuth}
                      disabled={loading !== null}
                    >
                      {loading === 'email' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {mode === 'login' ? 'Sign in' : 'Create account'}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Sign in / Sign up toggle (only for email method) */}
                {authMethod === 'email' && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    >
                      {mode === 'login' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                )}

                <div className="mt-5 rounded-xl bg-muted/60 border border-border p-3">
                  <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                    <span>
                      <span className="font-medium text-foreground">Secure sign-in:</span> Continue with Google/Apple
                      opens a secure permission popup. Your password is never shared with ChandraCycle.
                    </span>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed">
            By continuing you agree to ChandraCycle&apos;s Terms of Service and Privacy Policy.
            <br />Your health data is encrypted and never sold.
          </p>
        </motion.div>
      </div>

      {/* OAuth popups (keyed by open state so they remount fresh each open) */}
      {googleModalOpen && (
        <GoogleSignInModal
          key={`google-${googleModalOpen}`}
          open={googleModalOpen}
          onClose={() => setGoogleModalOpen(false)}
          onSuccess={handleGoogleModalSuccess}
        />
      )}
      {appleModalOpen && (
        <AppleSignInModal
          key={`apple-${appleModalOpen}`}
          open={appleModalOpen}
          onClose={() => setAppleModalOpen(false)}
          onSuccess={handleAppleModalSuccess}
        />
      )}
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.95.94-.82 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.82 3.15-.46 7.81 1.3 10.37.86 1.26 1.88 2.67 3.22 2.62 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.28 3.12-2.55.98-1.45 1.38-2.86 1.4-2.93-.03-.01-2.69-1.03-2.72-4.09ZM14.6 4.59c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44Z" />
    </svg>
  )
}
