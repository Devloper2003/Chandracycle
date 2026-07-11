'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import {
  Brain,
  Heart,
  HeartPulse,
  Sparkles,
  Play,
  Pause,
  X,
  Wind,
  Moon,
  Sun,
  BookOpen,
  CalendarDays,
  TrendingUp,
  Quote,
  Phone,
  MessageSquare,
  Siren,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Timer,
  Smile,
  CheckCircle2,
  Activity,
  Award,
  Flower2,
  Music2,
  SkipForward,
  SkipBack,
  RotateCcw,
  Star,
  PencilLine,
  SmilePlus,
  ShieldAlert,
  LifeBuoy,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type MoodLevel = 'great' | 'good' | 'okay' | 'low' | 'struggling'

interface Mood {
  level: MoodLevel
  label: string
  emoji: string
  score: number // 5 = great, 1 = struggling
  color: string // hex
  bgGradient: string
  ringClass: string
  message: string
  suggestion: string
}

interface Meditation {
  id: string
  title: string
  duration: number // minutes
  description: string
  category: 'Cycle Sync' | 'Stress & Anxiety' | 'Sleep' | 'Self-Love'
  gradient: string
  icon: 'lotus' | 'wind' | 'moon' | 'heart'
}

interface BreathingTechnique {
  id: '4-7-8' | 'box' | 'calm'
  name: string
  description: string
  phases: { label: string; duration: number; scale: number }[]
}

interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD
  mood: MoodLevel
  moodScore: number
  stress: number
  note: string
}

interface Affirmation {
  id: string
  text: string
  category: 'Self-love' | 'Body positivity' | 'Strength' | 'Peace' | 'Healing'
  author?: string
}

interface QuizQuestion {
  id: number
  text: string
  options: { label: string; value: number }[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const MOODS: Mood[] = [
  {
    level: 'great',
    label: 'Great',
    emoji: '😊',
    score: 5,
    color: '#10b981',
    bgGradient: 'from-emerald-400 to-teal-500',
    ringClass: 'ring-emerald-400',
    message: "You're glowing today! Let's keep that beautiful energy flowing.",
    suggestion: 'Try a Confidence Boost meditation to amplify your shine.',
  },
  {
    level: 'good',
    label: 'Good',
    emoji: '🙂',
    score: 4,
    color: '#8b5cf6',
    bgGradient: 'from-violet-400 to-purple-500',
    ringClass: 'ring-violet-400',
    message: 'A steady, positive day. You deserve to savor this calm.',
    suggestion: 'A short Box Breathing session will keep you grounded.',
  },
  {
    level: 'okay',
    label: 'Okay',
    emoji: '😐',
    score: 3,
    color: '#f59e0b',
    bgGradient: 'from-amber-400 to-orange-500',
    ringClass: 'ring-amber-400',
    message: "Neutral is perfectly okay. You don't have to feel amazing every day.",
    suggestion: 'A 10-minute Body Scan can help you reconnect with yourself.',
  },
  {
    level: 'low',
    label: 'Low',
    emoji: '😔',
    score: 2,
    color: '#6366f1',
    bgGradient: 'from-indigo-400 to-blue-500',
    ringClass: 'ring-indigo-400',
    message: 'It is okay to feel low. Be gentle with yourself today.',
    suggestion: 'Self Compassion meditation can soothe what feels heavy.',
  },
  {
    level: 'struggling',
    label: 'Struggling',
    emoji: '😢',
    score: 1,
    color: '#ec4899',
    bgGradient: 'from-pink-400 to-rose-500',
    ringClass: 'ring-pink-400',
    message: "You're not alone in this. Reaching out is a brave act of self-love.",
    suggestion: 'Consider a calming Deep Breathing exercise or talking to someone.',
  },
]

const MEDITATIONS: Meditation[] = [
  // Cycle Sync
  {
    id: 'med-1',
    title: 'Menstrual Phase Rest',
    duration: 15,
    description: "Honor your body's need for rest",
    category: 'Cycle Sync',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    icon: 'lotus',
  },
  {
    id: 'med-2',
    title: 'Follicular Energy',
    duration: 10,
    description: 'Channel your rising energy',
    category: 'Cycle Sync',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    icon: 'sun',
  },
  {
    id: 'med-3',
    title: 'Ovulation Confidence',
    duration: 12,
    description: 'Embrace your power',
    category: 'Cycle Sync',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    icon: 'sparkles',
  },
  {
    id: 'med-4',
    title: 'Luteal Calm',
    duration: 18,
    description: 'Find peace in transition',
    category: 'Cycle Sync',
    gradient: 'from-indigo-500 via-violet-500 to-purple-500',
    icon: 'moon',
  },
  // Stress & Anxiety
  {
    id: 'med-5',
    title: 'Deep Breathing',
    duration: 5,
    description: 'Reset your nervous system in minutes',
    category: 'Stress & Anxiety',
    gradient: 'from-sky-500 via-cyan-500 to-teal-500',
    icon: 'wind',
  },
  {
    id: 'med-6',
    title: 'Anxiety Release',
    duration: 10,
    description: 'Let go of tension and worry',
    category: 'Stress & Anxiety',
    gradient: 'from-teal-500 via-emerald-500 to-green-500',
    icon: 'wind',
  },
  {
    id: 'med-7',
    title: 'Body Scan',
    duration: 20,
    description: 'Reconnect with every part of you',
    category: 'Stress & Anxiety',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    icon: 'heart',
  },
  {
    id: 'med-8',
    title: 'Progressive Relaxation',
    duration: 15,
    description: 'Release tension head to toe',
    category: 'Stress & Anxiety',
    gradient: 'from-cyan-500 via-sky-500 to-blue-500',
    icon: 'wind',
  },
  // Sleep
  {
    id: 'med-9',
    title: 'Sleep Story',
    duration: 25,
    description: 'Drift into deep, restful sleep',
    category: 'Sleep',
    gradient: 'from-indigo-600 via-violet-700 to-purple-800',
    icon: 'moon',
  },
  {
    id: 'med-10',
    title: 'Wind Down',
    duration: 10,
    description: 'Transition from day to night',
    category: 'Sleep',
    gradient: 'from-slate-600 via-indigo-600 to-violet-700',
    icon: 'moon',
  },
  {
    id: 'med-11',
    title: 'Midnight Calm',
    duration: 15,
    description: 'Find your way back to sleep',
    category: 'Sleep',
    gradient: 'from-purple-700 via-violet-800 to-indigo-900',
    icon: 'moon',
  },
  // Self-Love
  {
    id: 'med-12',
    title: 'Body Acceptance',
    duration: 12,
    description: 'Make peace with your beautiful body',
    category: 'Self-Love',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    icon: 'heart',
  },
  {
    id: 'med-13',
    title: 'Self Compassion',
    duration: 10,
    description: 'Treat yourself like a dear friend',
    category: 'Self-Love',
    gradient: 'from-rose-400 via-pink-500 to-fuchsia-500',
    icon: 'heart',
  },
  {
    id: 'med-14',
    title: 'Confidence Boost',
    duration: 8,
    description: 'Step into your power',
    category: 'Self-Love',
    gradient: 'from-fuchsia-500 via-purple-500 to-violet-500',
    icon: 'sparkles',
  },
]

const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: '4-7-8',
    name: '4-7-8 Breathing',
    description: 'Dr. Andrew Weil\'s relaxing breath — calms anxiety and helps you fall asleep.',
    phases: [
      { label: 'Breathe In', duration: 4, scale: 1.6 },
      { label: 'Hold', duration: 7, scale: 1.6 },
      { label: 'Breathe Out', duration: 8, scale: 1 },
    ],
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Used by Navy SEALs to stay focused and calm under pressure.',
    phases: [
      { label: 'Breathe In', duration: 4, scale: 1.6 },
      { label: 'Hold', duration: 4, scale: 1.6 },
      { label: 'Breathe Out', duration: 4, scale: 1 },
      { label: 'Hold', duration: 4, scale: 1 },
    ],
  },
  {
    id: 'calm',
    name: 'Calm Breathing',
    description: 'Simple 4-6 pattern — perfect for everyday relaxation.',
    phases: [
      { label: 'Breathe In', duration: 4, scale: 1.6 },
      { label: 'Breathe Out', duration: 6, scale: 1 },
    ],
  },
]

const AFFIRMATIONS: Affirmation[] = [
  { id: 'a1', text: 'I am enough exactly as I am.', category: 'Self-love' },
  { id: 'a2', text: 'My body is worthy of love and care.', category: 'Body positivity' },
  { id: 'a3', text: 'I am stronger than I realize.', category: 'Strength' },
  { id: 'a4', text: 'I choose peace over perfection.', category: 'Peace' },
  { id: 'a5', text: 'Every day, I am healing a little more.', category: 'Healing' },
  { id: 'a6', text: 'I honor my feelings without judgment.', category: 'Self-love' },
  { id: 'a7', text: 'My worth is not defined by a number on a scale.', category: 'Body positivity' },
  { id: 'a8', text: 'I trust my body and its wisdom.', category: 'Body positivity' },
  { id: 'a9', text: 'I have the courage to face hard days.', category: 'Strength' },
  { id: 'a10', text: 'Stillness is a gift I give myself.', category: 'Peace' },
  { id: 'a11', text: 'I release what I cannot control.', category: 'Peace' },
  { id: 'a12', text: 'I am allowed to take up space.', category: 'Self-love' },
  { id: 'a13', text: 'My scars are proof of my resilience.', category: 'Healing' },
  { id: 'a14', text: 'I am gentle with myself when I stumble.', category: 'Self-love' },
  { id: 'a15', text: 'I am a work of art in progress.', category: 'Body positivity' },
  { id: 'a16', text: 'I breathe in calm, I breathe out tension.', category: 'Peace' },
  { id: 'a17', text: 'I am the calm in my own storm.', category: 'Strength' },
  { id: 'a18', text: 'My mind deserves rest, too.', category: 'Healing' },
  { id: 'a19', text: 'I forgive myself for what I didn\'t know.', category: 'Healing' },
  { id: 'a20', text: 'I am proud of the woman I am becoming.', category: 'Self-love' },
  { id: 'a21', text: 'My softness is my strength.', category: 'Strength' },
  { id: 'a22', text: 'I trust the timing of my life.', category: 'Peace' },
  { id: 'a23', text: 'My body carries me through every chapter.', category: 'Body positivity' },
  { id: 'a24', text: 'I am worthy of love that feels like home.', category: 'Self-love' },
]

const PHQ9_QUESTIONS: QuizQuestion[] = [
  { id: 1, text: 'Little interest or pleasure in doing things', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 2, text: 'Feeling down, depressed, or hopeless', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 3, text: 'Trouble falling/staying asleep, or sleeping too much', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 4, text: 'Feeling tired or having little energy', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 5, text: 'Poor appetite or overeating', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 6, text: 'Feeling bad about yourself — that you are a failure or have let down yourself or your family', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 7, text: 'Trouble concentrating on things, such as reading or watching television', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 8, text: 'Moving or speaking so slowly that other people could have noticed — or the opposite, being so fidgety that you have been moving around a lot more than usual', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 9, text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
]

const GAD7_QUESTIONS: QuizQuestion[] = [
  { id: 1, text: 'Feeling nervous, anxious, or on edge', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 2, text: 'Not being able to stop or control worrying', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 3, text: 'Worrying too much about different things', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 4, text: 'Trouble relaxing', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 5, text: 'Being so restless that it is hard to sit still', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 6, text: 'Becoming easily annoyed or irritable', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
  { id: 7, text: 'Feeling afraid, as if something awful might happen', options: [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
  ]},
]

// Mood history is empty by default — populated from /api/mood in the component.
const MOOD_HISTORY: JournalEntry[] = []

const WEEKLY_MED_MINUTES = [
  { day: 'Mon', minutes: 0 },
  { day: 'Tue', minutes: 0 },
  { day: 'Wed', minutes: 0 },
  { day: 'Thu', minutes: 0 },
  { day: 'Fri', minutes: 0 },
  { day: 'Sat', minutes: 0 },
  { day: 'Sun', minutes: 0 },
]

// ─── Helper functions ─────────────────────────────────────────────────────────

const getMoodByLevel = (level: MoodLevel) => MOODS.find(m => m.level === level)!
const getMoodByScore = (score: number) => MOODS.find(m => m.score === score)!

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatLongDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const getDailyAffirmation = () => {
  const dayOfYear = getDayOfYear(new Date())
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length]
}

// ─── Animation variants ───────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, ease: 'easeOut' as const },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Meditation Icon Picker ───────────────────────────────────────────────────
function MeditationIcon({ icon, className }: { icon: Meditation['icon']; className?: string }) {
  switch (icon) {
    case 'lotus': return <Flower2 className={className} />
    case 'wind': return <Wind className={className} />
    case 'moon': return <Moon className={className} />
    case 'sun': return <Sun className={className} />
    case 'heart': return <Heart className={className} />
    case 'sparkles': return <Sparkles className={className} />
    default: return <Flower2 className={className} />
  }
}

// ─── 1. Header Section ────────────────────────────────────────────────────────
function HeaderSection() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-10 text-white shadow-xl shadow-violet-500/20"
    >
      {/* Decorative blurred orbs */}
      <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
      <div className="absolute top-8 right-8 hidden md:block">
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flower2 className="h-20 w-20 text-white/20" />
        </motion.div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Mental Wellness
          </Badge>
          <span className="text-xs text-white/70">{today}</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-violet-50 to-fuchsia-100 bg-clip-text text-transparent">
          Mind &amp; Soul
        </h1>
        <p className="mt-3 text-base md:text-lg text-violet-100/90 max-w-2xl">
          Nurture your mental wellness through every phase
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <Brain className="h-4 w-4" />
            <span>5-min check-in</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <Heart className="h-4 w-4" />
            <span>14 guided meditations</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <Wind className="h-4 w-4" />
            <span>3 breathing techniques</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── 2. Daily Mood Check-in ───────────────────────────────────────────────────
function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)
  const [stress, setStress] = useState<number[]>([3])
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  const selected = selectedMood ? getMoodByLevel(selectedMood) : null

  const handleSave = () => {
    if (!selectedMood) return
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
    >
      <Card className="glass border-violet-200/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <SmilePlus className="h-5 w-5" />
                Daily Mood Check-in
              </CardTitle>
              <CardDescription className="mt-1">
                How are you feeling right now? Take a moment to listen.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-violet-300 text-violet-600">
              <Clock className="h-3 w-3 mr-1" />
              2 min
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood selector */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Choose your mood</p>
            <div className="grid grid-cols-5 gap-2 md:gap-3">
              {MOODS.map((mood) => {
                const isSelected = selectedMood === mood.level
                return (
                  <motion.button
                    key={mood.level}
                    type="button"
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMood(mood.level)}
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 md:p-4 transition-all',
                      isSelected
                        ? cn('border-transparent bg-gradient-to-br text-white shadow-lg', mood.bgGradient, 'ring-4', mood.ringClass, 'ring-offset-2')
                        : 'border-border bg-card hover:border-violet-300'
                    )}
                  >
                    <span className="text-3xl md:text-4xl select-none">{mood.emoji}</span>
                    <span className={cn(
                      'text-xs md:text-sm font-medium',
                      isSelected ? 'text-white' : 'text-muted-foreground'
                    )}>
                      {mood.label}
                    </span>
                    {isSelected && (
                      <motion.div
                        layoutId="mood-check"
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow"
                      >
                        <CheckCircle2 className="h-4 w-4 text-violet-600" />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Affirming message */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.level}
                initial={{ opacity: 0, y: 8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'rounded-2xl p-4 bg-gradient-to-br text-white shadow-md',
                  selected.bgGradient
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl shrink-0">{selected.emoji}</div>
                  <div>
                    <p className="font-medium leading-snug">{selected.message}</p>
                    <p className="text-sm text-white/85 mt-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      {selected.suggestion}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stress slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Stress level today</p>
              <Badge variant="secondary" className="font-mono">
                {stress[0]} / 10
              </Badge>
            </div>
            <Slider
              value={stress}
              onValueChange={setStress}
              min={1}
              max={10}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Calm</span>
              <span>Moderate</span>
              <span>Overwhelmed</span>
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <PencilLine className="h-4 w-4" />
              Notes (optional)
            </p>
            <Textarea
              placeholder="What's on your mind? Anything you'd like to remember about today..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none border-violet-200 focus-visible:ring-violet-400"
            />
          </div>

          {/* Save */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {selectedMood ? 'Ready to save your check-in' : 'Pick a mood to begin'}
            </p>
            <Button
              onClick={handleSave}
              disabled={!selectedMood}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span key="saved" className="flex items-center gap-1.5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </motion.span>
                ) : (
                  <motion.span key="save" className="flex items-center gap-1.5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <Heart className="h-4 w-4" /> Save Check-in
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── 3. Meditation Library + Now Playing ──────────────────────────────────────
function NowPlayingView({
  meditation,
  onClose,
}: {
  meditation: Meditation
  onClose: () => void
}) {
  const totalSeconds = meditation.duration * 60
  const [elapsed, setElapsed] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false)
            return totalSeconds
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, totalSeconds])

  // Note: state resets naturally when parent remounts this component (AnimatePresence
  // unmounts NowPlayingView when closed, so a fresh meditation starts fresh state).

  const progress = (elapsed / totalSeconds) * 100
  const remaining = totalSeconds - elapsed
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  // Circular progress
  const radius = 130
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const isComplete = elapsed >= totalSeconds

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'relative w-full max-w-lg rounded-3xl bg-gradient-to-br p-8 md:p-10 text-white shadow-2xl overflow-hidden',
          meditation.gradient
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-black/10 blur-3xl" />

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="relative text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            <Music2 className="h-3 w-3 mr-1" />
            Now Playing
          </Badge>

          {/* Circular timer */}
          <div className="relative mx-auto mb-6 h-[280px] w-[280px] flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 280 280">
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="8"
              />
              <motion.circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </svg>

            {/* Pulsing meditation icon in center */}
            <motion.div
              animate={isPlaying ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute flex flex-col items-center justify-center"
            >
              <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <MeditationIcon icon={meditation.icon} className="h-10 w-10 text-white" />
              </div>
              <div className="text-4xl font-mono font-semibold tabular-nums">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </div>
              <div className="text-xs text-white/80 mt-1">
                {isComplete ? 'Session complete' : isPlaying ? 'Breathe deeply' : 'Paused'}
              </div>
            </motion.div>
          </div>

          <h3 className="text-2xl font-bold mb-1">{meditation.title}</h3>
          <p className="text-white/80 text-sm mb-6">{meditation.description}</p>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
              onClick={() => setElapsed(Math.max(0, elapsed - 15))}
              aria-label="Rewind 15 seconds"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="bg-white text-violet-700 hover:bg-white/90 rounded-full h-16 w-16 shadow-lg"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              disabled={isComplete}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7 ml-1" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
              onClick={() => setElapsed(Math.min(totalSeconds, elapsed + 15))}
              aria-label="Forward 15 seconds"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-white/80 mb-1">
              <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
              <span>{meditation.duration}:00</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl bg-white/20 backdrop-blur-sm p-3 text-sm"
            >
              <p className="font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Beautiful. You took {meditation.duration} minutes for yourself.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function MeditationLibrary() {
  const [activeCategory, setActiveCategory] = useState<'All' | Meditation['category']>('All')
  const [nowPlaying, setNowPlaying] = useState<Meditation | null>(null)

  const categories: Array<'All' | Meditation['category']> = ['All', 'Cycle Sync', 'Stress & Anxiety', 'Sleep', 'Self-Love']

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return MEDITATIONS
    return MEDITATIONS.filter(m => m.category === activeCategory)
  }, [activeCategory])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="glass border-violet-200/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <Flower2 className="h-5 w-5" />
                Meditation Library
              </CardTitle>
              <CardDescription className="mt-1">
                {MEDITATIONS.length} guided journeys for every mood & phase
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'h-7 text-xs',
                    activeCategory === cat && 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                  )}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((med) => (
              <motion.button
                key={med.id}
                variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => setNowPlaying(med)}
                className="group relative overflow-hidden rounded-2xl text-left shadow-md"
              >
                <div className={cn('relative h-44 bg-gradient-to-br p-5 flex flex-col justify-between', med.gradient)}>
                  {/* Decorative orbs */}
                  <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-black/10 blur-2xl" />

                  <div className="relative flex items-start justify-between">
                    <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MeditationIcon icon={med.icon} className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-white/25 text-white border-white/30 backdrop-blur-sm text-[10px]">
                      {med.category}
                    </Badge>
                  </div>
                  <div className="relative text-white">
                    <h3 className="font-bold text-base leading-tight">{med.title}</h3>
                    <p className="text-xs text-white/85 mt-0.5 line-clamp-2">{med.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="flex items-center gap-1 text-xs text-white/90">
                        <Clock className="h-3 w-3" /> {med.duration} min
                      </span>
                      <div className="h-9 w-9 rounded-full bg-white text-violet-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Play className="h-4 w-4 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {nowPlaying && (
          <NowPlayingView key={nowPlaying.id} meditation={nowPlaying} onClose={() => setNowPlaying(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── 4. Breathing Exercises ───────────────────────────────────────────────────
function BreathingExercise() {
  const [activeId, setActiveIdState] = useState<BreathingTechnique['id']>('4-7-8')
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const technique = BREATHING_TECHNIQUES.find(t => t.id === activeId)!
  const cycleDuration = technique.phases.reduce((s, p) => s + p.duration, 0)

  // Derive current phase from elapsed time (cheap computation, no memo needed)
  const pos = elapsed % cycleDuration
  let acc = 0
  let phaseIdx = 0
  let secondsLeft = technique.phases[0].duration
  for (let i = 0; i < technique.phases.length; i++) {
    const p = technique.phases[i]
    if (pos < acc + p.duration) {
      phaseIdx = i
      secondsLeft = p.duration - (pos - acc)
      break
    }
    acc += p.duration
  }
  const cycles = Math.floor(elapsed / cycleDuration)

  const currentPhase = technique.phases[phaseIdx]

  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(() => {
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning])

  // Technique change handler also resets state (no effect needed)
  const handleTechniqueChange = (id: BreathingTechnique['id']) => {
    setActiveIdState(id)
    setIsRunning(false)
    setElapsed(0)
  }

  const handleStart = () => {
    if (elapsed >= cycleDuration * 4) setElapsed(0) // restart after 4 cycles
    setIsRunning(true)
  }
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setElapsed(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <Card className="glass border-violet-200/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Wind className="h-5 w-5" />
            Breathing Exercises
          </CardTitle>
          <CardDescription>Follow the circle. Let your breath lead you home.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Technique selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {BREATHING_TECHNIQUES.map(tech => (
              <button
                key={tech.id}
                onClick={() => handleTechniqueChange(tech.id)}
                className={cn(
                  'rounded-xl border-2 p-3 text-left transition-all',
                  activeId === tech.id
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                    : 'border-border hover:border-violet-300'
                )}
              >
                <div className="font-semibold text-sm">{tech.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {tech.phases.map(p => p.duration).join('-')} seconds
                </div>
              </button>
            ))}
          </div>

          {/* Animation area */}
          <div className="relative rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/40 dark:via-purple-950/40 dark:to-fuchsia-950/40 overflow-hidden">
            {/* Decorative blurred orbs */}
            <div className="absolute top-4 left-4 h-20 w-20 rounded-full bg-violet-300/30 blur-2xl" />
            <div className="absolute bottom-4 right-4 h-24 w-24 rounded-full bg-fuchsia-300/30 blur-2xl" />

            <div className="relative flex flex-col items-center justify-center py-12 px-4 min-h-[420px]">
              {/* Concentric guide rings */}
              <div className="absolute h-64 w-64 rounded-full border border-violet-200/60 dark:border-violet-700/40" />
              <div className="absolute h-80 w-80 rounded-full border border-violet-100/50 dark:border-violet-800/30" />

              {/* Animated breathing circle */}
              <div className="relative flex h-64 w-64 items-center justify-center">
                <motion.div
                  animate={{ scale: currentPhase.scale }}
                  transition={{
                    duration: currentPhase.duration,
                    ease: 'easeInOut',
                  }}
                  className="absolute h-44 w-44 rounded-full bg-gradient-to-br from-violet-400 via-purple-400 to-fuchsia-400 shadow-2xl shadow-violet-500/40"
                  style={{ opacity: 0.9 }}
                />
                <motion.div
                  animate={{ scale: currentPhase.scale }}
                  transition={{
                    duration: currentPhase.duration,
                    ease: 'easeInOut',
                  }}
                  className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-300 opacity-60 blur-md"
                />
                {/* Center label */}
                <div className="relative z-10 text-center text-white">
                  <div className="text-2xl md:text-3xl font-bold drop-shadow-md">
                    {currentPhase.label}
                  </div>
                  <div className="text-5xl md:text-6xl font-mono font-bold mt-1 drop-shadow-md">
                    {secondsLeft}
                  </div>
                </div>
              </div>

              {/* Phase indicators */}
              <div className="relative mt-8 flex items-center gap-2">
                {technique.phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      i === phaseIdx ? 'w-10 bg-violet-600' : 'w-4 bg-violet-200 dark:bg-violet-800'
                    )} />
                    <span className={cn(
                      'text-[10px] font-medium',
                      i === phaseIdx ? 'text-violet-700 dark:text-violet-300' : 'text-muted-foreground'
                    )}>
                      {p.duration}s
                    </span>
                    {i < technique.phases.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    )}
                  </div>
                ))}
              </div>

              {/* Cycles counter */}
              <div className="relative mt-4 flex items-center gap-3 text-sm">
                <Badge variant="outline" className="border-violet-300 text-violet-600">
                  <Timer className="h-3 w-3 mr-1" />
                  Cycle {cycles + 1}
                </Badge>
                <span className="text-muted-foreground">
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} elapsed
                </span>
              </div>
            </div>
          </div>

          {/* Description & controls */}
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">{technique.description}</p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-11 w-11 border-violet-300"
              onClick={handleReset}
              aria-label="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-full h-14 px-8"
              onClick={isRunning ? handlePause : handleStart}
            >
              {isRunning ? (
                <><Pause className="h-5 w-5 mr-2" /> Pause</>
              ) : (
                <><Play className="h-5 w-5 mr-2 fill-current" /> {elapsed > 0 ? 'Resume' : 'Begin'}</>
              )}
            </Button>
            <div className="w-11" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── 5. Mood Journal ──────────────────────────────────────────────────────────
function MoodJournal() {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [journalText, setJournalText] = useState('')
  const [viewMonth, setViewMonth] = useState(new Date())

  const todayEntry = MOOD_HISTORY[MOOD_HISTORY.length - 1]
  const pastEntries = [...MOOD_HISTORY].reverse().slice(1, 8) // exclude today, show 7 past
  const hasHistory = MOOD_HISTORY.length > 0

  // Build calendar for current month
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startWeekday = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (Date | null)[] = []
    for (let i = 0; i < startWeekday; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d))
    }
    return days
  }, [viewMonth])

  const moodForDate = (date: Date): JournalEntry | undefined => {
    const dateStr = date.toISOString().split('T')[0]
    return MOOD_HISTORY.find(e => e.date === dateStr)
  }

  // Chart data: last 30 days
  const chartData = useMemo(() => {
    return MOOD_HISTORY.map(e => ({
      date: formatDate(e.date),
      mood: e.moodScore,
      stress: e.stress,
      fullDate: e.date,
    }))
  }, [])

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="glass border-violet-200/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <BookOpen className="h-5 w-5" />
            Mood Journal
          </CardTitle>
          <CardDescription>Track your emotional landscape over time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-violet-500" />
                  {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={i} />
                  const entry = moodForDate(date)
                  const mood = entry ? getMoodByLevel(entry.mood) : null
                  const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
                  return (
                    <button
                      key={i}
                      onClick={() => entry && setSelectedEntry(entry)}
                      className={cn(
                        'aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all relative',
                        mood
                          ? 'text-white shadow-sm hover:scale-105'
                          : 'text-muted-foreground hover:bg-accent',
                        mood && cn('bg-gradient-to-br', mood.bgGradient),
                        isToday && 'ring-2 ring-violet-500 ring-offset-1'
                      )}
                      title={entry ? `${getMoodByLevel(entry.mood).label} • Stress ${entry.stress}/10` : ''}
                    >
                      <span>{date.getDate()}</span>
                      {mood && <span className="text-[10px] mt-0.5">{mood.emoji}</span>}
                    </button>
                  )
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px]">
                {MOODS.map(m => (
                  <div key={m.level} className="flex items-center gap-1">
                    <div className={cn('h-3 w-3 rounded-full bg-gradient-to-br', m.bgGradient)} />
                    <span className="text-muted-foreground">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's entry */}
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
                <PencilLine className="h-4 w-4 text-violet-500" />
                Today's Journal Entry
              </h3>
              <div className="rounded-xl border border-violet-200 dark:border-violet-800 p-4 space-y-3">
                {todayEntry ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <SmilePlus className="h-4 w-4" />
                    Mood: <span className="font-medium">{MOODS.find(m => m.level === todayEntry.mood)?.emoji} {MOODS.find(m => m.level === todayEntry.mood)?.label}</span>
                    <Separator orientation="vertical" className="h-3 mx-1" />
                    Stress: <span className="font-medium">{todayEntry.stress}/10</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <SmilePlus className="h-4 w-4" />
                    <span>No mood logged today yet — write freely below.</span>
                  </div>
                )}
                <Textarea
                  placeholder="What happened today? How do you feel about it? What are you grateful for?"
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  className="min-h-[120px] resize-none border-violet-200 focus-visible:ring-violet-400"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{journalText.length} characters</span>
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                    <Heart className="h-3.5 w-3.5 mr-1" /> Save Entry
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mood trends chart */}
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Mood Trends (30 days)
            </h3>
            <div className="rounded-xl border border-violet-100 dark:border-violet-900/50 p-4 bg-card/50">
              {hasHistory ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 325)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'oklch(0.5 0.03 325)' }}
                      interval={4}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 10, fill: 'oklch(0.5 0.03 325)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid oklch(0.91 0.02 325)',
                        background: 'oklch(1 0 0)',
                        fontSize: 12,
                        padding: '8px 12px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'mood') {
                          const m = getMoodByScore(value)
                          return [`${m.emoji} ${m.label}`, 'Mood']
                        }
                        return [`${value}/10`, 'Stress']
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <ReferenceLine y={3} stroke="oklch(0.7 0.05 325)" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 3 }}
                      activeDot={{ r: 6, fill: '#7c3aed' }}
                      name="mood"
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="stress"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center h-[220px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No mood data yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Log your mood daily to see your emotional trends and patterns appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Past entries */}
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
              <BookOpen className="h-4 w-4 text-violet-500" />
              Past Entries
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
              {pastEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-2">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No entries yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Your past journal entries will appear here once you start logging.
                  </p>
                </div>
              ) : (
                pastEntries.map(entry => {
                  const mood = getMoodByLevel(entry.mood)
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="w-full text-left rounded-xl border border-border hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 p-3 transition-all flex items-center gap-3"
                    >
                      <div className={cn(
                        'h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-lg shrink-0',
                        mood.bgGradient
                      )}>
                        {mood.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{formatLongDate(entry.date)}</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1">{mood.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {entry.note || <span className="italic">No notes — mood check-in only</span>}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry detail dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEntry && (
                <>
                  <span className="text-2xl">{getMoodByLevel(selectedEntry.mood).emoji}</span>
                  <span>{getMoodByLevel(selectedEntry.mood).label}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedEntry && formatLongDate(selectedEntry.date)}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Mood Score</div>
                  <div className="text-2xl font-bold text-violet-600">{selectedEntry.moodScore}/5</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Stress Level</div>
                  <div className="text-2xl font-bold text-amber-600">{selectedEntry.stress}/10</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Journal Note</div>
                <div className="rounded-lg border border-violet-100 dark:border-violet-900 p-3 text-sm min-h-[80px]">
                  {selectedEntry.note || <span className="italic text-muted-foreground">No notes for this day.</span>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEntry(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── 6. Affirmations ──────────────────────────────────────────────────────────
function AffirmationsWall() {
  const daily = getDailyAffirmation()
  // Favorites start empty — user adds their own. No pre-populated favorites.
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<'All' | Affirmation['category']>('All')

  const categories: Array<'All' | Affirmation['category']> = ['All', 'Self-love', 'Body positivity', 'Strength', 'Peace', 'Healing']

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return AFFIRMATIONS
    return AFFIRMATIONS.filter(a => a.category === activeCategory)
  }, [activeCategory])

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const categoryColors: Record<Affirmation['category'], string> = {
    'Self-love': 'from-rose-400 to-pink-500',
    'Body positivity': 'from-fuchsia-400 to-purple-500',
    'Strength': 'from-amber-400 to-orange-500',
    'Peace': 'from-sky-400 to-cyan-500',
    'Healing': 'from-emerald-400 to-teal-500',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <Card className="glass border-violet-200/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Quote className="h-5 w-5" />
            Daily Affirmations
          </CardTitle>
          <CardDescription>Words to carry with you through the day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Daily affirmation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 md:p-8 text-white shadow-lg"
          >
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-white/20 text-white border-white/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Today's Affirmation
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                  onClick={() => toggleFavorite(daily.id)}
                >
                  {favorites.has(daily.id) ? (
                    <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                  ) : (
                    <Star className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <Quote className="h-8 w-8 text-white/40 mb-2" />
              <p className="text-xl md:text-2xl font-medium leading-snug">
                {daily.text}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-white/80">
                <span>Category:</span>
                <Badge variant="outline" className="border-white/30 text-white">{daily.category}</Badge>
              </div>
            </div>
          </motion.div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'h-7 text-xs',
                  activeCategory === cat && 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                )}
              >
                {cat}
                {cat !== 'All' && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    ({AFFIRMATIONS.filter(a => a.category === cat).length})
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Affirmations wall */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filtered.map(aff => (
              <motion.div
                key={aff.id}
                variants={staggerItem}
                whileHover={{ y: -3 }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-md min-h-[140px] flex flex-col justify-between',
                  categoryColors[aff.category]
                )}
              >
                <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Quote className="h-5 w-5 text-white/40 mb-1" />
                <p className="text-sm font-medium leading-snug relative flex-1">{aff.text}</p>
                <div className="flex items-center justify-between mt-3 relative">
                  <Badge className="bg-white/25 text-white border-white/30 text-[10px]">
                    {aff.category}
                  </Badge>
                  <button
                    onClick={() => toggleFavorite(aff.id)}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label={favorites.has(aff.id) ? 'Remove favorite' : 'Add favorite'}
                  >
                    {favorites.has(aff.id) ? (
                      <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Favorites counter */}
          <div className="text-center text-xs text-muted-foreground">
            <Star className="inline h-3.5 w-3.5 mr-1 fill-violet-400 text-violet-400" />
            You've favorited {favorites.size} affirmation{favorites.size === 1 ? '' : 's'}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── 7. Therapy & Support + Quizzes ───────────────────────────────────────────
function QuizRunner({
  questions,
  title,
  description,
  scoring,
  accentColor,
  crisisNote,
}: {
  questions: QuizQuestion[]
  title: string
  description: string
  scoring: { min: number; max: number; label: string; color: string; recommendation: string }[]
  accentColor: 'violet' | 'rose'
  crisisNote?: string
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const total = questions.length
  const answeredCount = Object.keys(answers).length
  const score = Object.values(answers).reduce((s, v) => s + v, 0)
  const result = scoring.find(s => score >= s.min && score <= s.max) || scoring[scoring.length - 1]

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  const accentClasses = accentColor === 'violet'
    ? {
        bg: 'bg-violet-600',
        bgHover: 'hover:bg-violet-700',
        bgSoft: 'bg-violet-50 dark:bg-violet-950/40',
        border: 'border-violet-300',
        text: 'text-violet-600',
        ring: 'ring-violet-400',
      }
    : {
        bg: 'bg-rose-600',
        bgHover: 'hover:bg-rose-700',
        bgSoft: 'bg-rose-50 dark:bg-rose-950/40',
        border: 'border-rose-300',
        text: 'text-rose-600',
        ring: 'ring-rose-400',
      }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4 md:p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h4 className="font-semibold text-sm">{title}</h4>
        <Badge variant="outline" className="text-[10px]">{total} questions</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>

      {!submitted ? (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{answeredCount}/{total}</span>
            </div>
            <Progress value={(answeredCount / total) * 100} className="h-1.5" />
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {questions.map((q, idx) => (
              <div key={q.id} className={cn(
                'rounded-xl border p-3 transition-colors',
                answers[q.id] !== undefined ? cn(accentClasses.border, accentClasses.bgSoft) : 'border-border'
              )}>
                <div className="flex items-start gap-2 mb-2">
                  <span className={cn(
                    'shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    answers[q.id] !== undefined ? cn(accentClasses.bg, 'text-white') : 'bg-muted text-muted-foreground'
                  )}>
                    {idx + 1}
                  </span>
                  <p className="text-sm font-medium leading-snug">{q.text}</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5 ml-7">
                  {q.options.map(opt => {
                    const isSelected = answers[q.id] === opt.value
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                        className={cn(
                          'text-left text-xs rounded-lg border px-2.5 py-2 transition-all',
                          isSelected
                            ? cn(accentClasses.bg, 'text-white border-transparent')
                            : 'border-border hover:border-violet-300 text-muted-foreground'
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={reset} disabled={answeredCount === 0}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
            <Button
              onClick={() => setSubmitted(true)}
              disabled={answeredCount < total}
              className={cn(accentClasses.bg, accentClasses.bgHover)}
              size="sm"
            >
              See Results
            </Button>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className={cn('rounded-xl p-5 text-center text-white shadow-md bg-gradient-to-br', result.color)}>
            <div className="text-xs uppercase tracking-wide opacity-90 mb-1">Your Score</div>
            <div className="text-5xl font-bold mb-1">{score}</div>
            <div className="text-sm opacity-90 mb-2">out of {total * 3}</div>
            <div className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
              {result.label}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Recommendation</div>
            <p className="text-sm leading-relaxed">{result.recommendation}</p>
          </div>

          {crisisNote && score >= 1 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-4">
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Important</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{crisisNote}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={reset} className="flex-1">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retake
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            This screening tool is for educational purposes only and is not a diagnosis. Please consult a healthcare professional for proper evaluation.
          </p>
        </motion.div>
      )}
    </div>
  )
}

function TherapySupport() {
  const { setActiveModule } = useAppStore()
  const [activeQuiz, setActiveQuiz] = useState<'none' | 'phq9' | 'gad7'>('none')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="glass border-violet-200/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <LifeBuoy className="h-5 w-5" />
            Therapy &amp; Support
          </CardTitle>
          <CardDescription>You deserve support — you don't have to do this alone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Therapist CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-5 md:p-6 text-white shadow-md">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Badge className="bg-white/20 text-white border-white/30 mb-2">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  Professional Support
                </Badge>
                <h3 className="text-xl md:text-2xl font-bold mb-1">Connect with a Therapist</h3>
                <p className="text-sm text-white/85 max-w-md">
                  Find licensed mental health professionals, counselors, and psychologists near you. Telehealth and in-person options available.
                </p>
              </div>
              <Button
                onClick={() => setActiveModule('doctors')}
                className="bg-white text-violet-700 hover:bg-white/90 shrink-0"
              >
                <Stethoscope className="h-4 w-4 mr-1.5" />
                Find a Therapist
              </Button>
            </div>
          </div>

          {/* Crisis support resources */}
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
              <Siren className="h-4 w-4 text-rose-500" />
              Crisis Support Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-full bg-rose-500 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Helpline</div>
                    <div className="text-sm font-semibold">India</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <div className="font-mono font-bold text-rose-600">iCall: 9152987821</div>
                    <div className="text-[10px] text-muted-foreground">Mon–Sat, 8 AM – 10 PM</div>
                  </div>
                  <Separator className="my-1" />
                  <div>
                    <div className="font-mono font-bold text-rose-600">Vandrevala: 1860-2662-345</div>
                    <div className="text-[10px] text-muted-foreground">24/7</div>
                  </div>
                  <Separator className="my-1" />
                  <div>
                    <div className="font-mono font-bold text-rose-600">Kiran: 1800-599-0019</div>
                    <div className="text-[10px] text-muted-foreground">Govt. of India, 24/7</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Crisis Text Line</div>
                    <div className="text-sm font-semibold">Text Support</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <div className="font-mono font-bold text-amber-600">Text HOME to 741741</div>
                    <div className="text-[10px] text-muted-foreground">Crisis Text Line (US)</div>
                  </div>
                  <Separator className="my-1" />
                  <div>
                    <div className="font-mono font-bold text-amber-600">Text CONNECT to 68878</div>
                    <div className="text-[10px] text-muted-foreground">Trevor Project (LGBTQ+)</div>
                  </div>
                  <Separator className="my-1" />
                  <div>
                    <div className="font-mono font-bold text-amber-600">WhatsApp iCall</div>
                    <div className="text-[10px] text-muted-foreground">+91 9152987821</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-full bg-violet-500 flex items-center justify-center">
                    <Siren className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Emergency</div>
                    <div className="text-sm font-semibold">Immediate Help</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <div className="font-mono font-bold text-violet-600">Emergency: 112</div>
                    <div className="text-[10px] text-muted-foreground">India (ambulance, police, fire)</div>
                  </div>
                  <Separator className="my-1" />
                  <div>
                    <div className="font-mono font-bold text-violet-600">Women Helpline: 1091</div>
                    <div className="text-[10px] text-muted-foreground">24/7</div>
                  </div>
                  <Separator className="my-1" />
                  <div>
                    <div className="font-mono font-bold text-violet-600">AASRA: 9820466726</div>
                    <div className="text-[10px] text-muted-foreground">Suicide prevention, 24/7</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-3">
              <p className="text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span><strong>If you are in immediate danger or having thoughts of self-harm, please call your local emergency number (112 in India, 911 in US) or go to the nearest emergency room. You matter, and help is available.</strong></span>
              </p>
            </div>
          </div>

          {/* Self-assessment quizzes */}
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
              <Activity className="h-4 w-4 text-violet-500" />
              Self-Assessment Quizzes
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Validated screening tools used by clinicians worldwide. Choose a quiz to begin.
            </p>

            {activeQuiz === 'none' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveQuiz('phq9')}
                  className="group text-left rounded-2xl border-2 border-violet-200 dark:border-violet-800 p-4 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="font-semibold">PHQ-9</div>
                  <div className="text-xs text-muted-foreground">Depression Screening</div>
                  <div className="text-[10px] text-muted-foreground mt-2">9 questions • ~3 minutes</div>
                </button>
                <button
                  onClick={() => setActiveQuiz('gad7')}
                  className="group text-left rounded-2xl border-2 border-rose-200 dark:border-rose-800 p-4 hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                      <HeartPulse className="h-5 w-5 text-white" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="font-semibold">GAD-7</div>
                  <div className="text-xs text-muted-foreground">Anxiety Screening</div>
                  <div className="text-[10px] text-muted-foreground mt-2">7 questions • ~2 minutes</div>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setActiveQuiz('none')}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back to quiz selection
                </Button>
                {activeQuiz === 'phq9' && (
                  <QuizRunner
                    questions={PHQ9_QUESTIONS}
                    title="PHQ-9 Depression Screening"
                    description="Over the last 2 weeks, how often have you been bothered by any of the following problems?"
                    accentColor="violet"
                    crisisNote="If you indicated any thoughts of self-harm on question 9, please reach out to a crisis line or mental health professional immediately. Your life has value."
                    scoring={[
                      { min: 0, max: 4, label: 'Minimal Depression', color: 'from-emerald-400 to-teal-500', recommendation: 'Your results suggest minimal symptoms of depression. Continue your self-care practices — meditation, journaling, and connection with loved ones. Monitor how you feel over the coming weeks.' },
                      { min: 5, max: 9, label: 'Mild Depression', color: 'from-amber-400 to-orange-500', recommendation: 'Your results suggest mild depressive symptoms. Consider increasing self-care activities like the meditations and breathing exercises in this app. If symptoms persist or worsen, consider speaking with a mental health professional.' },
                      { min: 10, max: 14, label: 'Moderate Depression', color: 'from-orange-400 to-rose-500', recommendation: 'Your results suggest moderate depressive symptoms. We recommend talking to a healthcare provider or mental health professional. The meditations and journaling tools here can support you alongside professional care.' },
                      { min: 15, max: 19, label: 'Moderately Severe', color: 'from-rose-500 to-red-600', recommendation: 'Your results suggest moderately severe depression. Please consult a mental health professional for proper evaluation and treatment. You can use our Find a Therapist tool to connect with someone who can help.' },
                      { min: 20, max: 27, label: 'Severe Depression', color: 'from-red-500 to-rose-700', recommendation: 'Your results suggest severe depression. We strongly encourage you to seek professional help as soon as possible. Please consider reaching out to a mental health professional today, or contact one of the crisis resources listed above.' },
                    ]}
                  />
                )}
                {activeQuiz === 'gad7' && (
                  <QuizRunner
                    questions={GAD7_QUESTIONS}
                    title="GAD-7 Anxiety Screening"
                    description="Over the last 2 weeks, how often have you been bothered by the following problems?"
                    accentColor="rose"
                    scoring={[
                      { min: 0, max: 4, label: 'Minimal Anxiety', color: 'from-emerald-400 to-teal-500', recommendation: 'Your results suggest minimal anxiety. The breathing exercises and meditations in this app can help you maintain your sense of calm. Continue what you are doing.' },
                      { min: 5, max: 9, label: 'Mild Anxiety', color: 'from-amber-400 to-orange-500', recommendation: 'Your results suggest mild anxiety. Try the 4-7-8 breathing technique and our Anxiety Release meditation. If symptoms persist, consider talking with a mental health professional.' },
                      { min: 10, max: 14, label: 'Moderate Anxiety', color: 'from-orange-400 to-rose-500', recommendation: 'Your results suggest moderate anxiety. We recommend a consultation with a mental health professional. The tools in this app can be a helpful supplement to professional care.' },
                      { min: 15, max: 21, label: 'Severe Anxiety', color: 'from-rose-500 to-red-600', recommendation: 'Your results suggest severe anxiety. Please seek evaluation from a mental health professional. You deserve support — consider using our Find a Therapist tool to connect with someone today.' },
                    ]}
                  />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── 8. Wellness Stats ────────────────────────────────────────────────────────
function WellnessStats() {
  const meditationsThisWeek = WEEKLY_MED_MINUTES.filter(d => d.minutes > 0).length
  const totalMinutes = WEEKLY_MED_MINUTES.reduce((s, d) => s + d.minutes, 0)
  const currentStreak = 0
  const recentMoodEntries = MOOD_HISTORY.slice(-7)
  const avgMood =
    recentMoodEntries.length > 0
      ? recentMoodEntries.reduce((s, e) => s + e.moodScore, 0) / recentMoodEntries.length
      : 0

  const stats = [
    {
      label: 'Meditations This Week',
      value: meditationsThisWeek,
      suffix: '',
      icon: Flower2,
      gradient: 'from-violet-500 to-purple-600',
      sublabel: `${meditationsThisWeek} sessions completed`,
    },
    {
      label: 'Total Mindful Minutes',
      value: totalMinutes,
      suffix: ' min',
      icon: Clock,
      gradient: 'from-fuchsia-500 to-pink-600',
      sublabel: 'This week',
    },
    {
      label: 'Current Streak',
      value: currentStreak,
      suffix: ' days',
      icon: Flame,
      gradient: 'from-amber-500 to-orange-600',
      sublabel: 'Keep it going!',
    },
    {
      label: 'Mood Average',
      value: avgMood.toFixed(1),
      suffix: '/5',
      icon: Smile,
      gradient: 'from-emerald-500 to-teal-600',
      sublabel: 'Last 7 days',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <Card className="glass border-violet-200/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Award className="h-5 w-5" />
            Your Wellness Journey
          </CardTitle>
          <CardDescription>This week at a glance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={cn(
                  'relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-md',
                  stat.gradient
                )}
              >
                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-white/15 blur-xl" />
                <div className="relative">
                  <stat.icon className="h-6 w-6 mb-2 opacity-90" />
                  <div className="text-2xl md:text-3xl font-bold">
                    {stat.value}<span className="text-base font-medium opacity-90">{stat.suffix}</span>
                  </div>
                  <div className="text-[11px] text-white/85 font-medium mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-white/70 mt-0.5">{stat.sublabel}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Weekly meditation minutes chart */}
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Weekly Meditation Minutes
            </h3>
            <div className="rounded-xl border border-violet-100 dark:border-violet-900/50 p-4 bg-card/50">
              {meditationsThisWeek > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={WEEKLY_MED_MINUTES} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 325)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: 'oklch(0.5 0.03 325)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'oklch(0.5 0.03 325)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'oklch(0.94 0.035 325)' }}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid oklch(0.91 0.02 325)',
                        background: 'oklch(1 0 0)',
                        fontSize: 12,
                        padding: '8px 12px',
                      }}
                      formatter={(value: number) => [`${value} min`, 'Meditated']}
                    />
                    <Bar
                      dataKey="minutes"
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center h-[220px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                    <Flower2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No meditation minutes yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Complete a meditation session to see your weekly minutes fill in here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Encouragement banner */}
          <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border border-violet-100 dark:border-violet-900 p-4 flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                {currentStreak > 0
                  ? `${currentStreak}-day streak — you're amazing!`
                  : 'Begin your wellness streak today'}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentStreak > 0
                  ? 'Even a few minutes of mindfulness each day rewires your brain for calm. Keep showing up for yourself.'
                  : 'A single mindful breath is the start of a habit. Try a 1-minute meditation or a few rounds of box breathing to begin.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Quick mood banner (top of page) ──────────────────────────────────────────
function QuickMoodBanner() {
  const [quickMood, setQuickMood] = useState<MoodLevel | null>(null)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex flex-wrap items-center gap-2 rounded-2xl glass border border-violet-200/50 px-4 py-3"
    >
      <span className="text-sm font-medium text-muted-foreground mr-2">Quick check-in:</span>
      {MOODS.map(mood => (
        <button
          key={mood.level}
          onClick={() => setQuickMood(mood.level)}
          className={cn(
            'h-10 w-10 rounded-full text-xl flex items-center justify-center transition-all hover:scale-110',
            quickMood === mood.level && cn('ring-2 ring-offset-2', mood.ringClass)
          )}
          title={mood.label}
        >
          {mood.emoji}
        </button>
      ))}
      <AnimatePresence>
        {quickMood && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-violet-700 dark:text-violet-300 font-medium"
          >
            {getMoodByLevel(quickMood).message}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MODULE
// ═══════════════════════════════════════════════════════════════════════════════

export default function MentalWellnessModule() {
  return (
    <div className="space-y-6 pb-8">
      <HeaderSection />
      <QuickMoodBanner />

      <Tabs defaultValue="meditate" className="w-full">
        <TabsList className="h-auto flex-wrap bg-violet-50/50 dark:bg-violet-950/30 p-1 gap-1">
          <TabsTrigger value="meditate" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Flower2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Meditate</span>
          </TabsTrigger>
          <TabsTrigger value="breathe" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Wind className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Breathe</span>
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Journal</span>
          </TabsTrigger>
          <TabsTrigger value="affirm" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Quote className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Affirm</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <LifeBuoy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <Award className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meditate" className="space-y-6 mt-4">
          <MoodCheckIn />
          <MeditationLibrary />
        </TabsContent>

        <TabsContent value="breathe" className="space-y-6 mt-4">
          <BreathingExercise />
        </TabsContent>

        <TabsContent value="journal" className="space-y-6 mt-4">
          <MoodJournal />
        </TabsContent>

        <TabsContent value="affirm" className="space-y-6 mt-4">
          <AffirmationsWall />
        </TabsContent>

        <TabsContent value="support" className="space-y-6 mt-4">
          <TherapySupport />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6 mt-4">
          <WellnessStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}
