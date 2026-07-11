'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Check, Shield, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface GoogleAccount {
  email: string
  name: string
  avatar: string
}

interface GoogleSignInModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (account: GoogleAccount) => void
}

type Step = 'choose' | 'new-account' | 'consent' | 'loading'

const STORAGE_KEY = 'chandracycle_known_google_accounts'

// Persist a Google account in localStorage so the chooser can show it next
// time — exactly like real Google account chooser remembers browsers.
function rememberAccount(account: GoogleAccount) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: GoogleAccount[] = raw ? JSON.parse(raw) : []
    const filtered = list.filter((a) => a.email !== account.email)
    filtered.unshift(account)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 8)))
  } catch {
    /* ignore */
  }
}

function getRememberedAccounts(): GoogleAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function GoogleSignInModal({ open, onClose, onSuccess }: GoogleSignInModalProps) {
  // Key trick: when `open` toggles to true, the modal is remounted via key prop
  // from parent, so initial state is always fresh. We don't need to reset state
  // in an effect (which would trigger cascading renders).
  const [step, setStep] = useState<Step>('choose')
  const [accounts, setAccounts] = useState<GoogleAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  // Fetch existing accounts from DB + merge with localStorage-known accounts
  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    const remembered = getRememberedAccounts()

    try {
      const res = await fetch('/api/auth/accounts')
      const data = await res.json()
      const dbAccounts: GoogleAccount[] = data.accounts || []

      // Merge: DB accounts first, then any localStorage accounts not already in DB
      const seen = new Set<string>()
      const merged: GoogleAccount[] = []
      for (const a of dbAccounts) {
        const key = a.email.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          merged.push(a)
        }
      }
      for (const a of remembered) {
        const key = a.email.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          merged.push(a)
        }
      }
      setAccounts(merged)
    } catch {
      // Fallback: just use localStorage accounts
      setAccounts(remembered)
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadAccounts()
  }, [open, loadAccounts])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // Escape key closes
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'loading') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  // Click on an existing account → go straight to consent
  const handleSelectAccount = (account: GoogleAccount) => {
    setSelectedAccount(account)
    setEmail(account.email)
    setName(account.name)
    setStep('consent')
  }

  const handleEmailSubmit = () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Enter your Google email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setStep('consent')
  }

  const handleAllow = () => {
    setStep('loading')
    // Simulate Google's token exchange + permission grant
    setTimeout(() => {
      const accountName = name.trim() || trimmedNameFromEmail(email)
      const account: GoogleAccount = {
        email: email.trim().toLowerCase(),
        name: accountName,
        avatar:
          selectedAccount?.avatar ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(accountName)}&backgroundColor=fef3c7,fce7f3,e0e7ff,d1fae5`,
      }
      // Remember this account for next time (real Google chooser behavior)
      rememberAccount(account)
      onSuccess(account)
    }, 900)
  }

  const handleUseAnother = () => {
    setSelectedAccount(null)
    setEmail('')
    setName('')
    setError('')
    setStep('new-account')
  }

  const handleBack = () => {
    if (step === 'new-account') setStep('choose')
    else if (step === 'consent') {
      if (selectedAccount || accounts.length > 0) setStep('choose')
      else setStep('new-account')
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => step !== 'loading' && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-modal-title"
        >
          {/* Google-style header bar */}
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GoogleLogo className="h-6 w-6" />
              <span className="text-sm text-gray-600 font-medium">Sign in with Google</span>
            </div>
            {step !== 'loading' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ─── Step 1: Choose an account ─────────────────────────────────── */}
          {step === 'choose' && (
            <div className="px-6 pb-6">
              <h2 id="google-modal-title" className="text-[24px] leading-tight font-normal text-gray-900 mt-2">
                Choose an account
              </h2>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                to continue to <span className="text-gray-900 font-medium">ChandraCycle</span>
              </p>

              {/* Account list */}
              <div className="space-y-1 max-h-[280px] overflow-y-auto -mx-2 px-2">
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading your accounts…</span>
                  </div>
                ) : accounts.length === 0 ? (
                  <button
                    onClick={handleUseAnother}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-dashed border-gray-200"
                  >
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Use another account</p>
                      <p className="text-xs text-gray-500">Sign in with a Google email</p>
                    </div>
                  </button>
                ) : (
                  <>
                    {accounts.map((account) => (
                      <button
                        key={account.email}
                        onClick={() => handleSelectAccount(account)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                      >
                        <Avatar src={account.avatar} name={account.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                          <p className="text-xs text-gray-500 truncate">{account.email}</p>
                        </div>
                      </button>
                    ))}

                    {/* Use another account */}
                    <button
                      onClick={handleUseAnother}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border-t border-gray-100 mt-2 pt-3"
                    >
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M19 8v6M22 11h-6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Use another account</p>
                      </div>
                    </button>
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  To continue, Google will share your name, email address, language preference, and
                  profile picture with ChandraCycle. Before using this app, review its{' '}
                  <span className="text-blue-600 cursor-pointer hover:underline">privacy policy</span>{' '}
                  and{' '}
                  <span className="text-blue-600 cursor-pointer hover:underline">terms of service</span>.
                </p>
              </div>
            </div>
          )}

          {/* ─── Step 2: New account email entry ───────────────────────────── */}
          {step === 'new-account' && (
            <div className="px-6 pb-6">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm mb-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
              <h2 className="text-[24px] leading-tight font-normal text-gray-900 mt-2">Sign in</h2>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                to continue to <span className="text-gray-900 font-medium">ChandraCycle</span>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email or phone
                  </label>
                  <Input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    placeholder="your.email@gmail.com"
                    className="h-11 rounded-md border-gray-300 focus-visible:ring-blue-500"
                  />
                  {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full name (optional)
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    placeholder="Your name"
                    className="h-11 rounded-md border-gray-300 focus-visible:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => toast.info('For this demo, enter your Google email directly.')}
                >
                  Forgot email?
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2"
                  onClick={() => setStep('choose')}
                >
                  Create account
                </button>
                <Button
                  type="button"
                  onClick={handleEmailSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 h-10"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Permission consent ────────────────────────────────── */}
          {step === 'consent' && (
            <div className="px-6 pb-6">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm mb-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              {/* App info */}
              <div className="flex items-start gap-3 mt-2 mb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-xl">
                  A
                </div>
                <div className="flex-1 pt-1">
                  <h2 className="text-[20px] leading-tight font-normal text-gray-900">
                    ChandraCycle wants to access your Google Account
                  </h2>
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
                    <span className="font-medium text-gray-800">
                      {email.trim().toLowerCase()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Permission list */}
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                <PermissionRow
                  icon="user"
                  title="Personal info"
                  desc="Name, email address, language, and profile picture"
                />
                <PermissionRow
                  icon="mail"
                  title="Email"
                  desc={`Your primary email address (${email.trim().toLowerCase()})`}
                />
                <PermissionRow
                  icon="shield"
                  title="Secure sign-in"
                  desc="ChandraCycle will receive a verified token — never your password"
                />
              </div>

              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                By allowing access, you agree to share the above information with ChandraCycle. You can
                revoke access anytime in your Google Account settings.
              </p>

              {/* Action buttons */}
              <div className="mt-6 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAllow}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6"
                >
                  Allow
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Loading ────────────────────────────────────────────── */}
          {step === 'loading' && (
            <div className="px-6 py-16 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-700">Signing you in to ChandraCycle…</p>
            </div>
          )}

          {/* Footer (Google-style) */}
          {step !== 'loading' && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <select
                className="bg-transparent border-0 outline-none cursor-pointer"
                defaultValue="en"
                aria-label="Language"
              >
                <option value="en">English (United States)</option>
                <option value="hi">हिन्दी</option>
                <option value="es">Español</option>
              </select>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                <span>Privacy</span>
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Avatar component (handles image load failure) ──────────────────────────
function Avatar({ src, name }: { src: string; name: string }) {
  const [error, setError] = useState(false)
  const initials = name
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  if (error || !src) {
    return (
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
        {initials || 'G'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className="h-9 w-9 rounded-full object-cover shrink-0"
      referrerPolicy="no-referrer"
    />
  )
}

function PermissionRow({
  icon,
  title,
  desc,
}: {
  icon: 'user' | 'mail' | 'shield'
  title: string
  desc: string
}) {
  const Icon = icon === 'user' ? UserIcon : icon === 'mail' ? MailIcon : Shield
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <Check className="h-4 w-4 text-emerald-600 mt-1 shrink-0" />
    </div>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  )
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}

function trimmedNameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'User'
  // Convert "john.doe" → "John Doe"
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ') || 'User'
  )
}
