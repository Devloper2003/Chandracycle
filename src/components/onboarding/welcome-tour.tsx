'use client'

/**
 * WelcomeTour — first-time onboarding tour for ChandraCycle.
 *
 * How it works
 * ─────────────
 * • Rendered once at the AppShell root, controlled by `open` / `onClose`.
 * • Walks the user through 9 steps (welcome → sidebar → dashboard → period →
 *   coach → symptoms → profile → premium → done).
 * • Each step has an optional `targetSelector` (CSS selector) for an element
 *   to spotlight. When found, a "cutout" is drawn around it using the
 *   `box-shadow: 0 0 0 9999px rgba(0,0,0,.72)` trick on a positioned div.
 * • The tooltip card is positioned next to the cutout (top/bottom/left/right)
 *   or centered on screen for intro/outro steps.
 * • Resilient — if a target isn't found (e.g. on mobile where the desktop
 *   sidebar is hidden), the step falls back to a centered modal with the
 *   mobile-specific copy. The tour never throws.
 * • Mobile-aware — uses window.innerWidth < 1024 to detect mobile and swaps
 *   in alternative targets (MobileTopbar avatar, MobileBottomNav grid/Coach
 *   FAB) and shorter, mobile-appropriate copy.
 * • Stores the "seen" flag in localStorage at `chandracycle_tour_seen` —
 *   AppShell calls onClose which sets the flag; Settings can clear it to
 *   replay. The "Take Tour" button in the sidebar/mobile topbar reopens the
 *   tour without touching the seen flag.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface TourStep {
  id: string
  title: string
  body: string
  /** CSS selector for the element to spotlight. null = centered modal. */
  targetSelector: string | null
  placement: TourPlacement
  /** Optional emoji/icon badge shown on the gradient header. */
  emoji?: string
  /** Override body copy shown when running on mobile. */
  mobileBody?: string
  /** Override target selector used on mobile (null = no spotlight, centered). */
  mobileTargetSelector?: string | null
  /** Override placement on mobile. */
  mobilePlacement?: TourPlacement
}

/** localStorage key — shared with Settings "Replay tour" button. */
export const TOUR_SEEN_KEY = 'chandracycle_tour_seen'

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ChandraCycle',
    body: "Your AI-powered women's health companion. Let's take a quick 60-second tour to show you around — you can skip any time.",
    targetSelector: null,
    placement: 'center',
    emoji: '🌙',
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar',
    body: 'Browse all 18+ health modules here — Period Tracker, AI Coach, Fertility, PCOS, Pregnancy, Menopause and more. Click any item to switch modules instantly.',
    targetSelector: 'aside',
    placement: 'right',
    emoji: '🧭',
    mobileBody:
      'On mobile, tap the "More" grid icon in the bottom navigation to browse all 18+ health modules in one place.',
    mobileTargetSelector: '[data-tour="mobile-more"]',
    mobilePlacement: 'top',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    body: 'Your daily health snapshot lives here — cycle status, quick stats, AI insights, and reminders. This is your home base.',
    targetSelector: 'main',
    placement: 'left',
    emoji: '📊',
    mobileBody:
      'Your daily health snapshot lives here — cycle status, quick stats, AI insights, and reminders. This is your home base.',
  },
  {
    id: 'period',
    title: 'Log Your Period',
    body: 'Tap here to log your period. Once you log your first period, ChandraCycle predicts ovulation, fertile windows, and your next period automatically. This is the most important first step!',
    targetSelector: '[data-tour="period"]',
    placement: 'right',
    emoji: '🩸',
    mobileBody:
      'Tap the "Period" tab in the bottom navigation to log your cycle. Once logged, ChandraCycle predicts ovulation, fertile windows, and your next period automatically — this is the most important first step!',
    mobileTargetSelector: '[data-tour="mobile-period"]',
    mobilePlacement: 'top',
  },
  {
    id: 'coach',
    title: 'AI Health Coach',
    body: 'Your AI Health Coach is available 24/7. Ask about symptoms, diet, mood, fertility — anything. Tap here to start chatting.',
    targetSelector: '[data-tour="coach"]',
    placement: 'right',
    emoji: '💬',
    mobileBody:
      'Tap the floating pink AI Coach button to start chatting — your AI Health Coach is available 24/7 for cycle questions, symptom analysis, diet tips, and emotional support.',
    mobileTargetSelector: '[data-tour="mobile-coach"]',
    mobilePlacement: 'top',
  },
  {
    id: 'symptoms',
    title: 'Track Daily Symptoms',
    body: 'Log your mood, energy, sleep, water intake, and physical symptoms daily. ChandraCycle uses this to find patterns in your cycle.',
    targetSelector: '[data-tour="symptoms"]',
    placement: 'right',
    emoji: '💓',
    mobileBody:
      'Open the "More" menu and tap "Symptoms" to log your mood, energy, sleep, water intake, and physical symptoms daily. ChandraCycle uses this to find patterns in your cycle.',
    mobileTargetSelector: null,
    mobilePlacement: 'center',
  },
  {
    id: 'profile',
    title: 'Your Profile & Settings',
    body: 'Tap your avatar to access settings, manage your subscription, view your profile, or sign out. You can also replay this tour from Settings any time.',
    targetSelector: '[data-tour="profile"]',
    placement: 'bottom',
    emoji: '👤',
    mobileBody:
      'Tap your avatar in the top bar to access settings, manage your subscription, view your profile, or sign out. You can also replay this tour from Settings any time.',
    mobileTargetSelector: '[data-tour="mobile-profile"]',
    mobilePlacement: 'bottom',
  },
  {
    id: 'premium',
    title: 'Go Premium',
    body: 'Unlock advanced insights, unlimited AI coaching, all health modules, and an ad-free experience. Tap "Go Premium" to see what\'s included.',
    targetSelector: '[data-tour="premium"]',
    placement: 'top',
    emoji: '👑',
    mobileBody:
      'Open the "More" menu and tap "Unlock ChandraCycle Premium" for advanced insights, unlimited AI coaching, and an ad-free experience.',
    mobileTargetSelector: null,
    mobilePlacement: 'center',
  },
  {
    id: 'done',
    title: "You're all set!",
    body: "That's it! Start by logging your first period from the Period Tracker, then explore other modules as you go. Your data stays private and end-to-end encrypted. 💖",
    targetSelector: null,
    placement: 'center',
    emoji: '🎉',
  },
]

interface WelcomeTourProps {
  open: boolean
  onClose: () => void
}

export default function WelcomeTour({ open, onClose }: WelcomeTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const rafRef = useRef<number | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── SSR-safe mount flag (matches the pattern used in settings.tsx) ─────────
  // Returns false during SSR/initial render, then true on the client. This
  // avoids hydration mismatches when reading window/localStorage.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [mounted])

  // ── Reset to step 0 whenever tour opens ───────────────────────────────────
  // Done via a key prop on the parent (<WelcomeTour key={open ? 'on' : 'off'}>)
  // so React remounts the component with fresh state — no setState-in-effect.

  const currentStep = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0]

  // ── Resolve the active step's config, accounting for mobile fallback ──────
  const resolveStep = useCallback(
    (step: TourStep) => {
      const onMobile = isMobile
      const selector =
        onMobile && step.mobileTargetSelector !== undefined
          ? step.mobileTargetSelector
          : step.targetSelector
      const placement =
        onMobile && step.mobilePlacement
          ? step.mobilePlacement
          : step.placement
      const body =
        onMobile && step.mobileBody ? step.mobileBody : step.body
      return { selector, placement, body }
    },
    [isMobile],
  )

  const { selector: activeSelector, placement: activePlacement, body: activeBody } =
    resolveStep(currentStep)

  // ── Measure the target element ────────────────────────────────────────────
  const measure = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!open) return
      if (!activeSelector) {
        setRect(null)
        return
      }
      const el = document.querySelector<HTMLElement>(activeSelector)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      // If the element is meaningfully off-screen, scroll it into view first
      // and re-measure once the scroll settles.
      const margin = 80
      const offscreen =
        r.top < margin ||
        r.bottom > window.innerHeight - margin ||
        r.left < margin ||
        r.right > window.innerWidth - margin
      if (offscreen) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = setTimeout(() => {
          const el2 = document.querySelector<HTMLElement>(activeSelector)
          if (el2) {
            const r2 = el2.getBoundingClientRect()
            // Treat zero-size / hidden elements as "no spotlight"
            if (r2.width > 4 && r2.height > 4) setRect(r2)
            else setRect(null)
          } else {
            setRect(null)
          }
        }, 380)
        return
      }
      if (r.width > 4 && r.height > 4) setRect(r)
      else setRect(null)
    })
  }, [open, activeSelector])

  // Re-measure on step change / open / mobile change
  useEffect(() => {
    if (!open) return
    measure()
  }, [open, stepIndex, isMobile, measure])

  // Listen to scroll & resize to keep the spotlight glued to its target
  useEffect(() => {
    if (!open) return
    const handler = () => measure()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    // Periodic re-measure catches sidebar collapse / module animation settle.
    const interval = setInterval(measure, 700)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
      clearInterval(interval)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [open, measure])

  // ── Controls ──────────────────────────────────────────────────────────────
  if (!mounted || !open) return null

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) setStepIndex((i) => i + 1)
    else onClose()
  }
  const handleBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }
  const handleSkip = () => {
    onClose()
  }

  // ── Tooltip placement math ────────────────────────────────────────────────
  const CARD_WIDTH = 360
  const CARD_MAX_HEIGHT = 280
  const GAP = 16
  const edge = 16

  const tooltipStyle: React.CSSProperties = rect
    ? (() => {
        const style: React.CSSProperties = {
          position: 'fixed',
          width: CARD_WIDTH,
          maxWidth: `calc(100vw - ${edge * 2}px)`,
          zIndex: 62,
        }
        switch (activePlacement) {
          case 'top': {
            style.top = Math.max(edge, rect.top - CARD_MAX_HEIGHT - GAP)
            const proposedLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2
            style.left = Math.min(
              Math.max(edge, proposedLeft),
              window.innerWidth - CARD_WIDTH - edge,
            )
            break
          }
          case 'bottom': {
            style.top = rect.bottom + GAP
            const proposedLeft = rect.left + rect.width / 2 - CARD_WIDTH / 2
            style.left = Math.min(
              Math.max(edge, proposedLeft),
              window.innerWidth - CARD_WIDTH - edge,
            )
            break
          }
          case 'left': {
            style.left = Math.max(edge, rect.left - CARD_WIDTH - GAP)
            const proposedTop = rect.top + rect.height / 2 - CARD_MAX_HEIGHT / 2
            style.top = Math.min(
              Math.max(edge, proposedTop),
              window.innerHeight - CARD_MAX_HEIGHT - edge,
            )
            break
          }
          case 'right': {
            style.left = Math.min(
              window.innerWidth - CARD_WIDTH - edge,
              rect.right + GAP,
            )
            const proposedTop = rect.top + rect.height / 2 - CARD_MAX_HEIGHT / 2
            style.top = Math.min(
              Math.max(edge, proposedTop),
              window.innerHeight - CARD_MAX_HEIGHT - edge,
            )
            break
          }
          default: {
            style.top = '50%'
            style.left = '50%'
            style.transform = 'translate(-50%, -50%)'
            style.width = 'min(92vw, 440px)'
          }
        }
        return style
      })()
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(92vw, 440px)',
        zIndex: 62,
      }

  const isFirst = stepIndex === 0
  const isLast = stepIndex === TOUR_STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="ChandraCycle onboarding tour"
    >
      {/* ── Dark overlay (when no spotlight is active) ─────────────────────── */}
      {!rect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/72 backdrop-blur-[2px]"
        />
      )}

      {/* ── Spotlight highlighter (box-shadow cutout trick) ────────────────── */}
      <AnimatePresence>
        {rect && (
          <motion.div
            key={currentStep.id + '-spot'}
            initial={false}
            animate={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed',
              borderRadius: 14,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
              pointerEvents: 'none',
              zIndex: 61,
            }}
            className="ring-2 ring-amber-400/80 ring-offset-0"
          />
        )}
      </AnimatePresence>

      {/* ── Tooltip card ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -10 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          style={tooltipStyle}
        >
          <Card className="overflow-hidden border-amber-300/40 shadow-2xl shadow-rose-500/20">
            {/* Gradient header */}
            <div className="relative bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 p-4 text-white">
              <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/15 blur-2xl pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentStep.emoji && (
                    <span className="text-base leading-none" aria-hidden>
                      {currentStep.emoji}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/90">
                    Step {stepIndex + 1} of {TOUR_STEPS.length}
                  </span>
                </div>
                <button
                  onClick={handleSkip}
                  aria-label="Skip tour"
                  className="rounded-full p-1 hover:bg-white/25 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h3 className="relative text-lg font-bold mt-1.5 leading-tight">
                {currentStep.title}
              </h3>
            </div>

            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeBody}
              </p>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mt-4">
                {TOUR_STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setStepIndex(i)}
                    aria-label={`Go to step ${i + 1}: ${s.title}`}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === stepIndex
                        ? 'w-6 bg-gradient-to-r from-amber-500 to-rose-500'
                        : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                    )}
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between mt-4 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip tour
                </Button>
                <div className="flex items-center gap-1.5">
                  {!isFirst && (
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                      <ChevronLeft className="h-4 w-4 mr-0.5" />
                      Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 text-white border-0 hover:opacity-90 shadow-md shadow-rose-500/30"
                  >
                    {isLast ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Get started
                      </>
                    ) : isFirst ? (
                      <>
                        Start tour
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isLast && (
                <p className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                  <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                  Made with care for women everywhere
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Subtle floating sparkle in the corner of centered steps for polish */}
      {!rect && !isLast && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-6 right-6 text-amber-300/60 pointer-events-none"
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>
      )}
    </div>
  )
}
