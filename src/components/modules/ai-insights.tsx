'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  ReferenceLine,
} from 'recharts'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Brain,
  Sparkles,
  Crown,
  Activity,
  Gauge,
  Smile,
  Moon,
  Zap,
  Target,
  Cookie,
  TrendingUp,
  TrendingDown,
  Droplet,
  Sun,
  Grid3x3,
  Network,
  Link2,
  LineChart as LineChartIcon,
  BarChart3,
  Salad,
  Dumbbell,
  Heart,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Pill,
  FileText,
  Download,
  Calendar,
  Cpu,
  Database,
  GitBranch,
  Info,
  Star,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Wind,
  BrainCircuit,
  CircuitBoard,
  Layers,
  Plus,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Lightbulb,
  Quote,
  Flower2,
  Stethoscope,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type ImpactLevel = 'high' | 'medium' | 'low'
type RiskLevel = 'low' | 'medium' | 'high'

interface DailyForecast {
  day: string
  date: string
  value: number
  label: string
  emoji?: string
  detail?: string
}

interface Prediction {
  id: string
  title: string
  icon: React.ElementType
  gradient: string
  accentColor: string
  confidence: number
  data: DailyForecast[]
  summary: string
  highlights: { type: 'positive' | 'warning' | 'info'; text: string }[]
  recommendations: string[]
  chartType: 'emoji' | 'bar' | 'area'
}

interface PatternInsight {
  id: string
  title: string
  description: string
  confidence: number
  delta: string
  direction: 'up' | 'down'
  icon: React.ElementType
  color: string
  chartData: { label: string; value: number; baseline: number }[]
  recommendation: string
}

interface Recommendation {
  id: string
  title: string
  description: string
  impact: ImpactLevel
  icon: React.ElementType
  category: 'nutrition' | 'exercise' | 'lifestyle' | 'selfcare'
  cyclePhase?: string
  evidence: string
}

interface RiskAssessment {
  id: string
  condition: string
  riskScore: number
  riskLevel: RiskLevel
  icon: React.ElementType
  color: string
  contributingFactors: string[]
  preventionTips: string[]
  trend: 'improving' | 'stable' | 'worsening'
}

// ─── Data ───────────────────────────────────────────────────────────────────
// NOTE: All demo / placeholder AI insight data was removed so a brand-new user
// starts with empty states ("Insights appear after you log some data"). The
// constants below are intentionally empty. When a real AI backend is wired up,
// fetch predictions / patterns / recommendations / risk assessments from the
// API and populate these arrays (or replace them with state). The UI shell
// below already gates every section on `length === 0` to render an empty
// state, so populating any one of these will automatically render its card.

// Health Predictability Score (0 = no data yet; AI computes from logged history)
const PREDICTABILITY_SCORE = 0

const SCORE_BREAKDOWN: { label: string; value: number; color: string; icon: React.ElementType }[] = []

// 7-Day Forecasts — empty until AI backend returns predictions.
const PREDICTIONS: Prediction[] = []

// Pattern Detection — empty until AI backend returns discovered patterns.
const PATTERNS: PatternInsight[] = []

// Correlation Matrix — empty until AI backend returns real correlations.
const MATRIX_VARIABLES: string[] = []
const CORRELATION_MATRIX: number[][] = []
const KEY_CORRELATIONS: { pair: string; value: number; insight: string }[] = []

// 90-Day Trends — empty until user has 90+ days of logs.
const MOOD_TREND_90: { date: string; day: number; value: number }[] = []
const SYMPTOM_TREND_90: { date: string; day: number; value: number }[] = []
const SLEEP_TREND_90: { date: string; day: number; value: number }[] = []
const CYCLE_REGULARITY_12: { month: string; length: number; variance: number }[] = []
const SLEEP_MOOD_SCATTER: { sleep: number; mood: number }[] = []

// Recommendations — empty until AI backend returns personalized recs.
const RECOMMENDATIONS: Recommendation[] = []

// Recommendation category config (UI shell — labels, icons, gradients).
// This is configuration, NOT demo data: it defines the 4 category tabs.
const REC_CATEGORIES = [
  { id: 'nutrition' as const, label: 'Nutrition', icon: Salad, color: 'emerald', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'exercise' as const, label: 'Exercise', icon: Dumbbell, color: 'orange', gradient: 'from-orange-500 to-amber-500' },
  { id: 'lifestyle' as const, label: 'Lifestyle', icon: Sun, color: 'violet', gradient: 'from-violet-500 to-purple-500' },
  { id: 'selfcare' as const, label: 'Self-Care', icon: Heart, color: 'rose', gradient: 'from-rose-500 to-pink-500' },
]

// Risk Assessments — empty until AI backend returns risk scores.
const RISK_ASSESSMENTS: RiskAssessment[] = []

// Monthly Report — null until the user has at least one full month of data.
const MONTHLY_REPORT: {
  month: string
  keyFindings: string[]
  improvements: { metric: string; delta: string; from: number; to: number }[]
  concerns: string[]
  goals: string[]
} | null = null

// AI Model Confidence — config/reference content (howItWorks steps, data
// source labels) is KEPT because it's product info explaining how the AI
// works. The dynamic stats (dataPoints, accuracy, lastUpdated, per-source
// counts) are zeroed out for a brand-new user and will populate from the API.
const AI_MODEL_INFO = {
  dataPoints: 0,
  accuracy: 0,
  lastUpdated: '—',
  nextUpdate: '—',
  dataSources: [
    { label: 'Cycle logs', count: 0, icon: Calendar, classes: 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' },
    { label: 'Mood entries', count: 0, icon: Smile, classes: 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
    { label: 'Sleep entries', count: 0, icon: Moon, classes: 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' },
    { label: 'Symptom logs', count: 0, icon: Activity, classes: 'bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400' },
    { label: 'Nutrition logs', count: 0, icon: Salad, classes: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
    { label: 'Exercise logs', count: 0, icon: Dumbbell, classes: 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400' },
  ],
  howItWorks: [
    {
      step: 1,
      title: 'Data Collection',
      description: 'We aggregate your cycle, mood, sleep, symptoms, nutrition, and exercise data points across all ChandraCycle modules.',
    },
    {
      step: 2,
      title: 'Pattern Recognition',
      description: 'Our ML models (XGBoost + LSTM ensemble) identify recurring patterns across your cycle phases and behaviors.',
    },
    {
      step: 3,
      title: 'Correlation Analysis',
      description: 'Pearson and Spearman correlations reveal how your habits interact — e.g., water intake ↔ cramp intensity.',
    },
    {
      step: 4,
      title: 'Predictive Modeling',
      description: '7-day forecasts use your historical patterns + current cycle phase to predict mood, energy, sleep, stress, and cravings.',
    },
    {
      step: 5,
      title: 'Personalized Insights',
      description: 'Each insight is ranked by confidence score and translated into actionable recommendations you can add to your plan.',
    },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function correlationColor(value: number): string {
  if (value >= 0.7) return 'bg-emerald-500'
  if (value >= 0.4) return 'bg-emerald-400/70'
  if (value >= 0.2) return 'bg-yellow-400/60'
  if (value > -0.2) return 'bg-slate-300/50'
  if (value > -0.4) return 'bg-orange-400/60'
  if (value > -0.7) return 'bg-rose-400/70'
  return 'bg-rose-500'
}

function correlationText(value: number): string {
  const abs = Math.abs(value)
  const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
  let strength = 'weak'
  if (abs >= 0.7) strength = 'very strong'
  else if (abs >= 0.4) strength = 'moderate'
  else if (abs >= 0.2) strength = 'mild'
  return `${strength} ${direction}`
}

const impactColors: Record<ImpactLevel, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'High Impact' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'Medium Impact' },
  low: { bg: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-300', label: 'Low Impact' },
}

const riskColors: Record<RiskLevel, { bg: string; text: string; ring: string; gradient: string }> = {
  low: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    gradient: 'from-emerald-400 to-teal-500',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-800',
    gradient: 'from-amber-400 to-orange-500',
  },
  high: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-300',
    ring: 'ring-rose-200 dark:ring-rose-800',
    gradient: 'from-rose-500 to-red-500',
  },
}

// Animated count-up hook
function useCountUp(target: number, duration = 1.8) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function HealthScoreGauge({ score }: { score: number }) {
  const animatedScore = useCountUp(score, 2)
  const size = 240
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - animatedScore / 100)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.91 0.02 325)"
          strokeWidth={stroke}
          className="dark:stroke-white/10"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: 'easeOut' }}
          filter="url(#glow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-5xl font-bold bg-gradient-to-br from-violet-600 to-amber-500 bg-clip-text text-transparent"
        >
          {animatedScore}
        </motion.div>
        <div className="text-xs font-medium text-muted-foreground mt-1">out of 100</div>
        <Badge className="mt-2 bg-gradient-to-r from-violet-500 to-amber-500 text-white border-0">
          <Sparkles className="h-3 w-3 mr-1" /> Highly Predictable
        </Badge>
      </div>
    </div>
  )
}

function MiniChart({ data, color }: { data: { label: string; value: number; baseline: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.baseline)))
  return (
    <div className="h-16 flex items-end gap-1">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center gap-0.5 h-full">
            <div
              className={`w-1.5 rounded-t bg-gradient-to-t ${color} transition-all`}
              style={{ height: `${(d.value / max) * 100}%` }}
            />
            <div
              className="w-0.5 rounded-t bg-muted-foreground/30"
              style={{ height: `${(d.baseline / max) * 100}%` }}
            />
          </div>
          <span className="text-[8px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function ForecastCard({ prediction, index }: { prediction: Prediction; index: number }) {
  const Icon = prediction.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="overflow-hidden h-full border-violet-200/40 dark:border-violet-800/30 bg-gradient-to-br from-white to-violet-50/30 dark:from-card dark:to-violet-950/10 backdrop-blur-sm">
        <div className={`h-1.5 bg-gradient-to-r ${prediction.gradient}`} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${prediction.gradient} text-white shadow-lg`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{prediction.title}</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">7-day forecast</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {prediction.confidence}% conf.
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Summary */}
          <div className="rounded-lg bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 p-2.5">
            <p className="text-xs text-foreground/80 leading-relaxed">{prediction.summary}</p>
          </div>

          {/* 7-day forecast visualization */}
          {prediction.chartType === 'emoji' ? (
            <div className="grid grid-cols-7 gap-1">
              {prediction.data.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'text-xl transition-transform hover:scale-125 cursor-default',
                      d.value >= 75 ? 'opacity-100' : d.value >= 50 ? 'opacity-80' : 'opacity-60'
                    )}
                    title={`${d.day} ${d.date}: ${d.label} (${d.value})`}
                  >
                    {d.emoji}
                  </div>
                  <div className="w-full bg-muted/60 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${prediction.gradient}`}
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          ) : prediction.chartType === 'bar' ? (
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prediction.data} margin={{ top: 4, right: 0, bottom: 0, left: -22 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(139,92,246,0.08)' }}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid rgba(139,92,246,0.2)',
                      fontSize: 11,
                      padding: '6px 10px',
                    }}
                    formatter={(v: number) => [`${v} / 100`, prediction.title]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {prediction.data.map((_, i) => (
                      <Cell key={i}>
                        <defs>
                          <linearGradient id={`bar-${prediction.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7c3aed" />
                          </linearGradient>
                        </defs>
                      </Cell>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prediction.data} margin={{ top: 4, right: 0, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id={`area-${prediction.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid rgba(139,92,246,0.2)',
                      fontSize: 11,
                      padding: '6px 10px',
                    }}
                    formatter={(v: number) => [`${v} / 100`, prediction.title]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill={`url(#area-${prediction.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Highlights */}
          <div className="space-y-1.5">
            {prediction.highlights.map((h, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-1.5 text-[11px] leading-snug',
                  h.type === 'positive' && 'text-emerald-700 dark:text-emerald-400',
                  h.type === 'warning' && 'text-rose-700 dark:text-rose-400',
                  h.type === 'info' && 'text-muted-foreground'
                )}
              >
                {h.type === 'positive' && <ArrowUpRight className="h-3 w-3 mt-0.5 shrink-0" />}
                {h.type === 'warning' && <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />}
                {h.type === 'info' && <Info className="h-3 w-3 mt-0.5 shrink-0" />}
                <span>{h.text}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Recommendations */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              AI Recommendations
            </p>
            <ul className="space-y-1">
              {prediction.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-violet-500 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PatternCard({ pattern, index }: { pattern: PatternInsight; index: number }) {
  const Icon = pattern.icon
  const colorMap: Record<string, string> = {
    rose: 'from-rose-500 to-pink-500',
    indigo: 'from-indigo-500 to-blue-500',
    amber: 'from-amber-500 to-orange-500',
    orange: 'from-orange-500 to-rose-500',
    cyan: 'from-cyan-500 to-blue-500',
    emerald: 'from-emerald-500 to-teal-500',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -3 }}
    >
      <Card className="h-full glass border-violet-200/40 dark:border-violet-800/30 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[pattern.color]} text-white shadow`}>
                <Icon className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm leading-tight">{pattern.title}</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 gap-1 text-[10px]',
                pattern.direction === 'up'
                  ? 'border-rose-200 text-rose-600 dark:border-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'
                  : 'border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
              )}
            >
              {pattern.direction === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {pattern.delta}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{pattern.description}</p>

          {/* Mini chart */}
          <div className="rounded-lg bg-muted/40 dark:bg-muted/20 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
                Supporting data
              </span>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-sm bg-violet-500" /> You
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-sm bg-muted-foreground/40" /> Baseline
                </span>
              </div>
            </div>
            <MiniChart data={pattern.chartData} color={colorMap[pattern.color]} />
          </div>

          {/* Confidence bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground shrink-0">Confidence</span>
            <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pattern.confidence}%` }}
                transition={{ duration: 1, delay: 0.3 + index * 0.07 }}
                className={`h-full bg-gradient-to-r ${colorMap[pattern.color]}`}
              />
            </div>
            <span className="text-[10px] font-semibold">{pattern.confidence}%</span>
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-1.5 rounded-md bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 p-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground/80 leading-snug">{pattern.recommendation}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RecommendationCard({ rec, onAdd, added }: { rec: Recommendation; onAdd: (id: string) => void; added: boolean }) {
  const Icon = rec.icon
  const impact = impactColors[rec.impact]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card className="h-full glass border-violet-200/40 dark:border-violet-800/30 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300">
                <Icon className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm leading-tight">{rec.title}</CardTitle>
            </div>
            <Badge className={cn('text-[9px] border-0', impact.bg, impact.text)}>{impact.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 gap-2.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{rec.description}</p>
          {rec.cyclePhase && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{rec.cyclePhase}</span>
            </div>
          )}
          <div className="flex items-start gap-1.5 rounded-md bg-amber-50/50 dark:bg-amber-950/15 p-1.5">
            <Database className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-snug">{rec.evidence}</p>
          </div>
          <Button
            size="sm"
            variant={added ? 'secondary' : 'default'}
            className={cn(
              'w-full h-8 text-[11px] gap-1.5',
              !added && 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
              added && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
            )}
            onClick={() => onAdd(rec.id)}
            disabled={added}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" /> Added to Plan
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> Add to Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RiskCard({ risk, index }: { risk: RiskAssessment; index: number }) {
  const Icon = risk.icon
  const colors = riskColors[risk.riskLevel]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -3 }}
    >
      <Card className={cn('h-full ring-1', colors.bg, colors.ring)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colors.gradient} text-white shadow-lg`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{risk.condition}</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wide', colors.text)}>
                    {risk.riskLevel} risk
                  </span>
                  {risk.trend === 'improving' && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 border-emerald-300 text-emerald-600">
                      <TrendingDown className="h-2.5 w-2.5" /> Improving
                    </Badge>
                  )}
                  {risk.trend === 'worsening' && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5 border-rose-300 text-rose-600">
                      <TrendingUp className="h-2.5 w-2.5" /> Worsening
                    </Badge>
                  )}
                  {risk.trend === 'stable' && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5">
                      <Activity className="h-2.5 w-2.5" /> Stable
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="relative w-14 h-14 shrink-0">
              <svg width="56" height="56" className="-rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  stroke={risk.riskLevel === 'low' ? '#10b981' : risk.riskLevel === 'medium' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 22}
                  initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - risk.riskScore / 100) }}
                  transition={{ duration: 1.5, delay: index * 0.08, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{risk.riskScore}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contributing factors */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Contributing Factors
            </p>
            <ul className="space-y-1">
              {risk.contributingFactors.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/60 mt-1.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Prevention tips */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Prevention Tips
            </p>
            <ul className="space-y-1">
              {risk.preventionTips.map((t, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Custom tooltip for recharts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-white/95 dark:bg-card/95 backdrop-blur-sm px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color || p.stroke || p.fill }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Main Module ─────────────────────────────────────────────────────────────

export default function AIInsightsModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [addedRecs, setAddedRecs] = useState<Set<string>>(new Set())

  const handleAddRec = (id: string) => {
    setAddedRecs((prev) => new Set(prev).add(id))
    toast.success('Added to your plan', {
      description: 'You can review and customize it in your dashboard.',
    })
  }

  const recsByCategory = useMemo(() => {
    const map: Record<string, Recommendation[]> = {}
    for (const cat of REC_CATEGORIES) {
      map[cat.id] = RECOMMENDATIONS.filter((r) => r.category === cat.id)
    }
    return map
  }, [])

  return (
    <div className="space-y-6">
      {/* ═══ 1. HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 p-6 md:p-8 text-white shadow-2xl"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute top-1/2 right-1/3 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm gap-1.5">
                  <BrainCircuit className="h-3.5 w-3.5" /> AI Engine Active
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                </Badge>
                <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-0 gap-1 font-semibold">
                  <Crown className="h-3.5 w-3.5" /> PREMIUM
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white gap-1">
                  <Cpu className="h-3 w-3" /> v3.2.1
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-white via-violet-100 to-amber-200 bg-clip-text text-transparent">
                  AI Health Intelligence
                </span>
              </h1>
              <p className="text-violet-100/90 text-sm md:text-base">
                Predictive insights powered by your data — patterns, forecasts, and personalized recommendations.
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-violet-100/80 pt-1">
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" /> {AI_MODEL_INFO.dataPoints.toLocaleString()} data points
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {AI_MODEL_INFO.accuracy}% accuracy
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Updated {AI_MODEL_INFO.lastUpdated}
                </span>
              </div>
            </div>

            {/* Right-side stat tiles */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3 min-w-[120px]">
                <div className="flex items-center gap-1.5 text-violet-100/80 text-[10px] uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" /> Predictions
                </div>
                <div className="text-2xl font-bold mt-0.5">{PREDICTIONS.length}</div>
                <div className="text-[10px] text-violet-100/70">7-day forecasts</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3 min-w-[120px]">
                <div className="flex items-center gap-1.5 text-violet-100/80 text-[10px] uppercase tracking-wide">
                  <Network className="h-3 w-3" /> Patterns
                </div>
                <div className="text-2xl font-bold mt-0.5">{PATTERNS.length}</div>
                <div className="text-[10px] text-violet-100/70">AI-discovered</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-400/30 to-yellow-500/30 backdrop-blur-md border border-amber-300/30 p-3">
                <div className="flex items-center gap-1.5 text-amber-100/90 text-[10px] uppercase tracking-wide">
                  <Gauge className="h-3 w-3" /> Predictability
                </div>
                <div className="text-2xl font-bold mt-0.5 text-white">{PREDICTABILITY_SCORE}%</div>
                <div className="text-[10px] text-amber-100/70">Highly predictable</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-3">
                <div className="flex items-center gap-1.5 text-violet-100/80 text-[10px] uppercase tracking-wide">
                  <ShieldAlert className="h-3 w-3" /> Risk checks
                </div>
                <div className="text-2xl font-bold mt-0.5">{RISK_ASSESSMENTS.length}</div>
                <div className="text-[10px] text-violet-100/70">Conditions tracked</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Tabbed Content ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-[57px] z-30 -mx-4 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/60">
          <TabsList className="bg-muted/60 h-auto p-1 gap-0.5 flex flex-wrap">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <Gauge className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="predictions" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Predictions
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-1.5 text-xs">
              <Network className="h-3.5 w-3.5" /> Patterns
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" /> Trends
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-1.5 text-xs">
              <Lightbulb className="h-3.5 w-3.5" /> Recommendations
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-1.5 text-xs">
              <ShieldAlert className="h-3.5 w-3.5" /> Risk
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══ OVERVIEW TAB: Sections 2, 9, 10 ═══ */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Section 2: Health Predictability Score */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="glass border-violet-200/40 dark:border-violet-800/30 overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-amber-500 text-white">
                        <Gauge className="h-4 w-4" />
                      </div>
                      Health Predictability Score
                    </CardTitle>
                    <CardDescription className="mt-1">
                      How reliably your health patterns can be forecast from your data
                    </CardDescription>
                  </div>
                  {PREDICTABILITY_SCORE > 0 && (
                    <Badge className="bg-gradient-to-r from-violet-500 to-amber-500 text-white border-0 gap-1">
                      <Star className="h-3 w-3 fill-white" /> Top 12% of users
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {PREDICTABILITY_SCORE === 0 || SCORE_BREAKDOWN.length === 0 ? (
                  // ── Empty state: not enough data yet to compute a score ──
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-3">
                      <Gauge className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No predictability score yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Insights appear after you log some data. Track your cycle, mood, sleep,
                      and symptoms for ~30 days and ChandraCycle will compute your health
                      predictability score, score breakdown, and personalized AI insights here.
                    </p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Left: Gauge */}
                  <div className="flex flex-col items-center">
                    <HealthScoreGauge score={PREDICTABILITY_SCORE} />
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="text-center text-sm text-muted-foreground mt-3 max-w-xs"
                    >
                      Your health patterns are{' '}
                      <span className="font-semibold bg-gradient-to-r from-violet-600 to-amber-500 bg-clip-text text-transparent">
                        {PREDICTABILITY_SCORE}% predictable
                      </span>{' '}
                      — AI can reliably forecast your week ahead.
                    </motion.p>
                  </div>

                  {/* Right: Breakdown */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Score Breakdown</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Based on 90 days of cycle, mood, sleep, and symptom data.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {SCORE_BREAKDOWN.map((item, i) => {
                        const Icon = item.icon
                        return (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-sm">
                                <Icon className="h-4 w-4 text-violet-500" />
                                {item.label}
                              </span>
                              <span className="text-sm font-semibold">{item.value}%</span>
                            </div>
                            <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.value}%` }}
                                transition={{ duration: 1, delay: 0.7 + i * 0.1, ease: 'easeOut' }}
                                className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-violet-600 dark:text-violet-400">{AI_MODEL_INFO.dataPoints.toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">Data points</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-violet-600 dark:text-violet-400">28d</div>
                        <div className="text-[10px] text-muted-foreground">Rolling window</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-violet-600 dark:text-violet-400">6</div>
                        <div className="text-[10px] text-muted-foreground">Data sources</div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 9: Monthly AI Report Summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="glass border-violet-200/40 dark:border-violet-800/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                        <FileText className="h-4 w-4" />
                      </div>
                      Monthly AI Report Summary
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {MONTHLY_REPORT ? MONTHLY_REPORT.month : 'No monthly report yet'}
                    </CardDescription>
                  </div>
                  {MONTHLY_REPORT && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => toast.success('PDF export started', { description: 'Your report will be ready in a moment.' })}
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => toast.success('Excel export started', { description: 'Your data will download shortly.' })}
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {MONTHLY_REPORT === null ? (
                  // ── Empty state: not enough data for a monthly report ──
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-3">
                      <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No monthly report yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Your first monthly AI report will generate automatically once you have
                      at least one full month of cycle, mood, sleep, and symptom logs. Start
                      tracking across ChandraCycle to unlock key findings, improvements, and
                      personalized goals here.
                    </p>
                  </div>
                ) : (
                  <>
                {/* Key findings */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-violet-500" /> Key Findings This Month
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {MONTHLY_REPORT.keyFindings.map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="flex items-start gap-2 rounded-lg bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 p-2.5"
                      >
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-[11px] text-foreground/80 leading-snug">{f}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Improvements from last month */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Improvements from Last Month
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {MONTHLY_REPORT.improvements.map((imp, i) => (
                      <motion.div
                        key={imp.metric}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/30 bg-emerald-50/40 dark:bg-emerald-950/15 p-2.5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground truncate">{imp.metric}</span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">{imp.delta}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-muted-foreground">{imp.from}</span>
                          <ArrowUpRight className="h-2.5 w-2.5 text-emerald-500" />
                          <span className="font-semibold">{imp.to}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Areas of concern */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-rose-500" /> Areas of Concern
                    </h4>
                    <ul className="space-y-1.5">
                      {MONTHLY_REPORT.concerns.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Goals for next month */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-violet-500" /> Goals for Next Month
                    </h4>
                    <ul className="space-y-1.5">
                      {MONTHLY_REPORT.goals.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-violet-500 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 10: AI Model Confidence */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="glass border-violet-200/40 dark:border-violet-800/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                        <CircuitBoard className="h-4 w-4" />
                      </div>
                      AI Model Confidence & Transparency
                    </CardTitle>
                    <CardDescription className="mt-1">
                      How ChandraCycle&apos;s AI works — and why you can trust its insights
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" /> Re-train model
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Stat tiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-violet-200/50 dark:border-violet-800/30 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 p-3">
                    <Database className="h-4 w-4 text-violet-500 mb-1" />
                    <div className="text-2xl font-bold">{AI_MODEL_INFO.dataPoints.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">Data points analyzed</div>
                  </div>
                  <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-1" />
                    <div className="text-2xl font-bold">{AI_MODEL_INFO.accuracy}%</div>
                    <div className="text-[10px] text-muted-foreground">Model accuracy</div>
                  </div>
                  <div className="rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-3">
                    <Clock className="h-4 w-4 text-amber-500 mb-1" />
                    <div className="text-sm font-bold mt-1">{AI_MODEL_INFO.lastUpdated}</div>
                    <div className="text-[10px] text-muted-foreground">Last updated</div>
                  </div>
                  <div className="rounded-xl border border-fuchsia-200/50 dark:border-fuchsia-800/30 bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/20 dark:to-pink-950/20 p-3">
                    <GitBranch className="h-4 w-4 text-fuchsia-500 mb-1" />
                    <div className="text-sm font-bold mt-1">{AI_MODEL_INFO.nextUpdate}</div>
                    <div className="text-[10px] text-muted-foreground">Next scheduled update</div>
                  </div>
                </div>

                {/* Data sources */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-violet-500" /> Data Sources Used
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {AI_MODEL_INFO.dataSources.map((src) => {
                      const Icon = src.icon
                      return (
                        <div
                          key={src.label}
                          className="flex items-center justify-between rounded-lg border border-border bg-card/60 dark:bg-card/30 p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn('p-1.5 rounded-md', src.classes)}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[11px] font-medium">{src.label}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-muted-foreground">{src.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* How AI works */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-violet-500" /> How ChandraCycle&apos;s AI Works
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {AI_MODEL_INFO.howItWorks.map((step, i) => (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="relative rounded-lg border border-violet-100 dark:border-violet-900/30 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/30 dark:from-violet-950/15 dark:to-fuchsia-950/10 p-3"
                      >
                        <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                          {step.step}
                        </div>
                        <h5 className="text-[11px] font-semibold mt-2 mb-1">{step.title}</h5>
                        <p className="text-[10px] text-muted-foreground leading-snug">{step.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3">
                  <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Privacy first:</strong> Your data never leaves your device unencrypted.
                    All predictions are computed locally or in an anonymized, HIPAA-compliant pipeline. You can delete your
                    data and reset the model anytime from Settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ═══ PREDICTIONS TAB: Section 3 ═══ */}
        <TabsContent value="predictions" className="mt-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 flex-wrap"
          >
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" /> AI Predictions Dashboard
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                7-day forecasts for mood, energy, sleep, stress, productivity, and cravings.
              </p>
            </div>
            {PREDICTIONS.length > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Updated 2h ago · Live model
              </Badge>
            )}
          </motion.div>

          {PREDICTIONS.length === 0 ? (
            <Card className="border-dashed border-violet-200 dark:border-violet-900/50">
              <CardContent className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-3">
                  <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm font-medium text-foreground">No predictions yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Insights appear after you log some data. 7-day forecasts for mood, energy,
                  sleep, stress, productivity, and cravings will generate here once ChandraCycle
                  has at least a few weeks of your cycle, mood, and symptom logs to model from.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREDICTIONS.map((p, i) => (
                <ForecastCard key={p.id} prediction={p} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ PATTERNS TAB: Sections 4 + 5 ═══ */}
        <TabsContent value="patterns" className="mt-4 space-y-6">
          {/* Section 4: Pattern Detection Engine */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 flex-wrap mb-4"
            >
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Network className="h-5 w-5 text-violet-500" /> Pattern Detection Engine
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  AI-discovered correlations from {AI_MODEL_INFO.dataPoints.toLocaleString()} of your data points.
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 gap-1">
                <Sparkles className="h-3 w-3" /> {PATTERNS.length} patterns found
              </Badge>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PATTERNS.length === 0 ? (
                <div className="col-span-full">
                  <Card className="border-dashed border-violet-200 dark:border-violet-900/50">
                    <CardContent className="flex flex-col items-center justify-center py-14 px-4 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-3">
                        <Network className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No patterns detected yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Insights appear after you log some data. ChandraCycle&apos;s pattern engine
                        will surface recurring correlations — like cycle-day mood dips or hydration→cramp
                        links — once you have a few weeks of consistent logs.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                PATTERNS.map((p, i) => (
                  <PatternCard key={p.id} pattern={p} index={i} />
                ))
              )}
            </div>
          </div>

          {/* Section 5: Correlation Matrix */}
          {CORRELATION_MATRIX.length > 0 && KEY_CORRELATIONS.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="glass border-violet-200/40 dark:border-violet-800/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                        <Grid3x3 className="h-4 w-4" />
                      </div>
                      Correlation Matrix
                    </CardTitle>
                    <CardDescription className="mt-1">
                      How your health metrics influence each other (-1.0 to +1.0)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-rose-500" /> Strong negative
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-slate-300/50" /> Neutral
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-emerald-500" /> Strong positive
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Matrix grid */}
                  <div className="lg:col-span-3">
                    <div className="overflow-x-auto">
                      <div className="min-w-[400px]">
                        {/* Column headers */}
                        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${MATRIX_VARIABLES.length}, 1fr)` }}>
                          <div />
                          {MATRIX_VARIABLES.map((v) => (
                            <div key={v} className="text-center text-[10px] font-semibold text-muted-foreground pb-2">
                              {v}
                            </div>
                          ))}
                        </div>
                        {/* Rows */}
                        {CORRELATION_MATRIX.map((row, ri) => (
                          <div
                            key={ri}
                            className="grid items-center"
                            style={{ gridTemplateColumns: `80px repeat(${MATRIX_VARIABLES.length}, 1fr)` }}
                          >
                            <div className="text-[10px] font-semibold text-muted-foreground pr-2 text-right">
                              {MATRIX_VARIABLES[ri]}
                            </div>
                            {row.map((val, ci) => {
                              const isSelf = ri === ci
                              return (
                                <div key={ci} className="p-0.5">
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: ri * 0.05 + ci * 0.03, duration: 0.3 }}
                                    whileHover={{ scale: 1.08 }}
                                    className={cn(
                                      'aspect-square rounded-md flex items-center justify-center text-[10px] font-bold cursor-default transition-shadow hover:shadow-md',
                                      correlationColor(val),
                                      isSelf && 'ring-2 ring-violet-400 ring-offset-1',
                                      Math.abs(val) >= 0.6 ? 'text-white' : Math.abs(val) >= 0.3 ? 'text-foreground' : 'text-muted-foreground'
                                    )}
                                    title={`${MATRIX_VARIABLES[ri]} ↔ ${MATRIX_VARIABLES[ci]}: ${val.toFixed(2)} (${correlationText(val)})`}
                                  >
                                    {isSelf ? '1.0' : val.toFixed(2)}
                                  </motion.div>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                      Hover any cell for details. Diagonal cells (self-correlation) are always 1.00. Color intensity reflects
                      correlation strength — emerald = positive, rose = negative.
                    </p>
                  </div>

                  {/* Key correlations */}
                  <div className="lg:col-span-2 space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
                      <Link2 className="h-4 w-4 text-violet-500" /> Key Correlations
                    </h4>
                    {KEY_CORRELATIONS.map((c, i) => (
                      <motion.div
                        key={c.pair}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-lg border border-border bg-card/60 dark:bg-card/30 p-2.5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold">{c.pair}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] gap-0.5',
                              c.value > 0
                                ? 'border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400'
                                : 'border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-400'
                            )}
                          >
                            {c.value > 0 ? '+' : ''}{c.value.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug">{c.insight}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          ) : (
            <Card className="border-dashed border-violet-200 dark:border-violet-900/50">
              <CardContent className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-3">
                  <Grid3x3 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm font-medium text-foreground">No correlation matrix yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Insights appear after you log some data. The correlation matrix — showing how
                  your sleep, mood, energy, stress, water, and cramps interact — will compute
                  automatically once ChandraCycle has enough paired data points.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ TRENDS TAB: Section 6 ═══ */}
        <TabsContent value="trends" className="mt-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500" /> Health Trends Analytics
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Long-term patterns across mood, symptoms, sleep, cycle regularity, and behavior correlations.
            </p>
          </motion.div>

          {MOOD_TREND_90.length === 0 && SYMPTOM_TREND_90.length === 0 && SLEEP_TREND_90.length === 0 && CYCLE_REGULARITY_12.length === 0 && SLEEP_MOOD_SCATTER.length === 0 ? (
            // ── Empty state: not enough history for trend charts ──
            <Card className="border-dashed border-violet-200 dark:border-violet-900/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-3">
                  <TrendingUp className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm font-medium text-foreground">No trends yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Insights appear after you log some data. Long-term trend charts — 90-day mood,
                  symptom severity, sleep quality, 12-month cycle regularity, and sleep-vs-mood
                  scatter — will populate here as your tracking history grows.
                </p>
              </CardContent>
            </Card>
          ) : (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 90-day mood trend — AreaChart */}
            {MOOD_TREND_90.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="glass border-violet-200/40 dark:border-violet-800/30 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Smile className="h-4 w-4 text-amber-500" /> 90-Day Mood Trend
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] gap-0.5 text-emerald-600 border-emerald-300">
                      <ArrowUpRight className="h-3 w-3" /> +8% vs prior
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px]">Daily mood score (0–100)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOOD_TREND_90} margin={{ top: 5, right: 8, bottom: 0, left: -22 }}>
                        <defs>
                          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.7} />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickCount={6} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
                        <Area type="monotone" dataKey="value" name="Mood" stroke="#a855f7" strokeWidth={2} fill="url(#moodGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )}

            {/* 90-day symptom severity — LineChart */}
            {SYMPTOM_TREND_90.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <Card className="glass border-violet-200/40 dark:border-violet-800/30 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4 text-rose-500" /> 90-Day Symptom Severity
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] gap-0.5 text-emerald-600 border-emerald-300">
                      <ArrowDownRight className="h-3 w-3" /> -12% improving
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px]">Daily symptom severity score (0–100)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={SYMPTOM_TREND_90} margin={{ top: 5, right: 8, bottom: 0, left: -22 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,63,94,0.1)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickCount={6} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
                        <Line type="monotone" dataKey="value" name="Severity" stroke="#f43f5e" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )}

            {/* 90-day sleep quality — LineChart */}
            {SLEEP_TREND_90.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="glass border-violet-200/40 dark:border-violet-800/30 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Moon className="h-4 w-4 text-indigo-500" /> 90-Day Sleep Quality
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] gap-0.5 text-emerald-600 border-emerald-300">
                      <ArrowUpRight className="h-3 w-3" /> +5% vs prior
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px]">Daily sleep quality score (0–100)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={SLEEP_TREND_90} margin={{ top: 5, right: 8, bottom: 0, left: -22 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickCount={6} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
                        <Line type="monotone" dataKey="value" name="Sleep" stroke="#6366f1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )}

            {/* Cycle regularity 12 months — BarChart */}
            {CYCLE_REGULARITY_12.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <Card className="glass border-violet-200/40 dark:border-violet-800/30 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4 text-violet-500" /> Cycle Regularity — 12 Months
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] gap-0.5 text-emerald-600 border-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> 92% regular
                    </Badge>
                  </div>
                  <CardDescription className="text-[11px]">Cycle length (days) by month — bars colored by variance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={CYCLE_REGULARITY_12} margin={{ top: 5, right: 8, bottom: 0, left: -22 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[24, 34]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <ReferenceLine y={28} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} />
                        <ReferenceLine y={32} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
                        <Bar dataKey="length" name="Cycle length" radius={[4, 4, 0, 0]}>
                          {CYCLE_REGULARITY_12.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.variance <= 1 ? '#a855f7' : entry.variance <= 2 ? '#c084fc' : '#e9d5ff'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )}
          </div>

          {/* Correlation scatter plot — full width */}
          {SLEEP_MOOD_SCATTER.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="glass border-violet-200/40 dark:border-violet-800/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Grid3x3 className="h-4 w-4 text-fuchsia-500" /> Sleep Hours vs Mood Score
                    </CardTitle>
                    <CardDescription className="text-[11px]">Each dot = one night + next-day mood (30 nights)</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] gap-0.5 border-emerald-300 text-emerald-600">
                    <Link2 className="h-3 w-3" /> r = +0.72
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                      <XAxis
                        type="number"
                        dataKey="sleep"
                        name="Sleep hours"
                        domain={[4, 10]}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Sleep (hours)', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: 'oklch(0.5 0.03 325)' } }}
                      />
                      <YAxis
                        type="number"
                        dataKey="mood"
                        name="Mood score"
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Mood', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'oklch(0.5 0.03 325)' } }}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Sleep vs Mood" data={SLEEP_MOOD_SCATTER} fill="#a855f7" fillOpacity={0.65} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}
          </>
          )}
        </TabsContent>

        {/* ═══ RECOMMENDATIONS TAB: Section 7 ═══ */}
        <TabsContent value="recommendations" className="mt-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 flex-wrap"
          >
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-violet-500" /> AI Recommendations Engine
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Personalized, evidence-based recommendations across 4 categories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3" /> {addedRecs.size} added
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" /> {RECOMMENDATIONS.length} total
              </Badge>
            </div>
          </motion.div>

          {RECOMMENDATIONS.length === 0 ? (
            <Card className="border-dashed border-violet-200 dark:border-violet-900/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-3">
                  <Lightbulb className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm font-medium text-foreground">No recommendations yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Insights appear after you log some data. ChandraCycle will generate personalized,
                  evidence-based recommendations across nutrition, exercise, lifestyle, and
                  self-care — each tied to your actual tracked patterns — as your history grows.
                </p>
              </CardContent>
            </Card>
          ) : (
            REC_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const recs = recsByCategory[cat.id]
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-md`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">{cat.label}</h3>
                      <p className="text-[11px] text-muted-foreground">{recs.length} recommendations · cycle-synced</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recs.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        rec={rec}
                        onAdd={handleAddRec}
                        added={addedRecs.has(rec.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )
            })
          )}
        </TabsContent>

        {/* ═══ RISK TAB: Section 8 ═══ */}
        <TabsContent value="risk" className="mt-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 flex-wrap"
          >
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-violet-500" /> Risk Assessment
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-calculated risk scores for common women&apos;s health conditions.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" /> Discuss with doctor
            </Button>
          </motion.div>

          {/* Risk overview banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="border-amber-200/60 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/60 to-rose-50/40 dark:from-amber-950/20 dark:to-rose-950/15">
              <CardContent className="py-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[12px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Important:</strong> These AI risk scores are{' '}
                  <strong>not a medical diagnosis</strong>. They are pattern-based indicators to help you start informed
                  conversations with your healthcare provider. Always consult a licensed physician for diagnosis and treatment.
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk cards */}
          {RISK_ASSESSMENTS.length === 0 ? (
            <Card className="border-dashed border-violet-200 dark:border-violet-900/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40 mb-3">
                  <ShieldAlert className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm font-medium text-foreground">No risk assessments yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Insights appear after you log some data. ChandraCycle will compute AI risk
                  scores for common women&apos;s health conditions — PCOS, PMS/PMDD, iron &amp;
                  vitamin D deficiency, thyroid — once you have enough cycle, symptom, and
                  lifestyle logs. These scores are not a medical diagnosis; always consult a
                  licensed physician.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RISK_ASSESSMENTS.map((r, i) => (
                <RiskCard key={r.id} risk={r} index={i} />
              ))}
            </div>
          )}

          {/* Risk summary radar */}
          {RISK_ASSESSMENTS.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="glass border-violet-200/40 dark:border-violet-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                    <Activity className="h-4 w-4" />
                  </div>
                  Risk Profile Overview
                </CardTitle>
                <CardDescription>Your risk scores visualized across all tracked conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
                  <div className="lg:col-span-3 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={RISK_ASSESSMENTS.map(r => ({ condition: r.condition.replace(' Risk', ''), risk: r.riskScore }))}>
                        <PolarGrid stroke="rgba(139,92,246,0.2)" />
                        <PolarAngleAxis dataKey="condition" tick={{ fontSize: 11, fill: 'oklch(0.5 0.03 325)' }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} axisLine={false} />
                        <Radar
                          name="Risk Score"
                          dataKey="risk"
                          stroke="#a855f7"
                          strokeWidth={2}
                          fill="#a855f7"
                          fillOpacity={0.35}
                        />
                        <Tooltip content={<ChartTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    {RISK_ASSESSMENTS.map((r) => {
                      const colors = riskColors[r.riskLevel]
                      return (
                        <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card/60 dark:bg-card/30 p-2.5">
                          <span className="text-[11px] font-medium">{r.condition}</span>
                          <Badge variant="outline" className={cn('text-[10px] capitalize', colors.bg, colors.text, 'border-0')}>
                            {r.riskLevel} · {r.riskScore}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-violet-200/40 dark:border-violet-800/30 bg-gradient-to-br from-violet-50/40 to-fuchsia-50/20 dark:from-violet-950/15 dark:to-fuchsia-950/10 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow">
            <Quote className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              &ldquo;Knowledge of your patterns is the first step to thriving — not just surviving — your cycle.&rdquo;
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              ChandraCycle AI · {AI_MODEL_INFO.dataPoints.toLocaleString()} data points · {AI_MODEL_INFO.accuracy}% accuracy · Updated {AI_MODEL_INFO.lastUpdated}
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-0 gap-1 shrink-0">
            <Crown className="h-3 w-3" /> Premium
          </Badge>
        </div>
      </motion.div>
    </div>
  )
}
