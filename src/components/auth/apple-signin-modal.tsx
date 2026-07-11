'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface AppleAccount {
  email: string
  name: string
}

interface AppleSignInModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (account: AppleAccount) => void
}

type Step = 'signin' | 'consent' | 'loading'

export default function AppleSignInModal({ open, onClose, onSuccess }: AppleSignInModalProps) {
  // Parent remounts this component via `key` prop when opening, so initial
  // state is always fresh — no need to reset state in an effect.
  const [step, setStep] = useState<Step>('signin')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'loading') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  const handleSubmit = () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Enter your Apple ID email')
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
    setTimeout(() => {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || trimmedNameFromEmail(email)
      onSuccess({
        email: email.trim().toLowerCase(),
        name: fullName,
      })
    }, 1100)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={() => step !== 'loading' && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apple-modal-title"
        >
          {/* Apple-style header */}
          <div className="bg-black text-white px-6 pt-6 pb-5 relative">
            {step !== 'loading' && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <AppleLogo className="h-7 w-7" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/60">Sign In with</p>
                <p id="apple-modal-title" className="text-lg font-semibold">Apple</p>
              </div>
            </div>
          </div>

          {/* ─── Step 1: Sign in ───────────────────────────────────────────── */}
          {step === 'signin' && (
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-900">Sign in with your Apple ID</h2>
              <p className="text-sm text-gray-600 mt-1 mb-5">
                Use your Apple ID to sign in to <span className="font-medium text-gray-900">ChandraCycle</span>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Apple ID (email)</label>
                  <Input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="your.name@icloud.com"
                    className="h-11 rounded-md border-gray-300 focus-visible:ring-gray-900"
                  />
                  {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="Priya"
                      className="h-11 rounded-md border-gray-300 focus-visible:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="Sharma"
                      className="h-11 rounded-md border-gray-300 focus-visible:ring-gray-900"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                By continuing, you agree to Apple&apos;s Terms of Service and acknowledge ChandraCycle&apos;s Privacy Policy. Your password is never shared with ChandraCycle.
              </p>

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-black hover:bg-gray-800 text-white rounded-md px-6"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Consent ───────────────────────────────────────────── */}
          {step === 'consent' && (
            <div className="px-6 py-6">
              <button
                onClick={() => setStep('signin')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm mb-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-start gap-3 mb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-xl">
                  A
                </div>
                <div className="flex-1 pt-1">
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                    ChandraCycle is requesting access
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Sign in to ChandraCycle with your Apple ID <span className="font-medium text-gray-800">{email.trim().toLowerCase()}</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <PermissionItem text="Your name and email address" />
                <PermissionItem text="A verified token — never your Apple ID password" />
                <PermissionItem text="Hide my Email is supported for privacy" />
              </div>

              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                Apple will send ChandraCycle your name and email. You can review and revoke access in your Apple ID settings anytime.
              </p>

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAllow}
                  className="bg-black hover:bg-gray-800 text-white rounded-md px-6"
                >
                  <AppleLogo className="h-4 w-4 mr-1.5" />
                  Allow
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Loading ───────────────────────────────────────────── */}
          {step === 'loading' && (
            <div className="px-6 py-12 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
              <p className="text-sm text-gray-700">Signing you in to ChandraCycle…</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function PermissionItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-5 w-5 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
        <Check className="h-3 w-3 text-emerald-700" />
      </div>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  )
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.95.94-.82 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.82 3.15-.46 7.81 1.3 10.37.86 1.26 1.88 2.67 3.22 2.62 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.28 3.12-2.55.98-1.45 1.38-2.86 1.4-2.93-.03-.01-2.69-1.03-2.72-4.09ZM14.6 4.59c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44Z" />
    </svg>
  )
}

function trimmedNameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'User'
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ') || 'User'
}
