'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Baby,
  Thermometer,
  CalendarDays,
  Sparkles,
  Heart,
  Clock,
  Droplets,
  ChevronDown,
  ChevronRight,
  Check,
  Save,
  Activity,
  Info,
  Star,
  Zap,
  Target,
  CircleDot,
  Flame,
  Leaf,
  Plus,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useAppStore } from '@/lib/store'

// ─── Configuration (kept — educational content) ─────────────────────────────

const DEFAULT_CYCLE_LENGTH = 28

type FertilityLevel = 'low' | 'medium' | 'high' | 'peak'

type CervicalMucus = 'Dry' | 'Sticky' | 'Creamy' | 'Watery' | 'Egg-white'
type OPKResult = 'Positive' | 'Negative' | null

const MUCUS_OPTIONS: CervicalMucus[] = ['Dry', 'Sticky', 'Creamy', 'Watery', 'Egg-white']

const CONCEPTION_PHASES = [
  {
    id: 'before',
    title: 'Before Ovulation',
    subtitle: 'Days 8-13',
    icon: Leaf,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    tips: [
      'Begin tracking cervical mucus daily',
      'Measure BBT every morning before getting up',
      'Start OPK testing from cycle day 10',
      'Maintain a healthy diet rich in folic acid',
      'Consider prenatal vitamins with DHA',
    ],
  },
  {
    id: 'ovulation',
    title: 'Ovulation Day',
    subtitle: 'Day 14',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    tips: [
      'This is your most fertile day — prioritize intercourse',
      'Egg-white cervical mucus indicates peak fertility',
      'Positive OPK confirms LH surge',
      'The egg lives 12-24 hours after release',
      'Intercourse every 24-48 hours maximizes chances',
    ],
  },
  {
    id: 'after',
    title: 'After Ovulation',
    subtitle: 'Days 15-28',
    icon: Heart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    tips: [
      'BBT should remain elevated if conception occurred',
      'Avoid stress — cortisol can affect implantation',
      'Continue light exercise and healthy eating',
      'Wait at least 10 days post-ovulation to test',
      'Watch for early signs: mild cramping, fatigue',
    ],
  },
]

// ─── Helper Functions ──────────────────────────────────────────────

function getLevelColor(level: FertilityLevel): string {
  switch (level) {
    case 'peak':
      return 'bg-red-400 text-white'
    case 'high':
      return 'bg-orange-400 text-white'
    case 'medium':
      return 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
    case 'low':
      return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  }
}

// Compute the fertility level for a given cycle day
function getLevelForCycleDay(day: number, ovulationDay: number, fertileStart: number, fertileEnd: number): FertilityLevel {
  if (day === ovulationDay) return 'peak'
  if (day >= fertileStart && day <= fertileEnd) {
    if (day === ovulationDay - 1 || day === ovulationDay + 1) return 'high'
    if (day === fertileStart || day === fertileEnd) return 'medium'
    return 'high'
  }
  if (day >= ovulationDay - 3 && day < fertileStart) return 'medium'
  if (day > fertileEnd && day <= fertileEnd + 2) return 'medium'
  return 'low'
}

// ─── Animation Variants ────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Empty State ──────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  icon: typeof Activity
  title: string
  description: string
  ctaLabel?: string
  onCta?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
      {ctaLabel && onCta && (
        <Button size="sm" className="mt-4" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}

// ─── Cycle / Fertility data types ──────────────────────────────────

interface CycleEntry {
  id: string
  startDate: string
  cycleLength: number
  periodLength: number
  ovulationDate?: string | null
  fertilityWindowStart?: string | null
  fertilityWindowEnd?: string | null
}

interface FertilityEntry {
  id: string
  date: string
  basalTemp?: number | null
  cervicalMucus?: string | null
  opkResult?: string | null
  intercourse?: boolean
  fertilityScore?: number
  ovulationConfirmed?: boolean
  notes?: string | null
}

function deriveCycleDay(startISO: string, cycleLength: number): number | null {
  const start = new Date(startISO)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (diff < 1) return null
  return ((diff - 1) % cycleLength) + 1
}

// ─── Sub-Components ────────────────────────────────────────────────

function FertilityScoreHero({
  cycleDay,
  cycleLength,
  ovulationDay,
  fertileStart,
  fertileEnd,
  latestFertilityScore,
  hasCycle,
  onLogPeriod,
}: {
  cycleDay: number | null
  cycleLength: number
  ovulationDay: number
  fertileStart: number
  fertileEnd: number
  latestFertilityScore: number | null
  hasCycle: boolean
  onLogPeriod: () => void
}) {
  if (!hasCycle) {
    return (
      <motion.div variants={itemVariants}>
        <Card className="border-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-orange-950/20 dark:via-card dark:to-amber-950/20 shadow-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Baby className="h-5 w-5" />
              Fertility Score
            </CardTitle>
            <CardDescription>Your daily fertility assessment based on multiple signals</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Baby}
              title="No cycle logged yet"
              description="Log your period start date to unlock your fertility score, ovulation predictions, and fertile window calculations."
              ctaLabel="Log your period"
              onCta={onLogPeriod}
            />
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Compute a fertility score for today based on cycle day position relative to ovulation
  const day = cycleDay ?? 1
  const daysToOvulation = ovulationDay - day
  const inFertileWindow = day >= fertileStart && day <= fertileEnd
  let score: number
  if (day === ovulationDay) score = 95
  else if (inFertileWindow) score = 70
  else if (Math.abs(daysToOvulation) <= 3) score = 45
  else score = 20
  // Override with the user's latest fertility log if available
  if (latestFertilityScore !== null) score = latestFertilityScore

  const scoreColor = score >= 85 ? '#22c55e' : score >= 60 ? '#f97316' : score >= 30 ? '#f59e0b' : '#ef4444'
  const scoreLabel = score >= 85 ? 'Excellent' : score >= 60 ? 'Good' : score >= 30 ? 'Fair' : 'Low'
  const fertileDaysCount = fertileEnd - fertileStart + 1

  const radius = 70
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-orange-950/20 dark:via-card dark:to-amber-950/20 shadow-lg overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <Baby className="h-5 w-5" />
            Fertility Score
          </CardTitle>
          <CardDescription>Your daily fertility assessment based on cycle position and logged signals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <div className="relative flex-shrink-0">
              <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                <circle stroke="currentColor" className="text-gray-200 dark:text-gray-700" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
                <motion.circle
                  stroke={scoreColor}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-4xl font-bold"
                  style={{ color: scoreColor }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  {score}
                </motion.span>
                <span className="text-xs text-muted-foreground font-medium mt-0.5">out of 100</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 gap-4 w-full">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-orange-100 dark:border-orange-900/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Days to Ovulation</p>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
                    {daysToOvulation >= 0 ? daysToOvulation : cycleLength + daysToOvulation}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-amber-100 dark:border-amber-900/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fertile Days This Cycle</p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{fertileDaysCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-green-100 dark:border-green-900/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fertility Status</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{scoreLabel}</p>
                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                      {inFertileWindow ? 'In Window' : 'Off Window'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-orange-100 dark:border-orange-900/30">
            <span className="text-xs text-muted-foreground mr-1">Score Zones:</span>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-xs text-muted-foreground">0-30</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500" /><span className="text-xs text-muted-foreground">30-60</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-500" /><span className="text-xs text-muted-foreground">60-85</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-xs text-muted-foreground">85-100</span></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function OvulationCalendar({
  cycleDay,
  cycleLength,
  ovulationDay,
  fertileStart,
  fertileEnd,
}: {
  cycleDay: number | null
  cycleLength: number
  ovulationDay: number
  fertileStart: number
  fertileEnd: number
}) {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const cycleData = useMemo(() => {
    return Array.from({ length: cycleLength }, (_, i) => {
      const day = i + 1
      return {
        day,
        level: getLevelForCycleDay(day, ovulationDay, fertileStart, fertileEnd),
        isOvulation: day === ovulationDay,
        isCurrent: day === cycleDay,
        isFertileWindow: day >= fertileStart && day <= fertileEnd,
      }
    })
  }, [cycleLength, ovulationDay, fertileStart, fertileEnd, cycleDay])

  // Pad to a multiple of 7 for grid
  const padded = useMemo(() => {
    const paddedArr = [...cycleData]
    while (paddedArr.length % 7 !== 0) paddedArr.push(null as unknown as (typeof cycleData)[0])
    return paddedArr
  }, [cycleData])

  const rows = useMemo(() => {
    const result: (typeof cycleData)[number][][] = []
    for (let i = 0; i < padded.length; i += 7) {
      result.push(padded.slice(i, i + 7) as (typeof cycleData)[number][])
    }
    return result
  }, [padded])

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <CalendarDays className="h-5 w-5" />
            Ovulation Calendar
          </CardTitle>
          <CardDescription>
            {cycleLength}-day cycle view{cycleDay ? ` — Day ${cycleDay} of ${cycleLength}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-7 gap-1">
                {row.map((dayData, idx) =>
                  dayData ? (
                    <motion.div
                      key={dayData.day}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: rowIndex * 0.1 + (idx * 0.03) }}
                      className={`relative flex flex-col items-center justify-center py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-default ${getLevelColor(
                        dayData.level
                      )} ${dayData.isCurrent ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900' : ''} hover:scale-105 hover:shadow-md`}
                    >
                      <span className="text-xs">{dayData.day}</span>
                      {dayData.isOvulation && (
                        <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[8px] bg-red-500 text-white border-0">
                          O
                        </Badge>
                      )}
                      {dayData.isCurrent && (
                        <div className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </motion.div>
                  ) : (
                    <div key={`empty-${rowIndex}-${idx}`} />
                  )
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-orange-100 dark:border-orange-900/30">
            <span className="text-xs text-muted-foreground mr-1">Fertility Level:</span>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" /><span className="text-xs text-muted-foreground">Low</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900/50" /><span className="text-xs text-muted-foreground">Medium</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-400" /><span className="text-xs text-muted-foreground">High</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400" /><span className="text-xs text-muted-foreground">Peak</span></div>
            <div className="flex items-center gap-1.5 ml-2"><div className="w-3 h-3 rounded-sm border-2 border-orange-500" /><span className="text-xs text-muted-foreground">Today</span></div>
            <div className="flex items-center gap-1.5"><Badge className="h-4 min-w-4 px-1 text-[8px] bg-red-500 text-white border-0">O</Badge><span className="text-xs text-muted-foreground">Ovulation</span></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function BBTChart({ fertilityEntries }: { fertilityEntries: FertilityEntry[] }) {
  const bbtData = useMemo(
    () =>
      fertilityEntries
        .filter((e) => e.basalTemp !== null && e.basalTemp !== undefined)
        .slice(0, 30)
        .reverse()
        .map((e) => ({
          day: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          bbt: e.basalTemp as number,
        })),
    [fertilityEntries]
  )

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Thermometer className="h-5 w-5" />
                BBT &amp; Ovulation Chart
              </CardTitle>
              <CardDescription>Basal body temperature pattern across your cycle</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400">
              <Droplets className="h-3 w-3 mr-1" />
              Fertile Window
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {bbtData.length === 0 ? (
            <EmptyState
              icon={Thermometer}
              title="No BBT readings yet"
              description="Log your basal body temperature daily using the Fertility Logging form to visualize your ovulation pattern here."
            />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={bbtData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} className="text-muted-foreground" />
                  <YAxis domain={[96.5, 98.5]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}°F`} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #f97316', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}°F`, 'BBT']}
                    labelFormatter={(label: string) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="bbt"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#f97316', stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                    name="BBT"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-orange-100 dark:border-orange-900/30">
            <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-orange-500 rounded" /><span className="text-xs text-muted-foreground">BBT</span></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function FertilityLoggingForm({
  userId,
  onSaved,
}: {
  userId: string | undefined
  onSaved: () => void
}) {
  const [basalTemp, setBasalTemp] = useState<string>('')
  const [selectedMucus, setSelectedMucus] = useState<CervicalMucus | null>(null)
  const [opkResult, setOpkResult] = useState<OPKResult>(null)
  const [intercourse, setIntercourse] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await fetch('/api/fertility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date: today,
          basalTemp: basalTemp ? parseFloat(basalTemp) : undefined,
          cervicalMucus: selectedMucus ? selectedMucus.toLowerCase().replace('-', '') : undefined,
          opkResult: opkResult ? opkResult.toLowerCase() : undefined,
          intercourse,
          notes: notes || undefined,
        }),
      })
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setBasalTemp('')
        setSelectedMucus(null)
        setOpkResult(null)
        setIntercourse(false)
        setNotes('')
        onSaved()
      }, 1500)
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = basalTemp || selectedMucus || opkResult

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <Activity className="h-5 w-5" />
            Fertility Logging
          </CardTitle>
          <CardDescription>Record your daily fertility signals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              Basal Body Temperature (°F)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="95.0"
                max="100.0"
                placeholder="97.5"
                value={basalTemp}
                onChange={(e) => setBasalTemp(e.target.value)}
                className="max-w-[160px]"
              />
              <span className="text-sm text-muted-foreground">°F</span>
              {basalTemp && parseFloat(basalTemp) >= 97.8 && (
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800 text-[10px]">
                  Elevated
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4 text-orange-500" />
              Cervical Mucus
            </Label>
            <div className="flex flex-wrap gap-2">
              {MUCUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedMucus(selectedMucus === option ? null : option)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    selectedMucus === option
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200 dark:shadow-orange-900/40'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-orange-600 dark:hover:bg-orange-950/30'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {selectedMucus && (
              <p className="text-xs text-muted-foreground">
                {selectedMucus === 'Egg-white' && '🌟 Most fertile — indicates peak fertility!'}
                {selectedMucus === 'Watery' && '📈 Fertility increasing — approaching ovulation'}
                {selectedMucus === 'Creamy' && '📊 Moderate fertility — transition phase'}
                {selectedMucus === 'Sticky' && '📉 Low fertility — early cycle pattern'}
                {selectedMucus === 'Dry' && '⬇️ Minimal fertility — typical post-period'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              OPK Test Result
            </Label>
            <div className="flex gap-2">
              <button
                onClick={() => setOpkResult(opkResult === 'Positive' ? null : 'Positive')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  opkResult === 'Positive'
                    ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200 dark:shadow-green-900/40'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-950/30'
                }`}
              >
                <Check className="h-4 w-4" />
                Positive
              </button>
              <button
                onClick={() => setOpkResult(opkResult === 'Negative' ? null : 'Negative')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  opkResult === 'Negative'
                    ? 'bg-gray-400 text-white border-gray-400 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                }`}
              >
                <CircleDot className="h-4 w-4" />
                Negative
              </button>
            </div>
            {opkResult === 'Positive' && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                LH surge detected! Ovulation likely within 24-36 hours.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-orange-100 dark:border-orange-900/30">
            <Checkbox
              id="intercourse"
              checked={intercourse}
              onCheckedChange={(checked) => setIntercourse(checked === true)}
              className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <Label htmlFor="intercourse" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-400" />
              Intercourse today
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-500" />
              Notes
            </Label>
            <Textarea
              placeholder="Any observations, symptoms, or thoughts..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={!isValid || isSaving || !userId}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/40"
            >
              {isSaving ? (
                <motion.div
                  className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              ) : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Log
                </>
              )}
            </Button>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-green-600 dark:text-green-400"
              >
                Entry saved successfully
              </motion.span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ConceptionPlanner({ cycleDay }: { cycleDay: number | null }) {
  const [activePhase, setActivePhase] = useState<string>('before')

  // Compute conception probability today based on cycle day (very rough heuristic)
  const conceptionProbability = useMemo(() => {
    if (!cycleDay) return 0
    const ovulationDay = DEFAULT_CYCLE_LENGTH - 14
    if (cycleDay === ovulationDay) return 28
    if (Math.abs(cycleDay - ovulationDay) === 1) return 20
    if (Math.abs(cycleDay - ovulationDay) === 2) return 12
    if (Math.abs(cycleDay - ovulationDay) <= 4) return 6
    return 2
  }, [cycleDay])

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <Star className="h-5 w-5" />
            Conception Planner
          </CardTitle>
          <CardDescription>Guidance for each phase of your fertility window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-100 dark:border-orange-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Conception Probability Today</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{conceptionProbability}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${conceptionProbability}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {cycleDay
                ? `Based on cycle day ${cycleDay} relative to predicted ovulation`
                : 'Log your period to estimate conception probability for today'}
            </p>
          </div>

          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="w-full grid grid-cols-3 bg-orange-50 dark:bg-orange-950/30">
              {CONCEPTION_PHASES.map((phase) => (
                <TabsTrigger
                  key={phase.id}
                  value={phase.id}
                  className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                >
                  <phase.icon className={`h-3.5 w-3.5 mr-1 ${phase.color}`} />
                  <span className="hidden sm:inline">{phase.title}</span>
                  <span className="sm:hidden">{phase.subtitle.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {CONCEPTION_PHASES.map((phase) => (
              <TabsContent key={phase.id} value={phase.id} className="mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-xl border ${phase.borderColor} ${phase.bgColor}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <phase.icon className={`h-5 w-5 ${phase.color}`} />
                    <div>
                      <h4 className="font-semibold text-sm">{phase.title}</h4>
                      <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {phase.tips.map((tip, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <ChevronRight className={`h-4 w-4 mt-0.5 flex-shrink-0 ${phase.color}`} />
                        <span>{tip}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Component ────────────────────────────────────────────────

export default function FertilityModule() {
  const userProfile = useAppStore((s) => s.userProfile)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  const [cycles, setCycles] = useState<CycleEntry[]>([])
  const [fertilityEntries, setFertilityEntries] = useState<FertilityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!userProfile?.id) {
      // Defer to avoid cascading renders (react-hooks/set-state-in-effect)
      let cancelled = false
      Promise.resolve().then(() => { if (!cancelled) setLoading(false) })
      return () => { cancelled = true }
    }
    let cancelled = false
    Promise.all([
      fetch(`/api/cycles?userId=${encodeURIComponent(userProfile.id)}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/fertility?userId=${encodeURIComponent(userProfile.id)}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([cyc, fert]: [CycleEntry[], FertilityEntry[]]) => {
        if (!cancelled) {
          setCycles(Array.isArray(cyc) ? cyc : [])
          setFertilityEntries(Array.isArray(fert) ? fert : [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userProfile?.id, refreshKey])

  const cycleLength = cycles[0]?.cycleLength ?? userProfile?.cycleLength ?? DEFAULT_CYCLE_LENGTH
  const latestStart = cycles[0]?.startDate ?? userProfile?.lastPeriodStart
  const cycleDay = latestStart ? deriveCycleDay(latestStart, cycleLength) : null
  const hasCycle = !!latestStart

  // Ovulation day = cycleLength - 14
  const ovulationDay = cycleLength - 14
  const fertileStart = ovulationDay - 5
  const fertileEnd = ovulationDay

  const latestFertilityScore =
    fertilityEntries.length > 0 && fertilityEntries[0].fertilityScore !== undefined
      ? fertilityEntries[0].fertilityScore
      : null

  const refresh = () => setRefreshKey((k) => k + 1)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-80 bg-muted rounded-2xl" />
      </div>
    )
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
          <Baby className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-300">Fertility Planner</h2>
          <p className="text-sm text-muted-foreground">Track, predict, and optimize your fertility journey</p>
        </div>
        {cycleDay && (
          <Badge className="ml-auto bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800 text-xs">
            <Flame className="h-3 w-3 mr-1" />
            Day {cycleDay}
          </Badge>
        )}
      </motion.div>

      <FertilityScoreHero
        cycleDay={cycleDay}
        cycleLength={cycleLength}
        ovulationDay={ovulationDay}
        fertileStart={fertileStart}
        fertileEnd={fertileEnd}
        latestFertilityScore={latestFertilityScore}
        hasCycle={hasCycle}
        onLogPeriod={() => setActiveModule('period')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OvulationCalendar
          cycleDay={cycleDay}
          cycleLength={cycleLength}
          ovulationDay={ovulationDay}
          fertileStart={fertileStart}
          fertileEnd={fertileEnd}
        />
        <BBTChart fertilityEntries={fertilityEntries} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FertilityLoggingForm userId={userProfile?.id} onSaved={refresh} />
        <ConceptionPlanner cycleDay={cycleDay} />
      </div>

      {/* AI Fertility Insights — empty state */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Sparkles className="h-5 w-5" />
              AI Fertility Insights
            </CardTitle>
            <CardDescription>Personalized analysis based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Sparkles}
              title="Personalized fertility insights coming soon"
              description="Log BBT, cervical mucus, and OPK results over a couple of cycles — ChandraCycle will surface patterns like ovulation confirmation, mucus transition signals, and cycle regularity here."
              ctaLabel="Log today's fertility signals"
              onCta={() => {
                /* Form is on the same page; user can scroll up */
              }}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
