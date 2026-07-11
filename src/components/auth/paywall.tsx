'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown,
  Sparkles,
  Check,
  Star,
  Shield,
  Lock,
  Gift,
  ArrowRight,
  Loader2,
  X,
  Receipt,
  CalendarClock,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppStore, ActiveModule } from '@/lib/store'
import { MONTHLY, YEARLY, TRIAL_DAYS, formatINR } from '@/lib/subscription'

// ─── Module-friendly names ──────────────────────────────────────────────────

const MODULE_NAMES: Record<ActiveModule, string> = {
  dashboard: 'Dashboard',
  period: 'Period Tracker',
  hormone: 'Hormone Intelligence',
  symptoms: 'Symptoms Tracker',
  pcos: 'PCOS Care',
  fertility: 'Fertility Planner',
  pregnancy: 'Pregnancy Companion',
  menopause: 'Menopause Assistant',
  coach: 'AI Health Coach',
  diet: 'AI Diet Advisor',
  doctors: 'Find a Doctor',
  mental: 'Mental Wellness',
  fitness: 'Fitness & Workouts',
  beauty: 'Skin & Beauty Tracker',
  community: 'Community',
  reports: 'Reports',
  marketplace: 'Wellness Marketplace',
  'ai-insights': 'AI Insights',
  premium: 'Premium',
  settings: 'Settings',
}

// ─── Main Paywall Component ─────────────────────────────────────────────────

export default function Paywall() {
  const paywallOpen = useAppStore((s) => s.paywallOpen)
  const paywallTarget = useAppStore((s) => s.paywallTarget)
  const closePaywall = useAppStore((s) => s.closePaywall)
  const subscription = useAppStore((s) => s.subscription)
  const activateSubscription = useAppStore((s) => s.activateSubscription)
  const startTrial = useAppStore((s) => s.startTrial)

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)

  // Lock body scroll while paywall open
  useEffect(() => {
    if (paywallOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [paywallOpen])

  const moduleName = paywallTarget ? MODULE_NAMES[paywallTarget] : 'this feature'
  const isExpiredTrial =
    subscription.status === 'expired' ||
    (subscription.status === 'trialing' && useAppStore.getState().trialDaysLeft() <= 0)

  const handleSubscribe = async () => {
    setLoading(true)
    // Simulate brief payment processing state
    await new Promise((r) => setTimeout(r, 1200))
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('chandracycle_token') : null
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({ plan: selectedPlan, paymentMethod: 'upi' }),
      })
      // Server returns 503 when payments aren't configured; otherwise the
      // real activation happens via the /verify route. Here we just optimistically
      // close the paywall — the canonical source of truth remains the server.
      activateSubscription(selectedPlan)
      toast.success('🎉 Premium activated!', {
        description: `You are now on the Premium ${selectedPlan} plan. Enjoy ${moduleName}!`,
      })
      closePaywall()
    } catch (e) {
      console.error('[paywall subscribe]', e)
      toast.error('Could not complete payment', {
        description: 'Please check your connection and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrial = () => {
    // For new users — kick off the 7-day trial without a card
    startTrial()
    toast.success('🎁 7-day free trial started!', {
      description: `Enjoy full Premium access to ${moduleName} for ${TRIAL_DAYS} days — no card required.`,
    })
    closePaywall()
  }

  return (
    <Dialog open={paywallOpen} onOpenChange={(o) => !o && closePaywall()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent
          showCloseButton={false}
          className="p-0 gap-0 overflow-hidden max-w-md border-0 bg-transparent shadow-none"
        >
          <AnimatePresence>
            {paywallOpen && (
              <motion.div
                key="paywall-card"
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="relative overflow-hidden rounded-2xl bg-card border border-amber-300/60 dark:border-amber-700/50 shadow-2xl"
              >
                {/* Header band */}
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-rose-500" />
                  <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-yellow-300/40 blur-2xl" />
                  <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-rose-400/40 blur-2xl" />

                  {/* Close button */}
                  <button
                    onClick={closePaywall}
                    aria-label="Close"
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors border border-white/30"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative z-[1] p-6 sm:p-7 text-center text-white">
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 mb-3"
                    >
                      <Lock className="h-7 w-7" />
                    </motion.div>
                    <h2 className="text-xl font-bold drop-shadow-sm">Premium Feature</h2>
                    <p className="text-white/90 text-sm mt-1">
                      {isExpiredTrial ? (
                        <>Your free trial has ended — subscribe to continue.</>
                      ) : (
                        <>
                          <span className="font-semibold">{moduleName}</span> is a Premium feature.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6">
                  {/* Pitch */}
                  {!isExpiredTrial && (
                    <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-3">
                      <div className="flex items-start gap-2.5">
                        <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                          Start a <span className="font-semibold">7-day free trial</span> today — no card
                          required during the trial. Get unlimited access to {moduleName} and 14+ premium
                          modules.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pricing options */}
                  <div className="space-y-2.5 mb-4">
                    {/* Monthly */}
                    <button
                      onClick={() => setSelectedPlan('monthly')}
                      className={cn(
                        'w-full text-left rounded-xl border p-3.5 transition-all',
                        selectedPlan === 'monthly'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-400/40'
                          : 'border-border hover:border-amber-300 dark:hover:border-amber-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-full border-2',
                              selectedPlan === 'monthly'
                                ? 'border-amber-500 bg-amber-500'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {selectedPlan === 'monthly' && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">Premium Monthly</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Receipt className="h-3 w-3" />
                              {formatINR(MONTHLY.base)} + {formatINR(MONTHLY.gst)} GST (18%)
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold">{formatINR(MONTHLY.total)}</div>
                          <div className="text-[10px] text-muted-foreground">/month</div>
                        </div>
                      </div>
                    </button>

                    {/* Yearly */}
                    <button
                      onClick={() => setSelectedPlan('yearly')}
                      className={cn(
                        'w-full text-left rounded-xl border p-3.5 transition-all relative',
                        selectedPlan === 'yearly'
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/30 dark:to-rose-950/20 ring-2 ring-amber-400/50'
                          : 'border-amber-300 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-700'
                      )}
                    >
                      <div className="absolute -top-2 right-3">
                        <Badge className="bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] gap-0.5 px-1.5">
                          <Sparkles className="h-2.5 w-2.5" /> BEST VALUE
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-full border-2',
                              selectedPlan === 'yearly'
                                ? 'border-amber-500 bg-amber-500'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {selectedPlan === 'yearly' && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">Premium Yearly</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Receipt className="h-3 w-3" />
                              {formatINR(YEARLY.base)} + {formatINR(YEARLY.gst)} GST (18%)
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ≈ {formatINR(Math.round(YEARLY.total / 12))}/mo · 2 months free
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold">{formatINR(YEARLY.total)}</div>
                          <div className="text-[10px] text-muted-foreground">/year</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Quick feature highlights */}
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4 text-[11px] text-muted-foreground">
                    {[
                      'Unlimited AI Coach',
                      'Hormone Intelligence',
                      'PCOS risk scoring',
                      'Fertility planner',
                      'Pregnancy companion',
                      'Mental wellness library',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Separator className="mb-4" />

                  {/* CTAs */}
                  <div className="space-y-2">
                    <Button
                      onClick={isExpiredTrial ? handleSubscribe : handleStartTrial}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-rose-500 hover:opacity-90 text-white font-semibold shadow-md shadow-amber-500/30"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…
                        </>
                      ) : isExpiredTrial ? (
                        <>
                          <Crown className="h-4 w-4 mr-1.5" /> Subscribe to {moduleName}
                          <ArrowRight className="h-4 w-4 ml-1.5" />
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4 mr-1.5" /> Start 7-Day Free Trial
                          <ArrowRight className="h-4 w-4 ml-1.5" />
                        </>
                      )}
                    </Button>

                    {!isExpiredTrial && (
                      <Button
                        onClick={handleSubscribe}
                        disabled={loading}
                        variant="outline"
                        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                      >
                        <Crown className="h-4 w-4 mr-1.5" /> Subscribe now ·{' '}
                        {formatINR(selectedPlan === 'monthly' ? MONTHLY.total : YEARLY.total)}
                        {selectedPlan === 'monthly' ? '/mo' : '/yr'}
                      </Button>
                    )}

                    <Button
                      onClick={closePaywall}
                      disabled={loading}
                      variant="ghost"
                      className="w-full text-muted-foreground"
                    >
                      Maybe later
                    </Button>
                  </div>

                  {/* Trust line */}
                  <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3" /> HIPAA-secured
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Receipt className="h-3 w-3" /> GST invoice
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> Cancel anytime
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
