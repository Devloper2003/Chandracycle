'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, Sparkles, ArrowRight, Gift } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAppStore, ActiveModule, isPremiumModule } from '@/lib/store'
import { TRIAL_DAYS, formatINR, YEARLY } from '@/lib/subscription'

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

// ─── FeatureGate Component ──────────────────────────────────────────────────

export interface FeatureGateProps {
  module: ActiveModule
  children: React.ReactNode
}

export default function FeatureGate({ module, children }: FeatureGateProps) {
  const hasPremium = useAppStore((s) => s.hasPremium())
  const openPaywall = useAppStore((s) => s.openPaywall)

  // Basic modules and modules already accessible: render as-is
  if (hasPremium || !isPremiumModule(module)) {
    return <>{children}</>
  }

  // Premium module, locked: render blurred preview with overlay card
  const moduleName = MODULE_NAMES[module] ?? 'This feature'

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred preview (non-interactive) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none blur-sm opacity-60 max-h-[70vh] overflow-hidden"
      >
        {children}
      </div>

      {/* Semi-transparent overlay + centered unlock card */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background/95 backdrop-blur-[2px] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="w-full max-w-md"
        >
          <Card className="relative overflow-hidden border-amber-300 dark:border-amber-700 shadow-xl">
            {/* Gradient top bar */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-rose-500" />

            <CardContent className="p-6 sm:p-7 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-rose-500 text-white shadow-lg shadow-amber-500/30 mb-3"
              >
                <Lock className="h-7 w-7" />
              </motion.div>

              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h3 className="text-lg font-bold">{moduleName}</h3>
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 gap-0.5"
                >
                  <Crown className="h-3 w-3" /> PRO
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                This is a Premium feature. Start your {TRIAL_DAYS}-day free trial to unlock{' '}
                {moduleName} — plus 14+ other premium modules.
              </p>

              {/* Quick value-prop row */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-[11px]">
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="font-semibold text-foreground">{formatINR(YEARLY.total)}/yr</div>
                  <div className="text-muted-foreground">incl. 18% GST</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="font-semibold text-foreground">{TRIAL_DAYS} days</div>
                  <div className="text-muted-foreground">free trial</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="font-semibold text-foreground">No card</div>
                  <div className="text-muted-foreground">during trial</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => openPaywall(module)}
                  className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-rose-500 hover:opacity-90 text-white font-semibold shadow-md shadow-amber-500/30"
                >
                  <Gift className="h-4 w-4 mr-1.5" /> Start 7-Day Free Trial
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
                <Button
                  onClick={() => openPaywall(module)}
                  variant="outline"
                  className={cn(
                    'w-full border-amber-300 text-amber-700 hover:bg-amber-50',
                    'dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30'
                  )}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" /> See all Premium features
                </Button>
              </div>

              <p className="mt-3 text-[10px] text-muted-foreground">
                Cancel anytime · GST invoice provided · DPDP Act compliant
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
