'use client'

import dynamic from 'next/dynamic'
import { useAppStore, ActiveModule } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  Brain,
  HeartPulse,
  Flower2,
  Baby,
  Stethoscope,
  SunDim,
  MessageCircle,
  Salad,
  MapPin,
  Dumbbell,
  Users,
  FileBarChart,
  Settings,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Search,
  ShoppingBag,
  BrainCircuit,
  LogOut,
  Loader2,
  Crown,
  Gem,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { SessionUser } from '@/components/auth/auth-screen'
import NotificationPanel from '@/components/notifications/notification-panel'
import MobileTopbar from '@/components/mobile/mobile-topbar'
import MobileBottomNav from '@/components/mobile/mobile-bottom-nav'
import WelcomeTour, { TOUR_SEEN_KEY } from '@/components/onboarding/welcome-tour'

// ─── Lazy-load all feature modules ───────────────────────────────────────────
const DashboardModule = dynamic(() => import('@/components/modules/dashboard'), { loading: () => <ModuleSkeleton /> })
const PeriodModule = dynamic(() => import('@/components/modules/period-tracker'), { loading: () => <ModuleSkeleton /> })
const HormoneModule = dynamic(() => import('@/components/modules/hormone-intelligence'), { loading: () => <ModuleSkeleton /> })
const SymptomsModule = dynamic(() => import('@/components/modules/symptoms-tracker'), { loading: () => <ModuleSkeleton /> })
const PCOSModule = dynamic(() => import('@/components/modules/pcos-management'), { loading: () => <ModuleSkeleton /> })
const FertilityModule = dynamic(() => import('@/components/modules/fertility-planner'), { loading: () => <ModuleSkeleton /> })
const PregnancyModule = dynamic(() => import('@/components/modules/pregnancy-companion'), { loading: () => <ModuleSkeleton /> })
const MenopauseModule = dynamic(() => import('@/components/modules/menopause-assistant'), { loading: () => <ModuleSkeleton /> })
const CoachModule = dynamic(() => import('@/components/modules/ai-coach'), { loading: () => <ModuleSkeleton /> })
const DietAdvisorModule = dynamic(() => import('@/components/modules/diet-advisor'), { loading: () => <ModuleSkeleton /> })
const DoctorFinderModule = dynamic(() => import('@/components/modules/doctor-finder'), { loading: () => <ModuleSkeleton /> })
const MentalWellnessModule = dynamic(() => import('@/components/modules/mental-wellness'), { loading: () => <ModuleSkeleton /> })
const FitnessModule = dynamic(() => import('@/components/modules/fitness'), { loading: () => <ModuleSkeleton /> })
const MarketplaceModule = dynamic(() => import('@/components/modules/marketplace'), { loading: () => <ModuleSkeleton /> })
const CommunityModule = dynamic(() => import('@/components/modules/community'), { loading: () => <ModuleSkeleton /> })
const ReportsModule = dynamic(() => import('@/components/modules/report-center'), { loading: () => <ModuleSkeleton /> })
const SkinBeautyModule = dynamic(() => import('@/components/modules/skin-beauty'), { loading: () => <ModuleSkeleton /> })
const AIInsightsModule = dynamic(() => import('@/components/modules/ai-insights'), { loading: () => <ModuleSkeleton /> })
const PremiumModule = dynamic(() => import('@/components/modules/premium'), { loading: () => <ModuleSkeleton /> })
const SettingsModule = dynamic(() => import('@/components/modules/settings'), { loading: () => <ModuleSkeleton /> })

function ModuleSkeleton() {
  return (
    <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">Loading module…</span>
    </div>
  )
}

const navItems: { id: ActiveModule; label: string; icon: React.ElementType; color: string; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-primary' },
  { id: 'period', label: 'Period Tracker', icon: CalendarDays, color: 'text-rose-500' },
  { id: 'hormone', label: 'Hormone IQ', icon: Brain, color: 'text-purple-500' },
  { id: 'symptoms', label: 'Symptoms', icon: HeartPulse, color: 'text-pink-500' },
  { id: 'pcos', label: 'PCOS Care', icon: Flower2, color: 'text-amber-600' },
  { id: 'fertility', label: 'Fertility', icon: Baby, color: 'text-orange-500' },
  { id: 'pregnancy', label: 'Pregnancy', icon: Stethoscope, color: 'text-purple-600' },
  { id: 'menopause', label: 'Menopause', icon: SunDim, color: 'text-red-400' },
  { id: 'coach', label: 'AI Coach', icon: MessageCircle, color: 'text-emerald-500', badge: 'AI' },
  { id: 'diet', label: 'Diet Advisor', icon: Salad, color: 'text-emerald-600', badge: 'AI' },
  { id: 'doctors', label: 'Find Doctor', icon: MapPin, color: 'text-teal-600' },
  { id: 'mental', label: 'Mind & Soul', icon: Sparkles, color: 'text-violet-500', badge: 'NEW' },
  { id: 'fitness', label: 'Move & Flow', icon: Dumbbell, color: 'text-orange-500', badge: 'NEW' },
  { id: 'beauty', label: 'Skin & Beauty', icon: Sparkles, color: 'text-fuchsia-500' },
  { id: 'marketplace', label: 'Wellness Market', icon: ShoppingBag, color: 'text-rose-500', badge: 'NEW' },
  { id: 'community', label: 'Community', icon: Users, color: 'text-sky-500' },
  { id: 'reports', label: 'Reports', icon: FileBarChart, color: 'text-teal-500' },
  { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit, color: 'text-violet-500', badge: 'PRO' },
]

interface AppShellProps {
  user: SessionUser
  onLogout: () => void
}

export default function AppShell({ user, onLogout }: AppShellProps) {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen, setPremium, setUserProfile } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [tourOpen, setTourOpen] = useState(false)

  // Sync auth user into the global store
  useEffect(() => {
    setUserProfile({
      id: user.id,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      avatar: user.avatar || undefined,
      cycleLength: user.cycleLength,
      periodLength: user.periodLength,
      lastPeriodStart: user.lastPeriodStart ?? null,
      provider: user.provider as 'email' | 'google' | 'apple',
    })
  }, [user, setUserProfile])

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  // ── Auto-start first-time onboarding tour ────────────────────────────────
  // Only fires once per browser (until the user clears the flag from Settings).
  useEffect(() => {
    if (typeof window === 'undefined') return
    let seen = false
    try {
      seen = localStorage.getItem(TOUR_SEEN_KEY) === '1'
    } catch {
      // localStorage may be disabled (private mode) — skip auto-start.
      seen = true
    }
    if (seen) return
    const timer = setTimeout(() => {
      setTourOpen(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const closeTour = () => {
    setTourOpen(false)
    try {
      localStorage.setItem(TOUR_SEEN_KEY, '1')
    } catch {
      // ignore — best-effort persistence
    }
  }

  const activeItem = navItems.find(item => item.id === activeModule)

  const handleNavClick = (id: ActiveModule) => {
    setActiveModule(id)
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardModule />
      case 'period': return <PeriodModule />
      case 'hormone': return <HormoneModule />
      case 'symptoms': return <SymptomsModule />
      case 'pcos': return <PCOSModule />
      case 'fertility': return <FertilityModule />
      case 'pregnancy': return <PregnancyModule />
      case 'menopause': return <MenopauseModule />
      case 'coach': return <CoachModule />
      case 'diet': return <DietAdvisorModule />
      case 'doctors': return <DoctorFinderModule />
      case 'mental': return <MentalWellnessModule />
      case 'fitness': return <FitnessModule />
      case 'beauty': return <SkinBeautyModule />
      case 'marketplace': return <MarketplaceModule />
      case 'community': return <CommunityModule />
      case 'reports': return <ReportsModule />
      case 'ai-insights': return <AIInsightsModule />
      case 'premium': return <PremiumModule onSubscribe={() => setPremium(true)} />
      case 'settings': return <SettingsModule />
      default: return <DashboardModule />
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const displayName = user.name || user.email.split('@')[0]
  const initials = displayName.charAt(0).toUpperCase()
  const firstName = displayName.split(' ')[0]

  // Desktop: sidebar width + collapse. Mobile uses MobileTopbar + MobileBottomNav.
  const desktopMainMargin = sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-dvh flex bg-background overflow-hidden">
        {/* ─── Desktop Sidebar (lg+ only) ────────────────────────────────── */}
        <aside
          className={cn(
            'hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0',
            sidebarOpen ? 'w-64' : 'w-[72px]'
          )}
        >
          {/* Logo Area — Luxury brand */}
          <div className="relative flex items-center gap-3 px-4 py-5 border-b border-border overflow-hidden h-[68px]">
            {/* Decorative gold shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-rose-500/5 to-transparent pointer-events-none" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 text-white font-bold text-lg shrink-0 shadow-lg shadow-rose-500/30">
              <span className="relative">C</span>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-card" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex flex-col overflow-hidden"
                >
                  <span className="font-serif text-base tracking-tight bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent font-bold leading-none">
                    ChandraCycle
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80 leading-tight mt-0.5 font-medium">
                    AI Health Companion
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation — native scroll with custom scrollbar */}
          <nav className="flex-1 overflow-y-auto chandracycle-scroll py-3 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeModule === item.id
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      data-tour={
                        item.id === 'period'
                          ? 'period'
                          : item.id === 'coach'
                            ? 'coach'
                            : item.id === 'symptoms'
                              ? 'symptoms'
                              : undefined
                      }
                      className={cn(
                        'relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-110', isActive ? item.color : '')} />
                      <AnimatePresence>
                        {sidebarOpen && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {item.badge && sidebarOpen && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary">
                          {item.badge}
                        </Badge>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-amber-500 to-rose-500"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  {!sidebarOpen && (
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>

          {/* Bottom section — tour, premium + settings */}
          <div className="border-t border-border p-3 space-y-1.5">
            <button
              onClick={() => setTourOpen(true)}
              data-tour="replay"
              aria-label="Take a guided tour"
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <HelpCircle className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Take Tour</span>}
            </button>
            <button
              onClick={() => handleNavClick('premium')}
              data-tour="premium"
              className="group relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Crown className="h-5 w-5 shrink-0 relative" />
              {sidebarOpen && (
                <span className="flex items-center gap-1.5 relative">
                  Go Premium
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-white/25 text-white border-0">PRO</Badge>
                </span>
              )}
            </button>
            <button
              onClick={() => handleNavClick('settings')}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>Settings</span>}
            </button>
          </div>
        </aside>

        {/* ─── Main Content ───────────────────────────────────────────────── */}
        <div className={cn('flex-1 min-w-0 flex flex-col h-full transition-all duration-300 ease-in-out', desktopMainMargin)}>
          {/* Desktop Top Bar (lg+ only) — luxury glass header */}
          <header className="hidden lg:flex shrink-0 z-30 items-center justify-between gap-4 border-b border-border bg-card/70 backdrop-blur-xl px-6 py-3 relative">
            {/* Subtle top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="shrink-0"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                {/* Compact greeting on lg, full greeting on xl */}
                <span className="text-sm font-medium truncate hidden xl:inline">{getGreeting()}, {firstName}</span>
                <span className="text-sm font-medium truncate xl:hidden">Hi, {firstName}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden xl:inline" />
                <span className="text-sm text-muted-foreground truncate hidden xl:inline">{activeItem?.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative hidden xl:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-56 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
              <span className="text-xs text-muted-foreground hidden 2xl:block tabular-nums">{currentTime}</span>

              {/* Active notification bar */}
              <NotificationPanel userId={user.id} />

              {/* Profile dropdown with brand presence */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-tour="profile"
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-transform hover:scale-105"
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-amber-500/30 ring-offset-1 ring-offset-background">
                      {user.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
                      <AvatarFallback className="bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
                  {/* Brand header inside profile dropdown */}
                  <div className="relative px-4 py-4 bg-gradient-to-br from-amber-500 via-rose-500 to-fuchsia-600 text-white overflow-hidden">
                    <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 font-bold text-base">
                        C
                      </div>
                      <div className="flex flex-col">
                        <span className="font-serif font-bold text-base leading-tight tracking-tight">ChandraCycle</span>
                        <span className="text-[9px] uppercase tracking-[0.18em] text-white/80 leading-tight">Premium Health</span>
                      </div>
                    </div>
                  </div>

                  {/* User identity */}
                  <div className="px-3 py-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-10 w-10 ring-1 ring-border">
                        {user.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-0 text-[10px] h-5 gap-0.5">
                        {user.provider === 'google' ? <Gem className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
                        {user.provider === 'google' ? 'Google' : user.provider === 'apple' ? 'Apple' : user.provider === 'mobile' ? 'Mobile' : 'Email'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">Member since {new Date().getFullYear()}</span>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <DropdownMenuItem onClick={() => handleNavClick('settings')} className="rounded-lg py-2">
                      <Settings className="mr-2.5 h-4 w-4" />
                      <span>Settings & Preferences</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavClick('premium')} className="rounded-lg py-2">
                      <Crown className="mr-2.5 h-4 w-4 text-amber-500" />
                      <span>Upgrade to Premium</span>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-1.5">
                    <DropdownMenuItem onClick={onLogout} className="rounded-lg py-2 text-destructive focus:text-destructive">
                      <LogOut className="mr-2.5 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Mobile Topbar (below lg) */}
          <MobileTopbar onTakeTour={() => setTourOpen(true)} />

          {/* Module Content — scrollable. Bottom padding on mobile for bottom nav. */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8 pb-28 lg:pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModule}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {renderModule()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* ─── Mobile Bottom Nav (below lg) ──────────────────────────────── */}
        <MobileBottomNav />

        {/* ─── First-time onboarding tour ──────────────────────────────────── */}
        <WelcomeTour
          key={tourOpen ? 'tour-open' : 'tour-closed'}
          open={tourOpen}
          onClose={closeTour}
        />
      </div>
    </TooltipProvider>
  )
}
