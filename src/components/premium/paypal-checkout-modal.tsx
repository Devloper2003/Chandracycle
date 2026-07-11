'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  X,
  Lock,
  Shield,
  Loader2,
  Check,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Crown,
  Zap,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PaypalSmartButtons } from './paypal-smart-buttons'

// ─── Brand constants ─────────────────────────────────────────────────────────
// PayPal's official brand colors — required for authentic PayPal UX.
const PAYPAL_BLUE = '#003087'
const PAYPAL_YELLOW = '#ffc439'
const PAYPAL_YELLOW_HOVER = '#f0b419'
const PAYPAL_LIGHT_BLUE = '#009cde'
const GST_RATE = 0.18

// ─── Types ───────────────────────────────────────────────────────────────────

/** Structural subset of the Plan interface from premium.tsx — accepts the full Plan via TS structural typing. */
interface PaypalPlan {
  id: 'free' | 'premium' | 'plus'
  name: string
  monthlyPrice: number
  yearlyPrice: number
}

type BillingCycle = 'monthly' | 'yearly'
type Step = 'login' | 'review' | 'processing' | 'success'
type PaymentMethodId = 'visa' | 'mastercard' | 'balance'

interface Receipt {
  transactionId: string
  merchant: string
  planId: 'premium' | 'plus'
  planName: string
  billingCycle: BillingCycle
  subtotal: number
  gst: number
  total: number
  currency: string
  paymentMethod: {
    type: 'card' | 'balance'
    email?: string
    last4?: string
    brand?: string
  }
  buyerEmail?: string
  buyerName?: string | null
  timestamp: string
  status: 'COMPLETED'
  note: string
}

interface PaypalCheckoutModalProps {
  plan: PaypalPlan
  billingCycle: BillingCycle
  onClose: () => void
  onSuccess: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ─── PayPal Logo (wordmark) ──────────────────────────────────────────────────

function PayPalLogo({
  variant = 'color',
  className,
}: {
  variant?: 'color' | 'white'
  className?: string
}) {
  const payColor = variant === 'white' ? '#ffffff' : PAYPAL_LIGHT_BLUE
  const palColor = variant === 'white' ? '#ffffff' : PAYPAL_BLUE
  return (
    <svg
      viewBox="0 0 96 26"
      className={className}
      role="img"
      aria-label="PayPal"
      preserveAspectRatio="xMidYMid meet"
    >
      <text
        x="0"
        y="21"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontStyle="italic"
        fontWeight={800}
        fontSize="25"
        letterSpacing="-1.2"
      >
        <tspan fill={payColor}>Pay</tspan>
        <tspan fill={palColor}>Pal</tspan>
      </text>
    </svg>
  )
}

// ─── Card brand marks ────────────────────────────────────────────────────────

function VisaMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-6 w-10 items-center justify-center rounded bg-[#1a1f71] text-white',
        className,
      )}
    >
      <span className="text-[9px] font-bold italic tracking-tight">VISA</span>
    </div>
  )
}

function MastercardMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-6 w-10 items-center justify-center rounded bg-white',
        className,
      )}
    >
      <span className="absolute left-1.5 h-4 w-4 rounded-full bg-[#eb001b]" />
      <span className="absolute right-1.5 h-4 w-4 rounded-full bg-[#f79e1b] mix-blend-multiply" />
    </div>
  )
}

function PaypalBalanceMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-6 w-10 items-center justify-center rounded bg-gradient-to-br from-[#009cde] to-[#003087] text-white',
        className,
      )}
    >
      <span className="text-[9px] font-extrabold italic tracking-tight">P</span>
    </div>
  )
}

// ─── Norton Secured seal ─────────────────────────────────────────────────────

function NortonSeal() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#ffd200] text-[#1a1a1a]">
        <span className="text-[11px] font-black italic leading-none">N</span>
      </div>
      <span className="text-[10px] leading-tight text-gray-500">
        Norton <span className="font-semibold text-gray-600">Secured</span>
      </span>
    </div>
  )
}

// ─── Confetti burst (success step) ───────────────────────────────────────────

interface ConfettiParticle {
  id: number
  x: number
  y: number
  color: string
  size: number
  delay: number
  rotate: number
}

function ConfettiBurst() {
  const particles = useMemo<ConfettiParticle[]>(() => {
    const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#10b981', '#34d399', '#ffffff', '#f472b6']
    return Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      const distance = 70 + Math.random() * 80
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20, // bias upward toward checkmark
        color: colors[i % colors.length],
        size: 4 + Math.random() * 5,
        delay: Math.random() * 0.18,
        rotate: (Math.random() - 0.5) * 540,
      }
    })
  }, [])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-10 flex justify-center">
      <div className="relative h-0 w-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 0.9, 0.6],
              rotate: p.rotate,
            }}
            transition={{
              duration: 1.6,
              delay: p.delay,
              ease: 'easeOut',
              times: [0, 0.15, 0.6, 1],
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Animated green checkmark ────────────────────────────────────────────────

function AnimatedCheck() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      {/* Soft glow */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full bg-emerald-100"
      />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.15, 1], opacity: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full bg-emerald-500/15"
      />
      <svg viewBox="0 0 52 52" className="relative h-20 w-20">
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <motion.path
          d="M14 27l8 8 16-16"
          fill="none"
          stroke="#10b981"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function PaypalCheckoutModal({
  plan,
  billingCycle,
  onClose,
  onSuccess,
}: PaypalCheckoutModalProps) {
  const [step, setStep] = useState<Step>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('visa')
  const [paying, setPaying] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [copied, setCopied] = useState(false)
  const [creatingOrder, setCreatingOrder] = useState(false)

  // ─── Pricing (GST 18%) ─────────────────────────────────────────────────────
  const basePrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  const subtotal = round2(basePrice)
  const gst = round2(subtotal * GST_RATE)
  const total = round2(subtotal + gst)

  // USD equivalent for PayPal (PayPal charges in USD — INR not supported by sandbox)
  const USD_PRICES: Record<'premium' | 'plus', { monthly: number; yearly: number }> = {
    premium: { monthly: 3.99, yearly: 29.99 },
    plus: { monthly: 7.99, yearly: 59.99 },
  }
  const usdAmount =
    plan.id === 'premium' || plan.id === 'plus'
      ? round2(USD_PRICES[plan.id][billingCycle])
      : round2(total / 83)

  // ─── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // ─── Escape key (disabled during processing) ───────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (step === 'processing') return
      if (step === 'success') {
        // In success, any close should grant premium (payment succeeded)
        onSuccess()
        return
      }
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, onClose, onSuccess])

  // ─── Close handlers ────────────────────────────────────────────────────────
  const handleBackdropClick = () => {
    // Click-outside disabled during processing AND success
    if (step === 'processing' || step === 'success') return
    onClose()
  }

  const handleCloseButton = () => {
    if (step === 'processing') return
    if (step === 'success') {
      onSuccess()
      return
    }
    onClose()
  }

  // ─── Step 1: Login ─────────────────────────────────────────────────────────
  const handleLogin = () => {
    const trimmed = email.trim().toLowerCase()
    let hasError = false
    if (!trimmed) {
      setEmailError('Enter your PayPal email')
      hasError = true
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address')
      hasError = true
    } else {
      setEmailError('')
    }
    if (!password) {
      setPasswordError('Enter your PayPal password')
      hasError = true
    } else if (password.length < 4) {
      setPasswordError('Password is too short')
      hasError = true
    } else {
      setPasswordError('')
    }
    if (hasError) return

    setLoggingIn(true)
    // Simulate PayPal authentication round-trip
    setTimeout(() => {
      setLoggingIn(false)
      setStep('review')
    }, 900)
  }

  // ─── Real PayPal flow: create order (server-side) ──────────────────────────
  // Called by the PayPal Smart Button's createOrder callback. Must return a
  // PayPal orderID string.
  const handleCreateOrder = useCallback(async (): Promise<string> => {
    setCreatingOrder(true)
    try {
      const res = await fetch('/api/payment/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok || !data.orderId) {
        throw new Error(data.error || 'Could not create your PayPal order.')
      }
      return data.orderId as string
    } finally {
      setCreatingOrder(false)
    }
  }, [plan.id, billingCycle])

  // ─── Real PayPal flow: buyer approved → capture (server-side) ──────────────
  // Called by the PayPal Smart Button's onApprove callback after the buyer
  // logs into PayPal and consents. We capture the payment here (real money
  // moves) and activate the subscription.
  const handlePaypalApprove = useCallback(
    async (orderID: string) => {
      setPaying(true)
      setStep('processing')
      try {
        const res = await fetch('/api/payment/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderID,
            planId: plan.id,
            billingCycle,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Payment was declined. Please try again.')
        }

        setTransactionId(data.transactionId)
        setReceipt(data.receipt as Receipt)
        setStep('success')
        toast.success('Welcome to Premium! 🎉', {
          description: `You're now on the ${plan.name} plan. Transaction ID: ${data.transactionId}`,
        })
      } catch (err) {
        toast.error('Payment could not be completed', {
          description: err instanceof Error ? err.message : 'Please try again.',
        })
        setStep('login')
      } finally {
        setPaying(false)
      }
    },
    [plan.id, plan.name, billingCycle],
  )

  const handlePaypalCancel = useCallback(() => {
    toast.info('PayPal payment cancelled.')
  }, [])

  const handlePaypalError = useCallback((err: unknown) => {
    console.error('[paypal] button error', err)
    toast.error('PayPal encountered an error', {
      description: err instanceof Error ? err.message : 'Please try again.',
    })
  }, [])

  // ─── Step 2 → 3 → 4: Pay (legacy simulated flow — kept for the review step) ─
  const handlePay = async () => {
    setPaying(true)
    setStep('processing')
    try {
      const pm =
        paymentMethod === 'balance'
          ? {
              type: 'balance' as const,
              email: email.trim().toLowerCase() || undefined,
            }
          : {
              type: 'card' as const,
              last4: '4242',
              brand: paymentMethod === 'visa' ? 'Visa' : 'Mastercard',
            }

      const res = await fetch('/api/payment/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
          paymentMethod: pm,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Payment was declined. Please try a different method.')
      }

      setTransactionId(data.transactionId)
      setReceipt(data.receipt as Receipt)
      setStep('success')
      toast.success('Welcome to Premium! 🎉', {
        description: `You're now on the ${plan.name} plan. Transaction ID: ${data.transactionId}`,
      })
    } catch (err) {
      toast.error('Payment could not be completed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
      setStep('review')
    } finally {
      setPaying(false)
    }
  }

  const handleCopyTransactionId = async () => {
    try {
      await navigator.clipboard.writeText(transactionId)
      setCopied(true)
      toast.success('Transaction ID copied')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  const handleContinue = () => {
    onSuccess()
  }

  const canClose = step === 'login' || step === 'review' || step === 'success'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-md"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full max-w-[440px] max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="paypal-modal-title"
        >
          {/* ─── PayPal Blue Header ─────────────────────────────────────────── */}
          <div
            className="relative flex shrink-0 items-center justify-between px-5 py-3.5"
            style={{ backgroundColor: PAYPAL_BLUE }}
          >
            <div className="flex items-center gap-2.5">
              <PayPalLogo variant="white" className="h-5 w-auto" />
              <span className="text-xs font-medium text-white/70">|</span>
              <span className="text-xs font-medium tracking-wide text-white/90">Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1 text-[10px] font-medium text-white/70 sm:flex">
                <Lock className="h-3 w-3" /> Secure
              </span>
              {canClose && (
                <button
                  onClick={handleCloseButton}
                  className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* ─── Body (scrollable) ──────────────────────────────────────────── */}
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              {/* ─── Step 1: Checkout (real PayPal Smart Buttons) ──────────── */}
              {step === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                  className="px-6 py-6"
                >
                  <h2
                    id="paypal-modal-title"
                    className="text-[22px] font-semibold leading-tight text-[#2c2e2f]"
                  >
                    Pay with PayPal
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Securely subscribe to <span className="font-medium text-[#0070ba]">{plan.name}</span>
                  </p>

                  {/* ─── Plan summary ───────────────────────────────────────── */}
                  <div className="mt-4 rounded-xl border border-gray-200 bg-[#f7f9fa] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#2c2e2f]">{plan.name}</p>
                        <p className="text-xs text-gray-500">
                          {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} subscription
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#2c2e2f]">₹{formatINR(total)}</p>
                        <p className="text-[10px] text-gray-500">incl. 18% GST</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 border-t border-gray-200 pt-2 text-[11px] text-gray-500">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{formatINR(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%)</span>
                        <span>₹{formatINR(gst)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-[#2c2e2f]">
                        <span>Total (INR ref.)</span>
                        <span>₹{formatINR(total)}</span>
                      </div>
                      <div className="mt-1 flex justify-between border-t border-dashed border-gray-200 pt-1 text-[#0070ba]">
                        <span className="font-medium">PayPal charges (USD)</span>
                        <span className="font-semibold">
                          ${usdAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ─── Real PayPal Smart Buttons ─────────────────────────── */}
                  <div className="mt-5">
                    {creatingOrder && (
                      <div className="mb-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Creating your PayPal order…</span>
                      </div>
                    )}
                    <PaypalSmartButtons
                      onCreateOrder={handleCreateOrder}
                      onApprove={handlePaypalApprove}
                      onCancel={handlePaypalCancel}
                      onError={handlePaypalError}
                      height={45}
                    />
                  </div>

                  {/* Divider */}
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      or
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  {/* Sandbox test credentials hint */}
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="text-[11px] font-semibold text-[#0070ba]">
                      🧪 PayPal Sandbox
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                      Use a PayPal sandbox test account to complete this payment. Create one at{' '}
                      <a
                        href="https://developer.paypal.com/dashboard/applications/sandbox"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#0070ba] underline"
                      >
                        PayPal Developer
                      </a>
                      . No real money is charged.
                    </p>
                  </div>

                  {/* Secure note */}
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#f7f9fa] p-3">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0070ba]" />
                    <p className="text-[11px] leading-relaxed text-gray-500">
                      This is a secure PayPal checkout.{' '}
                      <span className="font-medium text-gray-700">
                        You'll log in to PayPal directly — ChandraCycle never sees your password.
                      </span>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 2: Review & Pay ──────────────────────────────────── */}
              {step === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22 }}
                  className="px-6 py-5"
                >
                  {/* Back link */}
                  <button
                    onClick={() => setStep('login')}
                    className="mb-3 flex items-center gap-1 text-xs font-medium text-[#0070ba] hover:underline"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change account
                  </button>

                  <h2
                    id="paypal-modal-title"
                    className="text-xl font-semibold leading-tight text-[#2c2e2f]"
                  >
                    Review your payment
                  </h2>

                  {/* Merchant */}
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-base font-bold text-white">
                      A
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2c2e2f]">ChandraCycle Health</p>
                      <p className="truncate text-xs text-gray-500">{email.trim().toLowerCase() || 'PayPal account'}</p>
                    </div>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  </div>

                  {/* Order summary */}
                  <div className="mt-4 rounded-lg border border-gray-200 bg-[#fbfcfd] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Order summary
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">
                        {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#2c2e2f]">{plan.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <Crown className="h-3 w-3 text-amber-500" />
                          Premium subscription · {billingCycle === 'monthly' ? '1 month' : '12 months'}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-[#2c2e2f]">
                        ₹{formatINR(subtotal)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium text-[#2c2e2f]">₹{formatINR(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">GST (18%)</span>
                        <span className="font-medium text-[#2c2e2f]">₹{formatINR(gst)}</span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between border-t border-gray-200 pt-2">
                        <span className="text-sm font-semibold text-[#2c2e2f]">Total</span>
                        <span className="text-lg font-bold text-[#2c2e2f]">
                          ₹{formatINR(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment method
                    </p>
                    <div className="space-y-2">
                      <PaymentOption
                        selected={paymentMethod === 'visa'}
                        onSelect={() => setPaymentMethod('visa')}
                        mark={<VisaMark />}
                        title="Visa"
                        subtitle="Credit card ending in 4242"
                        badge="Default"
                      />
                      <PaymentOption
                        selected={paymentMethod === 'mastercard'}
                        onSelect={() => setPaymentMethod('mastercard')}
                        mark={<MastercardMark />}
                        title="Mastercard"
                        subtitle="Debit card ending in 4242"
                      />
                      <PaymentOption
                        selected={paymentMethod === 'balance'}
                        onSelect={() => setPaymentMethod('balance')}
                        mark={<PaypalBalanceMark />}
                        title="PayPal Balance"
                        subtitle="₹15,000.00 available"
                      />
                    </div>
                  </div>

                  {/* Digital delivery */}
                  <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-[#f7f9fa] p-3">
                    <Zap className="h-4 w-4 shrink-0 text-[#0070ba]" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[#2c2e2f]">
                        Digital delivery
                      </p>
                      <p className="text-[11px] text-gray-500">Instant access after payment</p>
                    </div>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </div>

                  {/* Pay button */}
                  <Button
                    type="button"
                    onClick={handlePay}
                    disabled={paying}
                    className="mt-5 h-12 w-full rounded-full text-sm font-bold text-[#2c2e2f] shadow-sm transition-colors disabled:opacity-70"
                    style={{ backgroundColor: PAYPAL_YELLOW }}
                    onMouseEnter={(e) => {
                      if (!paying) e.currentTarget.style.backgroundColor = PAYPAL_YELLOW_HOVER
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = PAYPAL_YELLOW
                    }}
                  >
                    {paying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Pay ₹{formatINR(total)} Now
                      </>
                    )}
                  </Button>

                  {/* Buyer protection row */}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <NortonSeal />
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Shield className="h-3 w-3 text-[#0070ba]" />
                      <span>
                        <span className="font-semibold text-gray-600">PayPal Buyer Protection</span> eligible
                      </span>
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 3: Processing ────────────────────────────────────── */}
              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center justify-center px-6 py-16"
                >
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: '3px solid #e6e9ec' }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: `3px solid ${PAYPAL_BLUE}`,
                        borderTopColor: 'transparent',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    />
                    <PayPalLogo variant="color" className="h-5 w-auto" />
                  </div>
                  <p className="mt-6 text-sm font-semibold text-[#2c2e2f]">
                    Processing your payment securely…
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Do not close this window. This will only take a moment.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Lock className="h-3 w-3" />
                    <span>256-bit encrypted connection</span>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 4: Success ───────────────────────────────────────── */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative overflow-hidden px-6 py-8 text-center"
                >
                  <ConfettiBurst />

                  <div className="relative flex flex-col items-center">
                    <AnimatedCheck />

                    <motion.h2
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="mt-5 text-2xl font-bold text-[#2c2e2f]"
                    >
                      Payment Successful!
                    </motion.h2>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-sm font-semibold text-white shadow-md"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      You&apos;re now {plan.name}! 🎉
                    </motion.div>

                    {/* Transaction details */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.3 }}
                      className="mt-6 w-full rounded-xl border border-gray-200 bg-[#fbfcfd] p-4 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Amount paid
                        </span>
                        <span className="text-sm font-bold text-[#2c2e2f]">
                          ₹{formatINR(total)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Transaction ID
                        </span>
                        <button
                          onClick={handleCopyTransactionId}
                          className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold text-[#0070ba] transition-colors hover:bg-[#0070ba]/5"
                          title="Copy transaction ID"
                        >
                          {transactionId}
                          {copied ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      {receipt && (
                        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Paid via
                          </span>
                          <span className="text-xs font-medium text-[#2c2e2f]">
                            {receipt.paymentMethod.type === 'balance'
                              ? 'PayPal Balance'
                              : `${receipt.paymentMethod.brand} •••• ${receipt.paymentMethod.last4}`}
                          </span>
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.85, duration: 0.3 }}
                      className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-500"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>A receipt has been sent to your email</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.95, duration: 0.3 }}
                      className="mt-6 w-full"
                    >
                      <Button
                        type="button"
                        onClick={handleContinue}
                        className="h-12 w-full rounded-full text-sm font-bold text-[#2c2e2f] shadow-sm transition-colors"
                        style={{ backgroundColor: PAYPAL_YELLOW }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = PAYPAL_YELLOW_HOVER
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = PAYPAL_YELLOW
                        }}
                      >
                        <Crown className="h-4 w-4" />
                        Continue to Dashboard
                      </Button>
                      <p className="mt-3 text-[11px] text-gray-400">
                        You can access all {plan.name} features immediately.
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Footer (hidden during processing/success) ─────────────────── */}
          {(step === 'login' || step === 'review') && (
            <div className="flex shrink-0 items-center justify-between border-t border-gray-100 bg-[#f7f9fa] px-6 py-2.5 text-[10px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                PayPal Secure Checkout
              </span>
              <span>© {new Date().getFullYear()} PayPal · ChandraCycle</span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Payment option row ──────────────────────────────────────────────────────

function PaymentOption({
  selected,
  onSelect,
  mark,
  title,
  subtitle,
  badge,
}: {
  selected: boolean
  onSelect: () => void
  mark: React.ReactNode
  title: string
  subtitle: string
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
        selected
          ? 'border-[#0070ba] bg-[#0070ba]/5 ring-1 ring-[#0070ba]/30'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
      )}
    >
      <div className="shrink-0">{mark}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#2c2e2f]">{title}</p>
          {badge && (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
      </div>
      <div
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-[#0070ba] bg-[#0070ba]' : 'border-gray-300',
        )}
      >
        {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
      </div>
    </button>
  )
}
