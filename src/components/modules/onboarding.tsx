'use client'

/**
 * ChandraCycle Onboarding — simplified, calm, conversational.
 *
 * Design philosophy: "itne option hain ki user confused ho jayega" → cut the
 * noise. We ask only two real questions in a friendly tone:
 *
 *   Step 1 — Welcome          (brand intro + 3 highlights)
 *   Step 2 — Last period date (with friendly "I'm not sure / Skip")
 *   Step 3 — Main goal        (single-select, 6 big tappable cards)
 *   Step 4 — Celebration      (Confetti + Enter ChandraCycle)
 *
 * Smart defaults handle everything else so the user is never blocked:
 *   • Cycle length     → 28 days (auto-learned from logged cycles over time)
 *   • Period length    → 5 days  (auto-learned from logged cycles over time)
 *   • Notifications    → Period reminders + Ovulation alerts enabled silently
 *   • Conditions       → Inferred from goal (e.g. "Manage PCOS" → ['pcos'])
 *   • Name / Email / DOB / Height / Weight → already collected at signup or
 *     editable later in Settings — never asked here.
 *
 * The OnboardingData interface is preserved for backward compatibility with
 * the backend POST `/api/user` route (which expects cycleLength,
 * periodLength, lastPeriodStart, etc.). The default export signature stays
 * `Onboarding({ onComplete })` so any caller keeps working.
 *
 * Progress indicator: "Step X of 3" covers the three content steps
 * (Welcome → Last Period → Goal). Celebration is the "done" state and shows
 * no progress bar.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Brain,
  Sparkles,
  Activity,
  Baby,
  Flower2,
  Moon,
  SmilePlus,
  CheckCircle2,
  PartyPopper,
  HelpCircle,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OnboardingData {
  name: string
  email: string
  dateOfBirth: string
  lastPeriodStart: string
  cycleLength: number
  periodLength: number
  goals: string[]
  height: string
  weight: string
  conditions: string[]
  notifications: {
    periodReminders: boolean
    ovulationAlerts: boolean
    moodCheckin: boolean
    fertilityWindow: boolean
    medicationReminders: boolean
    weeklyInsights: boolean
  }
}

/** Total visible steps in the flow (Welcome → Period → Goal → Celebration). */
const TOTAL_STEPS = 4
/** Number of steps shown in the progress indicator (excludes Celebration). */
const PROGRESS_STEPS = 3

// ─── Per-step background gradients ───────────────────────────────────────────

const STEP_GRADIENTS: Record<number, string> = {
  1: 'from-rose-50 via-pink-100 to-fuchsia-100',
  2: 'from-pink-100 via-rose-50 to-rose-100',
  3: 'from-rose-100 via-pink-100 to-purple-100',
  4: 'from-fuchsia-100 via-rose-200 to-pink-200',
}

const STEP_GRADIENTS_DARK: Record<number, string> = {
  1: 'dark:from-rose-950/60 dark:via-pink-950/50 dark:to-fuchsia-950/60',
  2: 'dark:from-pink-950/60 dark:via-rose-950/50 dark:to-rose-950/60',
  3: 'dark:from-rose-950/60 dark:via-pink-950/50 dark:to-purple-950/60',
  4: 'dark:from-fuchsia-950/70 dark:via-rose-950/60 dark:to-pink-950/60',
}

// ─── Goal definitions (6 most-common goals; single-select) ───────────────────

const GOAL_OPTIONS: { id: string; label: string; description: string; icon: React.ElementType; tint: string }[] = [
  { id: 'period', label: 'Track my period', description: 'Monitor cycles & predictions', icon: CalendarDays, tint: 'from-rose-400 to-pink-500' },
  { id: 'fertility', label: 'Get pregnant', description: 'Track fertility & ovulation', icon: Baby, tint: 'from-orange-400 to-rose-500' },
  { id: 'pcos', label: 'Manage PCOS', description: 'Track & improve PCOS symptoms', icon: Flower2, tint: 'from-amber-400 to-pink-500' },
  { id: 'hormones', label: 'Understand my hormones', description: 'Decode your hormone cycle', icon: Brain, tint: 'from-purple-400 to-fuchsia-500' },
  { id: 'wellness', label: 'Better wellness', description: 'Mood, sleep & self-care', icon: SmilePlus, tint: 'from-pink-400 to-rose-500' },
  { id: 'menopause', label: 'Navigate menopause', description: 'Smooth this transition', icon: Moon, tint: 'from-rose-400 to-red-500' },
]

/** Goals that imply a known health condition (used for smart inference). */
const GOAL_TO_CONDITION: Record<string, string> = {
  pcos: 'pcos',
}

// ─── Floating background orbs ────────────────────────────────────────────────

function FloatingOrbs() {
  const orbs = [
    { size: 280, top: '-5%', left: '-8%', delay: 0, color: 'bg-rose-300/30' },
    { size: 220, top: '60%', left: '70%', delay: 1.2, color: 'bg-fuchsia-300/30' },
    { size: 180, top: '75%', left: '5%', delay: 0.6, color: 'bg-pink-300/30' },
    { size: 160, top: '10%', left: '80%', delay: 1.8, color: 'bg-purple-300/25' },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={cn('absolute rounded-full blur-3xl', orb.color)}
          style={{ width: orb.size, height: orb.size, top: orb.top, left: orb.left }}
          animate={{
            y: [0, -25, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + i,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Animated checkmark for celebration ──────────────────────────────────────

function CelebrationBurst() {
  const particles = Array.from({ length: 14 }, (_, i) => i)
  const colors = ['#f43f5e', '#ec4899', '#d946ef', '#f97316', '#fbbf24']
  return (
    <div className="relative h-32 w-32 mx-auto">
      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute inset-0 rounded-full border-2 border-rose-400/40"
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
      {/* Center badge */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 shadow-2xl shadow-rose-500/40"
      >
        <CheckCircle2 className="h-16 w-16 text-white" strokeWidth={2.5} />
      </motion.div>
      {/* Confetti particles */}
      {particles.map((i) => {
        const angle = (i / particles.length) * Math.PI * 2
        const distance = 90 + Math.random() * 30
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance
        return (
          <motion.div
            key={`p-${i}`}
            className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full"
            style={{ backgroundColor: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.3 }}
            transition={{
              duration: 1.4,
              delay: 0.3 + (i % 7) * 0.05,
              repeat: Infinity,
              repeatDelay: 1.2,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Step content components ─────────────────────────────────────────────────

type StepProps = {
  data: OnboardingData
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>
  onNext: () => void
  onBack: () => void
}

function StepWelcome({ onNext }: StepProps) {
  const features = [
    { icon: Activity, title: 'Track your cycle with AI precision', desc: 'Predictions tuned to your unique rhythm' },
    { icon: Brain, title: 'Understand your hormones', desc: 'Decode the four phases of your cycle' },
    { icon: Sparkles, title: 'Get personalized insights', desc: 'Daily guidance crafted just for you' },
  ]
  return (
    <div className="flex flex-col items-center text-center w-full max-w-md">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500 blur-2xl opacity-50" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 shadow-xl shadow-rose-500/40">
          <span className="text-5xl font-serif font-bold text-white">C</span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-3"
      >
        <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
          Welcome to ChandraCycle
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-base sm:text-lg text-muted-foreground mb-10 max-w-sm"
      >
        Your AI-powered women&apos;s health companion
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } } }}
        className="w-full space-y-3 mb-10"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={{
              hidden: { opacity: 0, x: -20 },
              show: { opacity: 1, x: 0 },
            }}
            className="flex items-center gap-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 p-4 shadow-sm text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/15 to-fuchsia-500/15 text-rose-600 dark:text-rose-400">
              <feature.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">{feature.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full"
      >
        <Button
          onClick={onNext}
          size="lg"
          className="w-full h-12 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 text-white font-semibold text-base shadow-lg shadow-rose-500/30 border-0"
        >
          Let&apos;s get started
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  )
}

/**
 * Step 2 — "When did your last period start?"
 * Friendly date picker with a prominent "I'm not sure / Skip" button.
 * Skipping leaves lastPeriodStart empty so the dashboard shows the
 * "Log your first period" empty state (no fake cycle).
 */
function StepLastPeriod({ data, setData, onNext, onBack }: StepProps) {
  const today = new Date().toISOString().split('T')[0]
  const canContinue = data.lastPeriodStart !== ''

  const handleSkip = () => {
    // Leave lastPeriodStart empty — the user doesn't know / doesn't want to
    // say. The dashboard will show the friendly "Log your first period" empty
    // state instead of a fake cycle computed from a default date. The user can
    // log their real period any time from the Period Tracker.
    onNext()
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <StepHeader
        eyebrow="Step 2 of 3"
        title="When did your last period start?"
        subtitle="Use the first day of your most recent period"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full mt-8"
      >
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-500" />
          <Input
            id="lastPeriod"
            type="date"
            value={data.lastPeriodStart}
            onChange={(e) => setData((d) => ({ ...d, lastPeriodStart: e.target.value }))}
            max={today}
            autoFocus
            className="h-16 rounded-2xl bg-white/80 dark:bg-white/5 border-2 border-white/60 dark:border-white/10 backdrop-blur text-lg font-medium pl-12 shadow-sm"
          />
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center px-2 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-rose-400" />
          This helps us predict your next period, ovulation, and fertile window.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full mt-5"
      >
        <button
          type="button"
          onClick={handleSkip}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur border border-white/50 dark:border-white/10 px-5 py-3 text-sm font-medium text-rose-600 dark:text-rose-300 hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          I&apos;m not sure — skip this step
        </button>
      </motion.div>

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        canContinue={canContinue}
        nextLabel="Continue"
      />
    </div>
  )
}

/**
 * Step 3 — "What's your main goal?"
 * Single-select: tap a card to highlight it, tap again (or Continue) to proceed.
 * Selecting a goal also infers any underlying condition (e.g. PCOS).
 */
function StepGoal({ data, setData, onNext, onBack }: StepProps) {
  const selectedGoal = data.goals[0]
  const canContinue = !!selectedGoal

  const handleSelect = (id: string) => {
    // If the same card is tapped again, treat it as "proceed".
    if (selectedGoal === id) {
      onNext()
      return
    }
    // Otherwise update selection + infer conditions silently.
    const conditionId = GOAL_TO_CONDITION[id]
    setData((d) => ({
      ...d,
      goals: [id],
      conditions: conditionId ? [conditionId] : [],
    }))
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <StepHeader
        eyebrow="Step 3 of 3"
        title="What's your main goal?"
        subtitle="Pick the one that matters most right now"
      />

      <div className="grid sm:grid-cols-2 gap-3 mt-8 w-full">
        {GOAL_OPTIONS.map((goal, i) => {
          const selected = selectedGoal === goal.id
          return (
            <motion.button
              key={goal.id}
              type="button"
              onClick={() => handleSelect(goal.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={selected}
              className={cn(
                'group relative flex items-start gap-3 rounded-2xl p-4 text-left transition-all border backdrop-blur-xl',
                selected
                  ? 'bg-white/85 dark:bg-white/10 border-rose-400 shadow-md shadow-rose-500/10 ring-2 ring-rose-300/40'
                  : 'bg-white/50 dark:bg-white/5 border-white/40 dark:border-white/10 hover:border-rose-300'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                  goal.tint
                )}
              >
                <goal.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground">{goal.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
              </div>
              <motion.div
                initial={false}
                animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </motion.div>
            </motion.button>
          )
        })}
      </div>

      {selectedGoal && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground mt-4 text-center flex items-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-rose-400" />
          Tap your selection again to continue, or use the button below.
        </motion.p>
      )}

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        canContinue={canContinue}
        nextLabel="Continue"
        hint={canContinue ? undefined : 'Pick one goal to continue — you can change it later'}
      />
    </div>
  )
}

/**
 * Step 4 — Celebration (final).
 * Confetti burst + summary card + Enter ChandraCycle button.
 */
function StepCelebration({ data, onComplete }: { data: OnboardingData; onComplete: () => void }) {
  const selectedGoalId = data.goals[0]
  const selectedGoal = GOAL_OPTIONS.find((g) => g.id === selectedGoalId)
  const goalLabel = selectedGoal?.label.toLowerCase() ?? 'your journey'

  return (
    <div className="flex flex-col items-center text-center w-full max-w-md">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <CelebrationBurst />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3"
      >
        <span className="bg-gradient-to-r from-rose-600 to-fuchsia-600 bg-clip-text text-transparent">
          You&apos;re all set!
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-base text-muted-foreground mb-8"
      >
        Your AI companion is ready to guide you on every step of {goalLabel}.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full flex items-center justify-center gap-2 mb-6"
      >
        <Sparkles className="h-4 w-4 text-rose-500" />
        <p className="text-xs text-muted-foreground">ChandraCycle will learn more about you with every cycle</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full"
      >
        <Button
          onClick={onComplete}
          size="lg"
          className="w-full h-12 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 text-white font-semibold text-base shadow-lg shadow-rose-500/30 border-0"
        >
          <PartyPopper className="h-5 w-5" />
          Enter ChandraCycle
        </Button>
      </motion.div>
    </div>
  )
}

// ─── Shared step UI primitives ───────────────────────────────────────────────

function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="text-center w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Badge variant="secondary" className="mb-3 bg-white/60 dark:bg-white/10 text-rose-600 dark:text-rose-300 backdrop-blur border-0">
          {eyebrow}
        </Badge>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-sm text-muted-foreground mt-2"
      >
        {subtitle}
      </motion.p>
    </div>
  )
}

function StepFooter({
  onBack,
  onNext,
  canContinue,
  nextLabel,
  hint,
}: {
  onBack: () => void
  onNext: () => void
  canContinue: boolean
  nextLabel: string
  hint?: string
}) {
  return (
    <div className="w-full mt-8 space-y-2">
      {hint && (
        <p className="text-xs text-rose-500 text-center">{hint}</p>
      )}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="h-12 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur border-white/50 dark:border-white/10 px-5"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canContinue}
          size="lg"
          className="flex-1 h-12 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 text-white font-semibold text-base shadow-lg shadow-rose-500/30 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextLabel}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Onboarding Component ───────────────────────────────────────────────

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  // All "removed" fields keep smart defaults so the backend POST still
  // receives valid data (cycleLength, periodLength, notifications, etc.).
  // Only lastPeriodStart and goals are actually collected from the user.
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    dateOfBirth: '',
    lastPeriodStart: '',
    cycleLength: 28,
    periodLength: 5,
    goals: [],
    height: '',
    weight: '',
    conditions: [],
    notifications: {
      // Period + Ovulation are silently enabled by default (the most useful
      // pair). Users can change them later in Settings.
      periodReminders: true,
      ovulationAlerts: true,
      moodCheckin: false,
      fertilityWindow: false,
      medicationReminders: false,
      weeklyInsights: false,
    },
  })

  const goToNext = () => {
    if (step >= TOTAL_STEPS) return
    setDirection(1)
    setStep((s) => s + 1)
  }

  const goToPrev = () => {
    if (step <= 1) return
    setDirection(-1)
    setStep((s) => s - 1)
  }

  const handleComplete = async () => {
    // Persist onboarding data to the backend so the user's profile is updated
    // (lastPeriodStart, cycleLength, periodLength, onboardingComplete=true).
    // The backend also re-issues a fresh session JWT (with the updated fields
    // embedded) so /api/auth/me returns the correct data on Vercel serverless
    // where the DB filesystem is ephemeral. We capture the fresh token and
    // persist it to localStorage before completing.
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('chandracycle_token')
        : null
      // If the user picked a period date, send it. If they SKIPPED, we send
      // nothing — lastPeriodStart stays null in the DB so the dashboard shows
      // the friendly "Log your first period" empty state (rather than a fake
      // cycle computed from a default date).
      const periodStart = data.lastPeriodStart && data.lastPeriodStart !== ''
        ? data.lastPeriodStart
        : null

      const res = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cycleLength: data.cycleLength,
          periodLength: data.periodLength,
          ...(periodStart ? { lastPeriodStart: periodStart } : {}),
        }),
      })
      // Persist the fresh token so subsequent /api/auth/me calls (and other
      // authenticated endpoints) use the updated session.
      if (res.ok) {
        const data2 = await res.json().catch(() => ({}))
        if (data2?.token && typeof window !== 'undefined') {
          localStorage.setItem('chandracycle_token', data2.token)
        }
      }
    } catch {
      // Non-blocking — the user can still enter the app.
    }
    onComplete()
  }

  const stepProps: StepProps = {
    data,
    setData,
    onNext: goToNext,
    onBack: goToPrev,
  }

  const renderStep = () => {
    switch (step) {
      case 1: return <StepWelcome {...stepProps} />
      case 2: return <StepLastPeriod {...stepProps} />
      case 3: return <StepGoal {...stepProps} />
      case 4: return <StepCelebration data={data} onComplete={handleComplete} />
      default: return null
    }
  }

  // Progress maps current step to "Step X of 3" — Celebration (step 4) is
  // the "done" state and shows full progress.
  const progressStep = Math.min(step, PROGRESS_STEPS)
  const progressPct = ((progressStep - 1) / (PROGRESS_STEPS - 1)) * 100
  const showProgress = step < TOTAL_STEPS // hide on Celebration

  // Slide animation variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br transition-colors duration-700',
        STEP_GRADIENTS[step],
        STEP_GRADIENTS_DARK[step],
      )}
    >
      {/* Floating decorative orbs */}
      <FloatingOrbs />

      {/* Progress bar at top */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 pt-4 pb-2">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-fuchsia-500 shadow-sm">
                <span className="text-xs font-serif font-bold text-white">C</span>
              </div>
              <span className="text-sm font-semibold text-rose-900 dark:text-rose-100">ChandraCycle</span>
            </div>
            {showProgress ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-200">
                  Step {progressStep}
                </span>
                <span className="text-xs text-rose-400 dark:text-rose-300/60">of {PROGRESS_STEPS}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-200">All set</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <Progress
            value={showProgress ? progressPct : 100}
            className="h-1.5 bg-rose-200/50 dark:bg-rose-900/40 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-rose-500 [&_[data-slot=progress-indicator]]:to-fuchsia-500"
          />

          {/* Step dots */}
          <div className="mt-2 flex items-center justify-between">
            {Array.from({ length: PROGRESS_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300',
                  s === progressStep && showProgress
                    ? 'bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white shadow-md scale-110'
                    : s < progressStep || !showProgress
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/40 dark:bg-white/10 text-rose-400 dark:text-rose-300/50'
                )}
              >
                {s < progressStep || (!showProgress && s <= PROGRESS_STEPS) ? <CheckCircle2 className="h-3 w-3" /> : s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="flex justify-center w-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom safety — skip link (small, subtle) */}
      <div className="relative z-10 pb-4 flex justify-center">
        {step < TOTAL_STEPS && (
          <button
            onClick={handleComplete}
            className="text-xs text-rose-500/70 hover:text-rose-600 dark:text-rose-300/60 dark:hover:text-rose-200 transition-colors underline-offset-4 hover:underline"
          >
            Skip onboarding for now
          </button>
        )}
      </div>
    </div>
  )
}
