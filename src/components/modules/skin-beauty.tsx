'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Droplet,
  Sun,
  Moon,
  Star,
  Heart,
  Brain,
  Activity,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Plus,
  Check,
  X,
  ChevronRight,
  Sparkle,
  Leaf,
  Apple,
  Carrot,
  Fish,
  Nut,
  Citrus,
  Wine,
  Coffee,
  Cookie,
  Stethoscope,
  Eye,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  ShieldCheck,
  Clock,
  Droplets,
  BedDouble,
  PenLine,
  Camera,
  BookOpen,
  ArrowRight,
  FlaskConical,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

type SkinCondition = 'clear' | 'mild' | 'moderate' | 'severe'

type FaceArea = 'forehead' | 'tzone' | 'cheeks' | 'chin' | 'jawline' | 'nose'

interface SkinLog {
  id: string
  date: string
  condition: SkinCondition
  areas: FaceArea[]
  newBreakouts: number
  productsUsed: string[]
  waterIntake: number
  sleepHours: number
  stressLevel: number
  notes: string
}

interface RoutineProduct {
  id: string
  name: string
  brand: string
  category: 'cleanser' | 'toner' | 'treatment' | 'moisturizer' | 'spf' | 'serum'
  timeOfDay: 'morning' | 'evening' | 'both'
  consistency: number // 0-100% tracked over 30 days
}

// ─── Skin Score (computed from the user's own logs — empty for a new user) ────

const SKIN_SCORE_BREAKDOWN: { label: string; value: number; icon: typeof Droplet; color: string; bgColor: string }[] = []
const OVERALL_SCORE: number | null = null

const CONDITION_META: Record<SkinCondition, { label: string; color: string; bgColor: string; emoji: string; description: string }> = {
  clear: {
    label: 'Clear',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
    emoji: '✨',
    description: 'Skin looks healthy and clear today',
  },
  mild: {
    label: 'Mild Breakouts',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
    emoji: '🌱',
    description: 'A few spots, mostly manageable',
  },
  moderate: {
    label: 'Moderate Acne',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800',
    emoji: '⚠️',
    description: 'Visible breakouts in multiple areas',
  },
  severe: {
    label: 'Severe Acne',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800',
    emoji: '🔴',
    description: 'Painful, widespread breakouts',
  },
}

const FACE_AREAS: { id: FaceArea; label: string; description: string }[] = [
  { id: 'forehead', label: 'Forehead', description: 'Stress & sleep related' },
  { id: 'tzone', label: 'T-Zone', description: 'Oiliness & congestion' },
  { id: 'nose', label: 'Nose', description: 'Blackheads & oil' },
  { id: 'cheeks', label: 'Cheeks', description: 'Dirty pillowcases, phones' },
  { id: 'chin', label: 'Chin', description: 'Hormonal breakouts' },
  { id: 'jawline', label: 'Jawline', description: 'Hormonal (luteal phase)' },
]

const PRODUCT_CHECKLIST = [
  { id: 'cleanser', label: 'Cleanser', icon: Droplet },
  { id: 'toner', label: 'Toner', icon: Sparkles },
  { id: 'moisturizer', label: 'Moisturizer', icon: Droplets },
  { id: 'sunscreen', label: 'Sunscreen (SPF)', icon: Sun },
  { id: 'treatment', label: 'Treatment (Retinol/AHA)', icon: FlaskConical },
]

const SKIN_TIMELINE: { date: string; day: number; condition: SkinCondition; breakouts: number; emoji: string; color: string }[] = []

// Cycle-skin correlation is empty until the user has logged at least one full
// cycle. The reference shape below stays in place only as a type hint for the
// chart, with no fake user data.
const CYCLE_SKIN_DATA: { day: number; breakouts: number; hydration: number; oiliness: number; glow: number }[] = []

// No fake "current cycle day" — the user's actual cycle day comes from their
// period-tracker logs (set to null until they have a logged cycle).
const CURRENT_CYCLE_DAY: number | null = null

const CYCLE_PHASES = [
  {
    id: 'menstrual',
    name: 'Menstrual',
    days: 'Days 1–5',
    color: 'from-rose-400 to-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-900',
    skinState: 'Sensitive & Dull',
    recommendation: 'Be extra gentle. Skip retinoids, use hydrating masks, and focus on barrier repair. Skin is more prone to irritation.',
    tips: ['Gentle cleanser only', 'Hydrating sheet masks', 'Avoid exfoliation', 'Use ceramide moisturizer'],
  },
  {
    id: 'follicular',
    name: 'Follicular',
    days: 'Days 6–13',
    color: 'from-emerald-400 to-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-900',
    skinState: 'Glowing & Clear',
    recommendation: 'Skin is at its best! Great time for treatments, exfoliation, and trying new products. Estrogen boosts collagen production.',
    tips: ['Try chemical exfoliants', 'Vitamin C serums shine', 'Great time for facials', 'Lighter moisturizer ok'],
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    days: 'Days 14–17',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-900',
    skinState: 'Peak Radiance',
    recommendation: 'Peak glow from estrogen. Oil production may start increasing. Lighter products work well. Enjoy the radiance!',
    tips: ['Maintain routine', 'Oil-control if needed', 'Antioxidant serums', 'SPF essential'],
  },
  {
    id: 'luteal',
    name: 'Luteal',
    days: 'Days 18–28',
    color: 'from-purple-400 to-fuchsia-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-900',
    skinState: 'Breakout Prone',
    recommendation: 'Progesterone increases sebum. Pre-period breakouts common. Use salicylic acid, niacinamide, and don\'t pick!',
    tips: ['Salicylic acid cleanser', 'Niacinamide serum', 'Avoid picking', 'Double cleanse at night'],
  },
]

const ROUTINE_PRODUCTS_INITIAL: RoutineProduct[] = []

const PRODUCT_DATABASE: Omit<RoutineProduct, 'consistency'>[] = [
  { id: 'db1', name: 'Salicylic Acid 2% Solution', brand: 'The Ordinary', category: 'treatment', timeOfDay: 'evening' },
  { id: 'db2', name: 'Hyaluronic Acid Serum', brand: 'The Inkey List', category: 'serum', timeOfDay: 'both' },
  { id: 'db3', name: 'Vitamin C 15% Suspension', brand: 'Paula\'s Choice', category: 'serum', timeOfDay: 'morning' },
  { id: 'db4', name: 'Benzoyl Peroxide 5% Wash', brand: 'PanOxyl', category: 'cleanser', timeOfDay: 'both' },
  { id: 'db5', name: 'AHA 7% Toning Solution', brand: 'The Ordinary', category: 'toner', timeOfDay: 'evening' },
  { id: 'db6', name: 'Azelaic Acid 10% Cream', brand: 'The Ordinary', category: 'treatment', timeOfDay: 'both' },
  { id: 'db7', name: 'Centella Water Gel Cream', brand: 'iUNIK', category: 'moisturizer', timeOfDay: 'both' },
  { id: 'db8', name: 'Mineral Matte SPF 40', brand: 'Supergoop', category: 'spf', timeOfDay: 'morning' },
]

// AI insights are empty for a new user — populated by the AI engine once the
// user has logged enough skin + cycle data to detect real patterns.
const AI_INSIGHTS: {
  id: string
  icon: typeof TrendingUp
  title: string
  accent: string
  insight: string
  detail: string
  tag: string
}[] = []

const BEAUTY_ARTICLES = [
  {
    id: 'a1',
    title: 'Foods for Glowing Skin',
    excerpt: 'Discover 12 nutrient-rich foods that boost collagen, hydration, and radiance from within.',
    emoji: '🥑',
    readTime: '5 min read',
    category: 'Nutrition',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'a2',
    title: 'Cycle-Synced Skincare',
    excerpt: 'How to adjust your routine across the 4 cycle phases for clearer, calmer skin all month.',
    emoji: '🌸',
    readTime: '7 min read',
    category: 'Hormonal',
    gradient: 'from-rose-400 to-fuchsia-500',
  },
  {
    id: 'a3',
    title: 'Hormonal Acne Guide',
    excerpt: 'Understand why jawline & chin breakouts happen and science-backed ways to treat them.',
    emoji: '🔬',
    readTime: '8 min read',
    category: 'Education',
    gradient: 'from-purple-400 to-violet-500',
  },
  {
    id: 'a4',
    title: 'Double Cleansing 101',
    excerpt: 'The Korean skincare secret to clear pores. Oil cleanser + water cleanser explained.',
    emoji: '💧',
    readTime: '4 min read',
    category: 'Routine',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    id: 'a5',
    title: 'SPF Myths Busted',
    excerpt: 'Indoor SPF? Reapplication? Mineral vs chemical? Get the facts on sun protection.',
    emoji: '☀️',
    readTime: '6 min read',
    category: 'Protection',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'a6',
    title: 'Stress & Skin: The Cortisol Connection',
    excerpt: 'How chronic stress triggers breakouts, dullness, and aging — and 5 ways to break the cycle.',
    emoji: '🧘‍♀️',
    readTime: '5 min read',
    category: 'Wellness',
    gradient: 'from-indigo-400 to-purple-500',
  },
]

// ─── Face Diagram Component ─────────────────────────────────────────────────

function FaceDiagram({ selected, onToggle }: { selected: FaceArea[]; onToggle: (area: FaceArea) => void }) {
  const isSelected = (area: FaceArea) => selected.includes(area)

  const areas: Record<FaceArea, { cx: number; cy: number; r: number; label: string }> = {
    forehead: { cx: 100, cy: 38, r: 26, label: 'Forehead' },
    tzone: { cx: 100, cy: 70, r: 14, label: 'T-Zone' },
    nose: { cx: 100, cy: 88, r: 10, label: 'Nose' },
    cheeks: { cx: 70, cy: 95, r: 18, label: 'L Cheek' },
    chin: { cx: 100, cy: 125, r: 12, label: 'Chin' },
    jawline: { cx: 55, cy: 125, r: 14, label: 'Jawline' },
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 170" className="w-full max-w-[260px] h-auto">
        {/* Face shape */}
        <ellipse
          cx="100"
          cy="90"
          rx="55"
          ry="75"
          fill="url(#faceGrad)"
          stroke="oklch(0.8 0.05 30)"
          strokeWidth="2"
        />
        <defs>
          <radialGradient id="faceGrad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="oklch(0.95 0.04 30)" />
            <stop offset="100%" stopColor="oklch(0.88 0.05 30)" />
          </radialGradient>
        </defs>
        {/* Hair hint */}
        <path d="M 45 35 Q 100 5 155 35 L 155 25 Q 100 -5 45 25 Z" fill="oklch(0.35 0.08 30)" opacity="0.85" />

        {/* Clickable areas */}
        {(['forehead', 'tzone', 'nose', 'cheeks', 'chin', 'jawline'] as FaceArea[]).map((area) => {
          const meta = areas[area]
          const sel = isSelected(area)
          return (
            <g key={area} onClick={() => onToggle(area)} className="cursor-pointer">
              {/* Right cheek mirror */}
              {area === 'cheeks' && (
                <circle
                  cx={200 - meta.cx}
                  cy={meta.cy}
                  r={meta.r}
                  fill={sel ? 'oklch(0.7 0.18 350 / 0.5)' : 'oklch(0.7 0.05 30 / 0.15)'}
                  stroke={sel ? 'oklch(0.55 0.2 350)' : 'oklch(0.6 0.05 30)'}
                  strokeWidth="1.5"
                  className="transition-all"
                />
              )}
              {area === 'jawline' && (
                <circle
                  cx={200 - meta.cx}
                  cy={meta.cy}
                  r={meta.r}
                  fill={sel ? 'oklch(0.7 0.18 350 / 0.5)' : 'oklch(0.7 0.05 30 / 0.15)'}
                  stroke={sel ? 'oklch(0.55 0.2 350)' : 'oklch(0.6 0.05 30)'}
                  strokeWidth="1.5"
                  className="transition-all"
                />
              )}
              <circle
                cx={meta.cx}
                cy={meta.cy}
                r={meta.r}
                fill={sel ? 'oklch(0.7 0.18 350 / 0.5)' : 'oklch(0.7 0.05 30 / 0.15)'}
                stroke={sel ? 'oklch(0.55 0.2 350)' : 'oklch(0.6 0.05 30)'}
                strokeWidth={sel ? 2.5 : 1.5}
                className="transition-all"
              />
              {sel && (
                <text
                  x={meta.cx}
                  y={meta.cy + 4}
                  textAnchor="middle"
                  fontSize="14"
                  fill="oklch(0.4 0.15 350)"
                  fontWeight="bold"
                >
                  ✓
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[280px]">
        {FACE_AREAS.map((area) => (
          <button
            key={area.id}
            onClick={() => onToggle(area.id)}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full border transition-all',
              isSelected(area.id)
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-muted/50 text-muted-foreground border-border hover:border-rose-300'
            )}
          >
            {area.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Section: Skin Score Dashboard ──────────────────────────────────────────

function SkinScoreDashboard() {
  const hasScore = OVERALL_SCORE !== null && SKIN_SCORE_BREAKDOWN.length > 0
  const scoreColor = OVERALL_SCORE !== null && OVERALL_SCORE >= 75
    ? 'text-emerald-500'
    : OVERALL_SCORE !== null && OVERALL_SCORE >= 50
    ? 'text-amber-500'
    : 'text-rose-500'
  const scoreGradient = OVERALL_SCORE !== null && OVERALL_SCORE >= 75
    ? 'from-emerald-500 to-teal-500'
    : OVERALL_SCORE !== null && OVERALL_SCORE >= 50
    ? 'from-amber-500 to-orange-500'
    : 'from-rose-500 to-red-500'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Overall Score */}
      <Card className="lg:col-span-1 overflow-hidden border-rose-200/60 dark:border-rose-900/40">
        <div className={cn('h-2 bg-gradient-to-r', scoreGradient)} />
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-fuchsia-500" />
            Skin Health Score
          </CardTitle>
          <CardDescription>Today&apos;s overall assessment</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-2">
          {hasScore && OVERALL_SCORE !== null ? (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative h-32 w-32"
              >
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="oklch(0.92 0.02 325)" strokeWidth="10" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none" stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - OVERALL_SCORE / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="oklch(0.7 0.2 350)" />
                      <stop offset="100%" stopColor="oklch(0.75 0.2 30)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn('text-3xl font-bold', scoreColor)}>{OVERALL_SCORE}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">out of 100</span>
                </div>
              </motion.div>
              <Badge variant="secondary" className="mt-3 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {OVERALL_SCORE >= 75 ? 'Healthy Glow' : OVERALL_SCORE >= 50 ? 'Needs Care' : 'Sensitive Period'}
              </Badge>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No score yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Log your skin daily to build your personalized skin health score.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Score Breakdown</CardTitle>
          <CardDescription>Key skin health indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {hasScore ? (
            <>
              {SKIN_SCORE_BREAKDOWN.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', item.bgColor)}>
                    <item.icon className={cn('h-4 w-4', item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className={cn('text-sm font-bold', item.color)}>{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.9, delay: idx * 0.08, ease: 'easeOut' }}
                        className={cn('h-full rounded-full bg-gradient-to-r', idx === 0 ? 'from-sky-400 to-sky-500' : idx === 1 ? 'from-rose-400 to-rose-500' : idx === 2 ? 'from-amber-400 to-amber-500' : 'from-fuchsia-400 to-fuchsia-500')}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              <Separator />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                <span>Insights appear once you have a week of logs.</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No breakdown yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Log your skin for a few days and your hydration, acne, oiliness, and glow scores will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Section: Daily Skin Log ────────────────────────────────────────────────

function DailySkinLog() {
  // Form starts empty — no pre-filled "today" values. The user fills in their
  // own log from scratch each day.
  const [condition, setCondition] = useState<SkinCondition>('clear')
  const [areas, setAreas] = useState<FaceArea[]>([])
  const [breakouts, setBreakouts] = useState(0)
  const [products, setProducts] = useState<string[]>([])
  const [water, setWater] = useState(0)
  const [sleep, setSleep] = useState(0)
  const [stress, setStress] = useState(0)
  const [notes, setNotes] = useState('')

  const toggleArea = (area: FaceArea) => {
    setAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])
  }

  const toggleProduct = (id: string) => {
    setProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleSave = () => {
    toast.success('Skin log saved!', {
      description: `Logged ${CONDITION_META[condition].label.toLowerCase()} on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
    })
    setNotes('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Face Map + Condition */}
      <Card className="lg:col-span-1 border-rose-200/60 dark:border-rose-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-rose-500" />
            Affected Areas
          </CardTitle>
          <CardDescription>Tap zones on the face map</CardDescription>
        </CardHeader>
        <CardContent>
          <FaceDiagram selected={areas} onToggle={toggleArea} />
          <Separator className="my-4" />
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Skin Condition</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['clear', 'mild', 'moderate', 'severe'] as SkinCondition[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all',
                    condition === c ? CONDITION_META[c].bgColor : 'bg-muted/30 border-transparent hover:border-border'
                  )}
                >
                  <span className="text-lg">{CONDITION_META[c].emoji}</span>
                  <div className="min-w-0">
                    <div className={cn('text-xs font-semibold leading-tight', condition === c && CONDITION_META[c].color)}>
                      {CONDITION_META[c].label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{CONDITION_META[condition].description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Right: Sliders + Checklist + Notes */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="h-4 w-4 text-fuchsia-500" />
            Today's Skin Log
          </CardTitle>
          <CardDescription>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* New breakouts + sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center justify-between">
                <span>New Breakouts</span>
                <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{breakouts}</Badge>
              </Label>
              <Slider value={[breakouts]} onValueChange={(v) => setBreakouts(v[0])} min={0} max={15} step={1} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-sky-500" /> Water (glasses)</span>
                <Badge variant="secondary" className="bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{water}</Badge>
              </Label>
              <Slider value={[water]} onValueChange={(v) => setWater(v[0])} min={0} max={12} step={1} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1"><BedDouble className="h-3 w-3 text-indigo-500" /> Sleep (hrs)</span>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">{sleep}h</Badge>
              </Label>
              <Slider value={[sleep]} onValueChange={(v) => setSleep(v[0])} min={0} max={12} step={1} />
            </div>
          </div>

          {/* Stress */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center justify-between">
              <span className="flex items-center gap-1"><Brain className="h-3 w-3 text-purple-500" /> Stress Level</span>
              <Badge variant="secondary" className={cn(
                stress <= 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                stress <= 6 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
              )}>{stress <= 3 ? 'Low' : stress <= 6 ? 'Moderate' : 'High'} ({stress}/10)</Badge>
            </Label>
            <Slider value={[stress]} onValueChange={(v) => setStress(v[0])} min={0} max={10} step={1} />
          </div>

          <Separator />

          {/* Products checklist */}
          <div className="space-y-2.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Products Used Today</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRODUCT_CHECKLIST.map(p => {
                const checked = products.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all',
                      checked ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800' : 'bg-muted/30 border-transparent hover:border-border'
                    )}
                  >
                    <div className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-md border-2 shrink-0',
                      checked ? 'bg-rose-500 border-rose-500' : 'border-muted-foreground/30'
                    )}>
                      {checked && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className={cn('text-sm', checked ? 'font-medium' : 'text-muted-foreground')}>{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs text-muted-foreground uppercase tracking-wider">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any observations about your skin today... (e.g., 'tried new moisturizer', 'felt particularly oily this morning')"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setNotes(''); setAreas([]); setProducts([]) }}>
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:opacity-90 text-white">
              <Check className="h-4 w-4 mr-1.5" /> Save Log
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Section: Cycle-Skin Connection ─────────────────────────────────────────

function CycleSkinConnection() {
  const [metric, setMetric] = useState<'breakouts' | 'hydration' | 'oiliness' | 'glow'>('breakouts')

  const metricMeta = {
    breakouts: { label: 'Breakouts', color: '#e11d48', name: 'New Breakouts' },
    hydration: { label: 'Hydration', color: '#0284c7', name: 'Hydration Level' },
    oiliness: { label: 'Oiliness', color: '#d97706', name: 'Oiliness' },
    glow: { label: 'Glow', color: '#c026d3', name: 'Glow / Radiance' },
  }

  const hasData = CYCLE_SKIN_DATA.length > 0
  const peakDay = useMemo(() => {
    if (!hasData) return null
    return CYCLE_SKIN_DATA.reduce((max, d) => d.breakouts > max.breakouts ? d : max, CYCLE_SKIN_DATA[0])
  }, [hasData])

  return (
    <div className="space-y-4">
      {/* Insight banner */}
      <Card className="overflow-hidden border-fuchsia-200/60 dark:border-fuchsia-900/40">
        <div className="bg-gradient-to-r from-rose-500 via-fuchsia-500 to-purple-500 p-0.5">
          <div className="bg-card rounded-t-[calc(var(--radius)-2px)]">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white shrink-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  {hasData && peakDay ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">AI Insight</Badge>
                        <span className="text-xs text-muted-foreground">Pattern detected from your logged cycles</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold">
                        Your skin tends to break out around day {peakDay.day} of your cycle
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Peak of {peakDay.breakouts} breakouts on day {peakDay.day}. Start preventative care 5 days earlier.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">AI Insight</Badge>
                        <span className="text-xs text-muted-foreground">Awaiting data</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold">
                        Your cycle–skin patterns will appear here
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Log your skin daily across at least one full cycle and we&apos;ll detect when your breakouts tend to peak relative to your period.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base">Skin vs. Cycle Day</CardTitle>
              <CardDescription>Track how your skin changes across your 28-day cycle</CardDescription>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
              {(['breakouts', 'hydration', 'oiliness', 'glow'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-md transition-all',
                    metric === m ? 'bg-card shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={metric === m ? { color: metricMeta[m].color } : undefined}
                >
                  {metricMeta[m].label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CYCLE_SKIN_DATA} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metricMeta[metric].color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={metricMeta[metric].color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 325)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: 'oklch(0.5 0.03 325)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'oklch(0.5 0.03 325)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'oklch(1 0 0)',
                        border: '1px solid oklch(0.91 0.02 325)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(v) => `Cycle Day ${v}`}
                    />
                    {CURRENT_CYCLE_DAY !== null && (
                      <ReferenceLine x={CURRENT_CYCLE_DAY} stroke="oklch(0.55 0.2 350)" strokeDasharray="4 4" label={{ value: 'Today', fontSize: 10, fill: 'oklch(0.55 0.2 350)', position: 'top' }} />
                    )}
                    {peakDay && (
                      <ReferenceLine x={peakDay.day} stroke="oklch(0.65 0.22 25)" strokeDasharray="2 2" label={{ value: 'Peak breakouts', fontSize: 10, fill: 'oklch(0.65 0.22 25)', position: 'top' }} />
                    )}
                    <Area
                      type="monotone"
                      dataKey={metric}
                      stroke={metricMeta[metric].color}
                      strokeWidth={2.5}
                      fill="url(#metricGrad)"
                      dot={{ r: 2, fill: metricMeta[metric].color }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
                {CURRENT_CYCLE_DAY !== null && (
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Today (Day {CURRENT_CYCLE_DAY})</span>
                )}
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /> Peak breakout day</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center h-64">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No cycle–skin data yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Log your skin daily across a full cycle to see how breakouts, hydration, oiliness, and glow change with your hormones.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase recommendations */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Moon className="h-4 w-4 text-purple-500" />
          Phase-Based Skincare Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {CYCLE_PHASES.map((phase, idx) => {
            const isCurrent = CURRENT_CYCLE_DAY !== null && (
              (CURRENT_CYCLE_DAY >= 1 && CURRENT_CYCLE_DAY <= 5 && phase.id === 'menstrual')
              || (CURRENT_CYCLE_DAY >= 6 && CURRENT_CYCLE_DAY <= 13 && phase.id === 'follicular')
              || (CURRENT_CYCLE_DAY >= 14 && CURRENT_CYCLE_DAY <= 17 && phase.id === 'ovulation')
              || (CURRENT_CYCLE_DAY >= 18 && phase.id === 'luteal')
            )
            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <Card className={cn('h-full overflow-hidden transition-all', isCurrent && 'ring-2 ring-rose-400', phase.borderColor)}>
                  <div className={cn('h-1.5 bg-gradient-to-r', phase.color)} />
                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{phase.name}</CardTitle>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[9px] h-5 bg-rose-500 text-white">Current</Badge>
                      )}
                    </div>
                    <CardDescription className="text-[11px]">{phase.days} · {phase.skinState}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">{phase.recommendation}</p>
                    <div className="space-y-1">
                      {phase.tips.map(tip => (
                        <div key={tip} className="flex items-start gap-1.5 text-[11px]">
                          <Check className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Section: Skincare Routine Builder ──────────────────────────────────────

function SkincareRoutineBuilder() {
  const [routine, setRoutine] = useState<RoutineProduct[]>(ROUTINE_PRODUCTS_INITIAL)
  const [showDatabase, setShowDatabase] = useState(false)
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning')

  const categoryMeta: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    cleanser: { label: 'Cleanser', icon: Droplet, color: 'text-sky-500' },
    toner: { label: 'Toner', icon: Sparkles, color: 'text-purple-500' },
    serum: { label: 'Serum', icon: Heart, color: 'text-rose-500' },
    treatment: { label: 'Treatment', icon: FlaskConical, color: 'text-amber-500' },
    moisturizer: { label: 'Moisturizer', icon: Droplets, color: 'text-emerald-500' },
    spf: { label: 'Sunscreen', icon: Sun, color: 'text-orange-500' },
  }

  const filtered = routine.filter(p => p.timeOfDay === activeTab || p.timeOfDay === 'both')
  // Avoid divide-by-zero when the routine is empty (a brand-new user).
  const avgConsistency = routine.length > 0
    ? Math.round(routine.reduce((sum, p) => sum + p.consistency, 0) / routine.length)
    : 0

  const addProduct = (product: Omit<RoutineProduct, 'consistency'>) => {
    if (routine.some(p => p.id === product.id)) {
      toast.error('Already in your routine')
      return
    }
    setRoutine([...routine, { ...product, consistency: 0 }])
    toast.success(`${product.name} added to routine`)
    setShowDatabase(false)
  }

  const removeProduct = (id: string) => {
    setRoutine(routine.filter(p => p.id !== id))
    toast.success('Product removed')
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40">
              <FlaskConical className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <div className="text-lg font-bold">{routine.length}</div>
              <div className="text-[10px] text-muted-foreground">Products</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
              <Check className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-lg font-bold">{avgConsistency}%</div>
              <div className="text-[10px] text-muted-foreground">Avg Consistency</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
              <Sun className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <div className="text-lg font-bold">{routine.filter(p => p.timeOfDay === 'morning' || p.timeOfDay === 'both').length}</div>
              <div className="text-[10px] text-muted-foreground">AM Steps</div>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
              <Moon className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <div className="text-lg font-bold">{routine.filter(p => p.timeOfDay === 'evening' || p.timeOfDay === 'both').length}</div>
              <div className="text-[10px] text-muted-foreground">PM Steps</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base">My Skincare Routine</CardTitle>
              <CardDescription>Build and track your daily AM/PM routine</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowDatabase(!showDatabase)} className="bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:opacity-90 text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* AM/PM toggle */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'morning' | 'evening')}>
            <TabsList className="grid grid-cols-2 w-full max-w-xs mb-4">
              <TabsTrigger value="morning" className="gap-1.5">
                <Sun className="h-3.5 w-3.5" /> Morning
              </TabsTrigger>
              <TabsTrigger value="evening" className="gap-1.5">
                <Moon className="h-3.5 w-3.5" /> Evening
              </TabsTrigger>
            </TabsList>

            <AnimatePresence>
              {showDatabase && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="rounded-xl border border-dashed border-rose-300 dark:border-rose-800 p-3 bg-rose-50/50 dark:bg-rose-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Product Database</span>
                      <Badge variant="secondary" className="text-[10px]">{PRODUCT_DATABASE.length} available</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {PRODUCT_DATABASE.map(p => {
                        const meta = categoryMeta[p.category]
                        return (
                          <button
                            key={p.id}
                            onClick={() => addProduct(p)}
                            className="flex items-center gap-2 rounded-lg border bg-card p-2 text-left hover:border-rose-400 transition-all"
                          >
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-md bg-muted/50', meta.color)}>
                              <meta.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{p.name}</div>
                              <div className="text-[10px] text-muted-foreground">{p.brand} · {meta.label}</div>
                            </div>
                            <Plus className="h-4 w-4 text-rose-500 shrink-0" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TabsContent value={activeTab} className="mt-0 space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No products in this routine yet. Click "Add Product" to build it.
                </div>
              ) : (
                filtered.map((p, idx) => {
                  const meta = categoryMeta[p.category]
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:shadow-sm transition-all group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center text-xs font-bold text-muted-foreground bg-muted/50 rounded-full shrink-0">
                        {idx + 1}
                      </div>
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 shrink-0', meta.color)}>
                        <meta.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{p.name}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">{meta.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{p.brand}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className={cn('text-[10px] font-medium', p.consistency >= 80 ? 'text-emerald-600' : p.consistency >= 50 ? 'text-amber-600' : 'text-rose-600')}>
                            {p.consistency}% consistent
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', p.consistency >= 80 ? 'bg-emerald-500' : p.consistency >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                            style={{ width: `${p.consistency}%` }}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500"
                        onClick={() => removeProduct(p.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Section: Skin Timeline ─────────────────────────────────────────────────

function SkinTimeline() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-rose-500" />
              Skin Timeline
            </CardTitle>
            <CardDescription>Last 14 days · color-coded by condition</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            {(['clear', 'mild', 'moderate', 'severe'] as SkinCondition[]).map(c => (
              <span key={c} className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', c === 'clear' ? 'bg-emerald-400' : c === 'mild' ? 'bg-amber-400' : c === 'moderate' ? 'bg-orange-400' : 'bg-rose-500')} />
                <span className="text-muted-foreground">{CONDITION_META[c].label}</span>
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {SKIN_TIMELINE.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
              <CalendarIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No skin logs yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Log your skin daily to build your 14-day timeline. Patterns and trends will appear here once you have a week of data.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
              {SKIN_TIMELINE.map((entry, idx) => (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group relative"
                >
                  <div className={cn(
                    'aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-md',
                    CONDITION_META[entry.condition].bgColor
                  )}>
                    <span className="text-base sm:text-lg leading-none">{entry.emoji}</span>
                    <span className="text-[9px] font-semibold mt-0.5 text-muted-foreground">{entry.day}</span>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-md bg-popover border text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-md">
                    {entry.date} · {entry.breakouts} breakouts
                  </div>
                </motion.div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Trend and streak insights appear after a week of logs</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Section: AI Skin Insights ──────────────────────────────────────────────

function AISkinInsights() {
  const { setActiveModule } = useAppStore()
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white">
          <Brain className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI Skin Insights</h3>
          <p className="text-[11px] text-muted-foreground">Personalized patterns from your skin & cycle data</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AI_INSIGHTS.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No personalized insights yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Log your skin daily and track your cycle — ChandraCycle will surface personalized patterns (like cycle-breakout correlations and product effectiveness) here.
            </p>
          </div>
        ) : (
          AI_INSIGHTS.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                <div className={cn('h-1 bg-gradient-to-r', insight.accent)} />
                <CardHeader className="pb-2 pt-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shrink-0', insight.accent)}>
                      <insight.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">{insight.title}</CardTitle>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-muted/60">{insight.tag}</Badge>
                      </div>
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1 leading-snug">{insight.insight}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.detail}</p>
                  {insight.id === 'pattern' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      onClick={() => setActiveModule('doctors')}
                    >
                      <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                      Consult Dermatologist
                      <ArrowRight className="h-3 w-3 ml-1.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Section: Beauty Tips Articles ──────────────────────────────────────────

function BeautyTips() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white">
          <BookOpen className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Beauty Tips & Articles</h3>
          <p className="text-[11px] text-muted-foreground">Expert-curated skincare knowledge</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {BEAUTY_ARTICLES.map((article, idx) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            whileHover={{ y: -3 }}
          >
            <Card className="h-full overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow">
              <div className={cn('h-24 bg-gradient-to-br flex items-center justify-center text-4xl', article.gradient)}>
                {article.emoji}
              </div>
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{article.category}</Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {article.readTime}
                  </span>
                </div>
                <h4 className="text-sm font-semibold leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{article.title}</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{article.excerpt}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">
                  Read more <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Module ────────────────────────────────────────────────────────────

export default function SkinBeautyModule() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-rose-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-rose-500 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
              Skin & Beauty
            </h1>
            <p className="text-sm text-muted-foreground">Track hormonal acne, sync skincare with your cycle, and uncover your glow</p>
          </div>
        </div>
        <Badge variant="secondary" className="self-start sm:self-auto bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 gap-1">
          <Heart className="h-3 w-3" /> Cycle-Synced
        </Badge>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm py-2">Dashboard</TabsTrigger>
          <TabsTrigger value="log" className="text-xs sm:text-sm py-2">Daily Log</TabsTrigger>
          <TabsTrigger value="cycle" className="text-xs sm:text-sm py-2">Cycle-Skin</TabsTrigger>
          <TabsTrigger value="routine" className="text-xs sm:text-sm py-2">Routine</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-5">
          <SkinScoreDashboard />
          <SkinTimeline />
          <AISkinInsights />
          <BeautyTips />
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <DailySkinLog />
        </TabsContent>

        <TabsContent value="cycle" className="mt-4">
          <CycleSkinConnection />
        </TabsContent>

        <TabsContent value="routine" className="mt-4">
          <SkincareRoutineBuilder />
        </TabsContent>
      </Tabs>
    </div>
  )
}
