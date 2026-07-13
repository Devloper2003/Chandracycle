'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Phone, ArrowLeft, ShieldCheck, Smartphone, RefreshCw, MessageSquare, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { SessionUser } from './auth-screen'

interface MobileOtpFormProps {
  onAuthed: (user: SessionUser) => void
  remember: boolean
}

type Step = 'phone' | 'otp'

export default function MobileOtpForm({ onAuthed, remember }: MobileOtpFormProps) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState<null | 'send' | 'verify'>(null)
  const [error, setError] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Resend countdown timer
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  // Auto-focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    }
  }, [step])

  const formatPhoneDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }

  const handlePhoneChange = (v: string) => {
    setPhone(v.replace(/\D/g, '').slice(0, 10))
    setError('')
  }

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    if (!/^[6-9]/.test(phone)) {
      setError('Mobile number must start with 6, 7, 8, or 9')
      return
    }
    setLoading('send')
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        setLoading(null)
        return
      }
      setMaskedPhone(data.maskedPhone || `+91 •••• ••${phone.slice(-2)}`)
      setResendIn(data.resendAfterSec || 30)
      setDevCode(data.devCode || null)
      setStep('otp')
      toast.success(`OTP sent to ${data.maskedPhone || '+91 •••• ••' + phone.slice(-2)}`, {
        description: data.devCode
          ? `Demo OTP: ${data.devCode} (no SMS gateway configured)`
          : 'Enter the 6-digit code sent to your phone.',
        duration: 6000,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    setError('')
    // Auto-advance to next input
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
    // Auto-submit when all 6 filled
    if (digit && index === 5 && next.every((c) => c !== '')) {
      void submitOtp(next.join(''))
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const next = ['', '', '', '', '', ''].map((_, i) => pasted[i] || '')
      setCode(next)
      if (pasted.length === 6) {
        void submitOtp(pasted)
      } else {
        inputsRef.current[pasted.length]?.focus()
      }
    }
  }

  const submitOtp = useCallback(
    async (fullCode: string) => {
      setLoading('verify')
      setError('')
      try {
        const res = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code: fullCode, name: name.trim() }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Verification failed')
          setLoading(null)
          // Clear OTP inputs for retry
          setCode(['', '', '', '', '', ''])
          inputsRef.current[0]?.focus()
          return
        }
        if (data.token && remember) {
          localStorage.setItem('chandracycle_token', data.token)
        }
        toast.success(`Signed in with ${phone}`)
        onAuthed(data.user)
      } catch {
        setError('Network error. Please try again.')
        setLoading(null)
        setCode(['', '', '', '', '', ''])
        inputsRef.current[0]?.focus()
      }
    },
    [phone, name, remember, onAuthed]
  )

  const handleResend = async () => {
    if (resendIn > 0) return
    setLoading('send')
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to resend OTP')
        setLoading(null)
        return
      }
      setResendIn(data.resendAfterSec || 30)
      setDevCode(data.devCode || null)
      setCode(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
      toast.success('New OTP sent', {
        description: data.devCode
          ? `Demo OTP: ${data.devCode} (no SMS gateway configured)`
          : 'Enter the new 6-digit code sent to your phone.',
        duration: 6000,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const backToPhone = () => {
    setStep('phone')
    setCode(['', '', '', '', '', ''])
    setError('')
    setDevCode(null)
  }

  const fillDevCode = () => {
    if (!devCode) return
    const digits = devCode.split('')
    setCode(digits)
    inputsRef.current[5]?.focus()
  }

  const copyDevCode = async () => {
    if (!devCode) return
    try {
      await navigator.clipboard.writeText(devCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard not available — ignore
    }
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Name (optional, for new users) */}
            <div className="space-y-1.5">
              <Label htmlFor="m-name" className="text-sm font-medium">
                Full name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="m-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="m-phone" className="text-sm font-medium">
                Mobile number
              </Label>
              <div className="relative flex">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm text-muted-foreground pointer-events-none">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">+91</span>
                </div>
                <Input
                  id="m-phone"
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="98765 43210"
                  value={formatPhoneDisplay(phone)}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-16 h-11 rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <Button
              type="button"
              className="w-full h-11 rounded-xl text-sm font-medium gap-1.5"
              onClick={handleSendOtp}
              disabled={loading !== null || phone.length !== 10}
            >
              {loading === 'send' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              <span>Send OTP</span>
            </Button>

            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>
                We&apos;ll send a 6-digit code via SMS. Standard message rates may apply.
              </span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <button
              type="button"
              onClick={backToPhone}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Change number</span>
            </button>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Enter verification code</Label>
              <p className="text-xs text-muted-foreground">
                Sent to <span className="font-medium text-foreground">{maskedPhone}</span>
              </p>
            </div>

            {/* Demo OTP banner — shown when no SMS gateway is configured so
                the user can actually see & enter the code (dev/sandbox mode) */}
            {devCode && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/30 dark:to-rose-950/20 p-3"
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Demo OTP
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      No SMS gateway configured. Use the code below to sign in.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-xl font-bold tracking-[0.3em] text-amber-700 dark:text-amber-300 select-all">
                        {devCode}
                      </code>
                      <button
                        type="button"
                        onClick={copyDevCode}
                        className="rounded-md p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        aria-label="Copy OTP"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-amber-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={fillDevCode}
                        className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* OTP inputs */}
            <div className="flex justify-between gap-2" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-semibold rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                  disabled={loading === 'verify'}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              type="button"
              className="w-full h-11 rounded-xl text-sm font-medium gap-1.5"
              onClick={() => submitOtp(code.join(''))}
              disabled={loading !== null || code.some((c) => !c)}
            >
              {loading === 'verify' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              <span>Verify &amp; Sign in</span>
            </Button>

            {/* Resend */}
            <div className="text-center">
              {resendIn > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Resend code in <span className="font-medium">{resendIn}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading !== null}
                  className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Resend OTP</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
