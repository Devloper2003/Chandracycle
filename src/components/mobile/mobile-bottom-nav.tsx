'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarDays,
  MessageCircle,
  BrainCircuit,
  Grid,
  Lock,
  Crown,
  Brain,
  HeartPulse,
  Flower2,
  Baby,
  SunDim,
  Salad,
  MapPin,
  Sparkles,
  Dumbbell,
  Users,
  FileBarChart,
  ShoppingBag,
  Settings as SettingsIcon,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore, ActiveModule, PREMIUM_MODULES } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

/* ─── Module metadata (kept in sync with page.tsx navItems) ──────────────── */

type ModuleMeta = {
  id: ActiveModule
  label: string
  icon: LucideIcon
  color: string
  badge?: string
}

type ModuleGroup = {
  title: string
  items: ModuleMeta[]
}

const ALL_MODULES: ModuleGroup[] = [
  {
    title: 'Health Tracking',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-primary' },
      { id: 'period', label: 'Period Tracker', icon: CalendarDays, color: 'text-rose-500' },
      { id: 'hormone', label: 'Hormone IQ', icon: Brain, color: 'text-purple-500' },
      { id: 'symptoms', label: 'Symptoms', icon: HeartPulse, color: 'text-pink-500' },
      { id: 'pcos', label: 'PCOS Care', icon: Flower2, color: 'text-amber-600' },
      { id: 'fertility', label: 'Fertility', icon: Baby, color: 'text-orange-500' },
      { id: 'pregnancy', label: 'Pregnancy', icon: Stethoscope, color: 'text-purple-600' },
      { id: 'menopause', label: 'Menopause', icon: SunDim, color: 'text-red-400' },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { id: 'coach', label: 'AI Coach', icon: MessageCircle, color: 'text-emerald-500', badge: 'AI' },
      { id: 'diet', label: 'Diet Advisor', icon: Salad, color: 'text-emerald-600', badge: 'AI' },
      { id: 'doctors', label: 'Find Doctor', icon: MapPin, color: 'text-teal-600' },
      { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit, color: 'text-violet-500', badge: 'PRO' },
    ],
  },
  {
    title: 'Wellness',
    items: [
      { id: 'mental', label: 'Mind & Soul', icon: Sparkles, color: 'text-violet-500', badge: 'NEW' },
      { id: 'fitness', label: 'Move & Flow', icon: Dumbbell, color: 'text-orange-500', badge: 'NEW' },
      { id: 'beauty', label: 'Skin & Beauty', icon: Sparkles, color: 'text-fuchsia-500' },
      { id: 'community', label: 'Community', icon: Users, color: 'text-sky-500' },
      { id: 'marketplace', label: 'Wellness Market', icon: ShoppingBag, color: 'text-rose-500', badge: 'NEW' },
      { id: 'reports', label: 'Reports', icon: FileBarChart, color: 'text-teal-500' },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'premium', label: 'Go Premium', icon: Crown, color: 'text-amber-500', badge: 'PRO' },
      { id: 'settings', label: 'Settings', icon: SettingsIcon, color: 'text-muted-foreground' },
    ],
  },
]

/* ─── Primary tab config ─────────────────────────────────────────────────── */

type TabDef = {
  id: ActiveModule
  label: string
  icon: LucideIcon
  premium?: boolean
}

const PRIMARY_TABS: TabDef[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'period', label: 'Period', icon: CalendarDays },
  { id: 'coach', label: 'AI Coach', icon: MessageCircle, premium: true },
  { id: 'ai-insights', label: 'Insights', icon: BrainCircuit, premium: true },
]

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function MobileBottomNav() {
  const activeModule = useAppStore((s) => s.activeModule)
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const hasPremium = useAppStore((s) => s.hasPremium())
  const openPaywall = useAppStore((s) => s.openPaywall)

  const [moreOpen, setMoreOpen] = React.useState(false)

  const handleTab = (tab: TabDef) => {
    if (tab.premium && !hasPremium) {
      openPaywall(tab.id)
      toast('Premium feature', {
        description: 'Unlock AI Coach & Insights with ChandraCycle Premium.'
      })
      return
    }
    setActiveModule(tab.id)
  }

  const handleModuleFromSheet = (mod: ActiveModule) => {
    setMoreOpen(false)
    if (PREMIUM_MODULES.includes(mod) && !hasPremium && mod !== 'premium') {
      // 'premium' itself is the upgrade page — always allow.
      openPaywall(mod)
      return
    }
    setActiveModule(mod)
  }

  const moreActive = !PRIMARY_TABS.some((t) => t.id === activeModule)

  return (
    <>
      <nav
        role="navigation"
        aria-label="Primary mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      >
        <div className="relative mx-auto flex h-16 max-w-md items-stretch justify-between px-2">
          {/* 4 left tabs (Home, Period, [center FAB], Insights) split around center */}
          {PRIMARY_TABS.slice(0, 2).map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeModule === tab.id}
              premium={!!tab.premium && !hasPremium}
              onClick={() => handleTab(tab)}
              dataTour={tab.id === 'period' ? 'mobile-period' : undefined}
            />
          ))}

          {/* Center elevated FAB (AI Coach) */}
          <CenterFab
            active={activeModule === 'coach'}
            premium={tabPremiumLocked('coach', hasPremium)}
            onClick={() => handleTab(PRIMARY_TABS[2])}
            dataTour="mobile-coach"
          />

          {PRIMARY_TABS.slice(3).map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeModule === tab.id}
              premium={!!tab.premium && !hasPremium}
              onClick={() => handleTab(tab)}
            />
          ))}

          {/* More button */}
          <TabButton
            tab={{ id: 'settings', label: 'More', icon: Grid }}
            active={moreActive}
            premium={false}
            onClick={() => setMoreOpen(true)}
            dataTour="mobile-more"
          />
        </div>
      </nav>

      {/* "All Modules" sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] p-0 rounded-t-3xl border-t border-border bg-card"
        >
          <SheetHeader className="px-5 pt-4 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg">All Modules</SheetTitle>
                <SheetDescription className="text-xs">
                  Tap a module to jump straight to it
                </SheetDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {hasPremium ? 'Premium Active' : 'Free Plan'}
              </Badge>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(85vh-92px)]">
            <div className="px-5 py-4 space-y-6">
              {ALL_MODULES.map((group) => (
                <motion.section
                  key={group.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {group.items.map((item) => {
                      const locked =
                        PREMIUM_MODULES.includes(item.id) && !hasPremium && item.id !== 'premium'
                      const isActive = activeModule === item.id
                      return (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleModuleFromSheet(item.id)}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition-colors',
                            isActive
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-background hover:bg-accent'
                          )}
                        >
                          <div className="relative">
                            <item.icon
                              className={cn('h-5 w-5', isActive ? item.color : 'text-muted-foreground')}
                            />
                            {locked && (
                              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white">
                                <Lock className="h-2 w-2" />
                              </span>
                            )}
                          </div>
                          <span
                            className={cn(
                              'text-[10px] leading-tight font-medium',
                              isActive ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="absolute -top-1 -right-1 h-3.5 px-1 text-[8px] bg-primary text-primary-foreground"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.section>
              ))}

              {!hasPremium && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMoreOpen(false)
                    setActiveModule('premium')
                  }}
                  className="w-full flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 p-4 text-white shadow-lg shadow-rose-500/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold">Unlock ChandraCycle Premium</div>
                    <div className="text-[11px] text-white/90">All modules • AI tools • Ad-free</div>
                  </div>
                </motion.button>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ─── Helpers / sub-components ───────────────────────────────────────────── */

function tabPremiumLocked(id: ActiveModule, hasPremium: boolean) {
  return PREMIUM_MODULES.includes(id) && !hasPremium
}

function TabButton({
  tab,
  active,
  premium,
  onClick,
  dataTour,
}: {
  tab: TabDef
  active: boolean
  premium: boolean
  onClick: () => void
  dataTour?: string
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={tab.label}
      data-tour={dataTour}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5"
    >
      {/* Active pill indicator above icon */}
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="mobile-tab-indicator"
            className="absolute top-0 h-1 w-6 rounded-full bg-primary"
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </AnimatePresence>

      <div className="relative">
        <tab.icon
          className={cn(
            'h-[22px] w-[22px] transition-colors',
            active ? 'text-primary' : 'text-muted-foreground'
          )}
        />
        {premium && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-white ring-1 ring-card">
            <Lock className="h-1.5 w-1.5" />
          </span>
        )}
      </div>
      <span
        className={cn(
          'text-[10px] leading-none font-medium transition-colors',
          active ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {tab.label}
      </span>
    </motion.button>
  )
}

function CenterFab({
  active,
  premium,
  onClick,
  dataTour,
}: {
  active: boolean
  premium: boolean
  onClick: () => void
  dataTour?: string
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="AI Coach"
      aria-current={active ? 'page' : undefined}
      whileTap={{ scale: 0.9 }}
      data-tour={dataTour}
      className="relative flex w-16 flex-col items-center justify-end pb-1"
    >
      {/* Elevated FAB */}
      <motion.div
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 text-white shadow-lg shadow-rose-500/40 ring-4 ring-card"
      >
        {/* Glow */}
        <span className="absolute inset-0 rounded-full bg-rose-400/30 blur-md -z-10" />

        <MessageCircle className="h-6 w-6" />

        {/* Lock badge shown when user does not have premium */}
        {premium && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-card">
            <Lock className="h-2 w-2" />
          </span>
        )}

        {/* Pulse ring */}
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-rose-400"
          animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.div>

      <span
        className={cn(
          'mt-9 text-[10px] leading-none font-medium transition-colors',
          active ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        AI Coach
      </span>
    </motion.button>
  )
}
