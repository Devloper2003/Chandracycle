'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Crown, Sparkles, HelpCircle } from 'lucide-react'
import { useAppStore, ActiveModule } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import NotificationPanel from '@/components/notifications/notification-panel'

interface MobileTopbarProps {
  onTakeTour?: () => void
  userId?: string
}

/* ─── Module labels map (kept in sync with page.tsx navItems) ─────────────── */

const MODULE_LABELS: Record<ActiveModule, string> = {
  dashboard: 'Dashboard',
  period: 'Period Tracker',
  hormone: 'Hormone IQ',
  symptoms: 'Symptoms',
  pcos: 'PCOS Care',
  fertility: 'Fertility',
  pregnancy: 'Pregnancy',
  menopause: 'Menopause',
  coach: 'AI Coach',
  diet: 'Diet Advisor',
  doctors: 'Find Doctor',
  mental: 'Mind & Soul',
  fitness: 'Move & Flow',
  beauty: 'Skin & Beauty',
  community: 'Community',
  reports: 'Reports',
  marketplace: 'Wellness Market',
  'ai-insights': 'AI Insights',
  premium: 'ChandraCycle Premium',
  settings: 'Settings',
}

export default function MobileTopbar({ onTakeTour, userId }: MobileTopbarProps) {
  const activeModule = useAppStore((s) => s.activeModule)
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const hasPremium = useAppStore((s) => s.hasPremium())

  const label = MODULE_LABELS[activeModule] ?? 'ChandraCycle'

  return (
    <header
      role="banner"
      className="lg:hidden sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]"
    >
      <div className="flex h-14 items-center justify-between px-3">
        {/* Left: logo + module name */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveModule('dashboard')}
          aria-label="Go to dashboard"
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 text-white font-bold shadow-md shadow-rose-500/30">
            <span className="text-base font-serif">C</span>
            <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[10px] font-medium text-muted-foreground -mb-0.5">ChandraCycle</span>
            <span className="text-sm font-semibold truncate max-w-[44vw]">{label}</span>
          </div>
        </motion.button>

        {/* Right: bell + premium crown + avatar */}
        <div className="flex items-center gap-1">
          {hasPremium ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveModule('premium')}
              aria-label="ChandraCycle Premium active"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-white shadow-sm"
            >
              <Crown className="h-4 w-4" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveModule('premium')}
              aria-label="Upgrade to ChandraCycle Premium"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300"
            >
              <Crown className="h-4 w-4" />
            </motion.button>
          )}

          {userId && <NotificationPanel userId={userId} />}

          {onTakeTour && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onTakeTour}
              aria-label="Take a guided tour"
              data-tour="replay"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-accent transition-colors"
            >
              <HelpCircle className="h-[18px] w-[18px]" />
            </motion.button>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveModule('settings')}
            aria-label="Open settings"
            data-tour="mobile-profile"
            className="ml-0.5"
          >
            <Avatar className={cn('h-10 w-10 ring-2 ring-primary/20')}>
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                U
              </AvatarFallback>
            </Avatar>
          </motion.button>
        </div>
      </div>
    </header>
  )
}
