'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  addDays,
  differenceInDays,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  subMonths,
  addMonths,
} from 'date-fns'
import {
  Droplets,
  Heart,
  Brain,
  Sparkles,
  CalendarDays,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Activity,
  Moon,
  Sun,
  Thermometer,
  Zap,
  CircleDot,
  Clock,
  FileText,
  Plus,
  Check,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

// ─── Configuration (kept — these are phase metadata, not user data) ─────────

interface CyclePhase {
  name: string
  startDay: number
  endDay: number
  color: string
  bgColor: string
  lightColor: string
  description: string
  hormones: { estrogen: number; progesterone: number; lh: number; fsh: number }
  icon: React.ReactNode
}

const PHASES: CyclePhase[] = [
  {
    name: 'Menstrual',
    startDay: 1,
    endDay: 5,
    color: '#e11d48',
    bgColor: 'rgba(225, 29, 72, 0.15)',
    lightColor: '#fecdd3',
    description: 'Uterine lining sheds. Estrogen and progesterone are at their lowest.',
    hormones: { estrogen: 15, progesterone: 5, lh: 10, fsh: 20 },
    icon: <Droplets className="h-4 w-4" />,
  },
  {
    name: 'Follicular',
    startDay: 6,
    endDay: 12,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    lightColor: '#fbcfe8',
    description: 'Estrogen rises as follicles develop. Energy and mood improve.',
    hormones: { estrogen: 65, progesterone: 15, lh: 20, fsh: 50 },
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    name: 'Ovulation',
    startDay: 13,
    endDay: 15,
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    lightColor: '#fed7aa',
    description: 'LH surges, egg is released. Peak fertility window.',
    hormones: { estrogen: 90, progesterone: 25, lh: 95, fsh: 40 },
    icon: <Sun className="h-4 w-4" />,
  },
  {
    name: 'Luteal',
    startDay: 16,
    endDay: 28,
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    lightColor: '#e9d5ff',
    description: 'Progesterone peaks. PMS symptoms may appear.',
    hormones: { estrogen: 45, progesterone: 80, lh: 10, fsh: 10 },
    icon: <Moon className="h-4 w-4" />,
  },
]

interface SymptomItem {
  id: string
  label: string
  icon: React.ReactNode
}

const SYMPTOMS: SymptomItem[] = [
  { id: 'cramps', label: 'Cramps', icon: <Zap className="h-4 w-4" /> },
  { id: 'headache', label: 'Headache', icon: <Brain className="h-4 w-4" /> },
  { id: 'bloating', label: 'Bloating', icon: <Droplets className="h-4 w-4" /> },
  { id: 'acne', label: 'Acne', icon: <CircleDot className="h-4 w-4" /> },
  { id: 'fatigue', label: 'Fatigue', icon: <Moon className="h-4 w-4" /> },
  { id: 'backache', label: 'Backache', icon: <Activity className="h-4 w-4" /> },
  { id: 'nausea', label: 'Nausea', icon: <Thermometer className="h-4 w-4" /> },
  { id: 'breast_tenderness', label: 'Breast Tenderness', icon: <Heart className="h-4 w-4" /> },
]

// ─── Helper Functions ─────────────────────────────────────────────────

function getPhaseForCycleDay(day: number, cycleLength: number): CyclePhase {
  // Map cycle day to phase based on cycle length
  const ovulationDay = cycleLength - 14
  const periodEnd = Math.min(5, cycleLength / 4)
  if (day <= periodEnd) return PHASES[0]
  if (day < ovulationDay - 1) return PHASES[1]
  if (day >= ovulationDay - 1 && day <= ovulationDay + 1) return PHASES[2]
  return PHASES[3]
}

// ─── Cycle data type ──────────────────────────────────────────────────

interface CycleEntry {
  id: string
  startDate: string
  endDate?: string | null
  cycleLength: number
  periodLength: number
  ovulationDate?: string | null
  fertilityWindowStart?: string | null
  fertilityWindowEnd?: string | null
  notes?: string | null
}

// ─── Sub-Components ───────────────────────────────────────────────────

function CycleWheel({
  cycleDay,
  cycleLength,
}: {
  cycleDay: number
  cycleLength: number
}) {
  const currentPhase = getPhaseForCycleDay(cycleDay, cycleLength)

  const wheelData = PHASES.map((phase) => ({
    name: phase.name,
    value: phase.endDay - phase.startDay + 1,
    color: phase.color,
    lightColor: phase.lightColor,
  }))

  const totalAngle = 360
  const anglePerDay = totalAngle / cycleLength
  const currentAngle = (cycleDay - 0.5) * anglePerDay

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center"
    >
      <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="200" cy="200" r="195" fill="none" stroke="rgba(244,114,182,0.1)" strokeWidth="1" />
          <circle
            cx="200"
            cy="200"
            r="170"
            fill="none"
            stroke={currentPhase.color}
            strokeWidth="4"
            strokeDasharray="8 345"
            strokeDashoffset={-(currentAngle / 360) * 2 * Math.PI * 170 + 2}
            strokeLinecap="round"
            filter="url(#glow)"
            opacity="0.8"
          />
        </svg>

        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={wheelData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="78%"
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
                paddingAngle={2}
              >
                {wheelData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={PHASES[index].name === currentPhase.name ? 1 : 0.5}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const phase = PHASES.find((p) => p.name === data.name)
                    return (
                      <div className="rounded-xl bg-white/90 backdrop-blur-md border border-pink-100 px-3 py-2 shadow-lg">
                        <p className="font-semibold text-sm" style={{ color: phase?.color }}>{data.name}</p>
                        <p className="text-xs text-muted-foreground">Days {phase?.startDay}–{phase?.endDay}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Cycle Day
            </p>
            <motion.p
              key={cycleDay}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="text-5xl sm:text-6xl font-bold"
              style={{ color: currentPhase.color }}
            >
              {cycleDay}
            </motion.p>
            <Badge
              className="mt-2 px-3 py-1 text-xs font-medium border-0"
              style={{ backgroundColor: currentPhase.bgColor, color: currentPhase.color }}
            >
              {currentPhase.icon}
              <span className="ml-1">{currentPhase.name} Phase</span>
            </Badge>
          </motion.div>
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
          <circle
            cx={200 + 155 * Math.cos(((currentAngle - 90) * Math.PI) / 180)}
            cy={200 + 155 * Math.sin(((currentAngle - 90) * Math.PI) / 180)}
            r="8"
            fill="white"
            stroke={currentPhase.color}
            strokeWidth="3"
            filter="url(#glow)"
          />
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {PHASES.map((phase) => (
          <motion.div
            key={phase.name}
            whileHover={{ scale: 1.05 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              phase.name === currentPhase.name ? 'shadow-md' : 'opacity-60'
            }`}
            style={{
              backgroundColor: phase.bgColor,
              color: phase.color,
              border: `1px solid ${phase.name === currentPhase.name ? phase.color : 'transparent'}`,
            }}
          >
            {phase.icon}
            <span>{phase.name}</span>
            <span className="opacity-70">D{phase.startDay}–D{phase.endDay}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Calendar View ────────────────────────────────────────────────────

function CycleCalendar({
  cycleStart,
  cycleLength,
  periodLength,
}: {
  cycleStart: Date
  cycleLength: number
  periodLength: number
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function isPeriodDay(date: Date): boolean {
    const dayDiff = differenceInDays(date, cycleStart) + 1
    const cycleDay = ((dayDiff - 1) % cycleLength) + 1
    return dayDiff >= 1 && cycleDay >= 1 && cycleDay <= periodLength
  }

  function isOvulationDay(date: Date): boolean {
    const dayDiff = differenceInDays(date, cycleStart) + 1
    const cycleDay = ((dayDiff - 1) % cycleLength) + 1
    return dayDiff >= 1 && cycleDay === cycleLength - 14
  }

  function isFertileWindow(date: Date): boolean {
    const dayDiff = differenceInDays(date, cycleStart) + 1
    const cycleDay = ((dayDiff - 1) % cycleLength) + 1
    return dayDiff >= 1 && cycleDay >= cycleLength - 18 && cycleDay <= cycleLength - 12
  }

  function isPredictedPeriod(date: Date): boolean {
    const nextPeriodStart = addDays(cycleStart, cycleLength)
    const dayDiff = differenceInDays(date, nextPeriodStart)
    return dayDiff >= 0 && dayDiff < periodLength
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((p) => subMonths(p, 1))} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((p) => addMonths(p, 1))} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((wd) => (
          <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-1">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, currentMonth)
          const periodDay = isPeriodDay(d)
          const ovDay = isOvulationDay(d)
          const fertile = isFertileWindow(d)
          const predicted = isPredictedPeriod(d)
          const isToday = isSameDay(d, new Date())

          let bgClass = ''
          let textClass = ''
          let dotColor = ''
          let label = ''

          if (!inMonth) {
            textClass = 'text-muted-foreground opacity-30'
          } else if (periodDay) {
            bgClass = 'bg-rose-500/20'
            textClass = 'text-rose-700 dark:text-rose-300 font-semibold'
            dotColor = '#e11d48'
            label = '🩸'
          } else if (ovDay) {
            bgClass = 'bg-orange-400/20'
            textClass = 'text-orange-700 dark:text-orange-300 font-semibold'
            dotColor = '#f97316'
            label = '🥚'
          } else if (fertile) {
            bgClass = 'bg-orange-300/10'
            textClass = 'text-orange-600 dark:text-orange-400'
            dotColor = '#fb923c'
          } else if (predicted) {
            bgClass = 'bg-rose-300/10'
            textClass = 'text-rose-500 dark:text-rose-400'
            dotColor = '#fb7185'
            label = '✦'
          }

          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1 }}
              className={`relative flex flex-col items-center justify-center h-9 sm:h-10 rounded-lg text-xs transition-all cursor-default ${bgClass} ${textClass} ${
                isToday ? 'ring-2 ring-rose-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-950' : ''
              }`}
            >
              <span>{format(d, 'd')}</span>
              {dotColor && (
                <div className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: dotColor }} />
              )}
              {label && (
                <span className="absolute -top-0.5 -right-0.5 text-[8px] leading-none">{label}</span>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-400/40" />
          <span className="text-muted-foreground">Period</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-400/20 border border-orange-400/40" />
          <span className="text-muted-foreground">Ovulation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-300/10 border border-orange-300/30" />
          <span className="text-muted-foreground">Fertile Window</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-300/10 border border-rose-300/30" />
          <span className="text-muted-foreground">Predicted Period</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Cycle Timeline ───────────────────────────────────────────────────

function CycleTimeline({ cycleDay, cycleLength }: { cycleDay: number; cycleLength: number }) {
  const currentPhase = getPhaseForCycleDay(cycleDay, cycleLength)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-4"
    >
      <div className="relative">
        <div className="flex h-3 rounded-full overflow-hidden">
          {PHASES.map((phase) => {
            const widthPct = ((phase.endDay - phase.startDay + 1) / cycleLength) * 100
            const isActive = phase.name === currentPhase.name
            return (
              <motion.div
                key={phase.name}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: phase.color,
                  opacity: isActive ? 1 : 0.4,
                  transformOrigin: 'left',
                }}
                className="h-full first:rounded-l-full last:rounded-r-full relative"
              />
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${((cycleDay - 0.5) / cycleLength) * 100}%` }}
        >
          <div className="w-5 h-5 rounded-full bg-white border-2 shadow-md -translate-x-1/2" style={{ borderColor: currentPhase.color }}>
            <div
              className="w-2 h-2 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ backgroundColor: currentPhase.color }}
            />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PHASES.map((phase) => {
          const isActive = phase.name === currentPhase.name
          return (
            <motion.div
              key={phase.name}
              whileHover={{ y: -2 }}
              className={`relative rounded-xl p-3 border transition-all ${
                isActive ? 'shadow-lg' : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                backgroundColor: phase.bgColor,
                borderColor: isActive ? phase.color : 'transparent',
              }}
            >
              {isActive && (
                <Badge
                  className="absolute -top-2 right-2 text-[10px] px-2 border-0"
                  style={{ backgroundColor: phase.color, color: 'white' }}
                >
                  Current
                </Badge>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: phase.color, color: 'white' }}>
                  {phase.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: phase.color }}>
                    {phase.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Days {phase.startDay}–{phase.endDay}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{phase.description}</p>
              <div className="space-y-1.5">
                <HormoneBar label="Estrogen" value={phase.hormones.estrogen} color="#ec4899" />
                <HormoneBar label="Progesterone" value={phase.hormones.progesterone} color="#a855f7" />
                <HormoneBar label="LH" value={phase.hormones.lh} color="#f97316" />
                <HormoneBar label="FSH" value={phase.hormones.fsh} color="#06b6d4" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function HormoneBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-20 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] w-6 text-right text-muted-foreground">{value}</span>
    </div>
  )
}

// ─── Log Period ───────────────────────────────────────────────────────

function LogPeriodSection({
  userId,
  onLogged,
  defaultCycleLength,
  defaultPeriodLength,
}: {
  userId: string | undefined
  onLogged: () => void
  defaultCycleLength: number
  defaultPeriodLength: number
}) {
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const [flowIntensity, setFlowIntensity] = useState<string>('medium')
  const [startDate, setStartDate] = useState(todayIso)
  const [duration, setDuration] = useState(String(defaultPeriodLength))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [logged, setLogged] = useState(false)

  const flowOptions = [
    { value: 'light', label: 'Light', icon: <Droplets className="h-3 w-3" />, color: '#f9a8d4' },
    { value: 'medium', label: 'Medium', icon: <Droplets className="h-4 w-4" />, color: '#ec4899' },
    { value: 'heavy', label: 'Heavy', icon: <Droplets className="h-5 w-5" />, color: '#be185d' },
  ]

  const handleLog = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const periodLen = Number(duration) || defaultPeriodLength
      const endDate = format(addDays(new Date(startDate), periodLen - 1), 'yyyy-MM-dd')
      await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          startDate,
          endDate,
          cycleLength: defaultCycleLength,
          periodLength: periodLen,
          notes: notes ? `${flowIntensity} flow. ${notes}` : `${flowIntensity} flow.`,
        }),
      })
      setLogged(true)
      setTimeout(() => {
        setLogged(false)
        onLogged()
      }, 1500)
    } finally {
      setSaving(false)
    }
  }

  const handleQuickLogToday = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          startDate: todayIso,
          cycleLength: defaultCycleLength,
          periodLength: defaultPeriodLength,
          notes: `${flowIntensity} flow. Started today.`,
        }),
      })
      onLogged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="space-y-5"
    >
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Quick Log</Label>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Start Period Today
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-rose-600">Log Period Start</DialogTitle>
                <DialogDescription>
                  Record that your period started today ({format(new Date(), 'MMM d, yyyy')}).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">
                  This will update your cycle tracking and predictions. Your cycle day will reset to Day 1.
                </p>
                <Button
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={handleQuickLogToday}
                  disabled={saving || !userId}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Period Started
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
          >
            <CircleDot className="h-3.5 w-3.5" />
            Log Spotting
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Duration (days)</Label>
            <Input
              type="number"
              min="1"
              max="14"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Flow Intensity</Label>
          <div className="flex gap-2">
            {flowOptions.map((opt) => (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFlowIntensity(opt.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                  flowIntensity === opt.value
                    ? 'shadow-md'
                    : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
                style={{
                  borderColor: flowIntensity === opt.value ? opt.color : undefined,
                  backgroundColor: flowIntensity === opt.value ? `${opt.color}20` : undefined,
                }}
              >
                <span style={{ color: opt.color }}>{opt.icon}</span>
                <span className="text-xs font-medium">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about your period..."
            className="min-h-[60px] text-sm resize-none"
          />
        </div>

        <Button
          onClick={handleLog}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white"
          disabled={saving || !userId}
        >
          {logged ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Logged Successfully!
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Log Period
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Symptom Quick Log ────────────────────────────────────────────────

function SymptomQuickLog({ userId }: { userId: string | undefined }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id]
      } else {
        next[id] = 3
      }
      return next
    })
  }

  const setSeverity = (id: string, level: number) => {
    setSelectedSymptoms((prev) => ({ ...prev, [id]: level }))
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      await Promise.all(
        Object.entries(selectedSymptoms).map(([category, severity]) =>
          fetch('/api/symptoms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, category, severity, date: today }),
          })
        )
      )
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        setSelectedSymptoms({})
      }, 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SYMPTOMS.map((symptom) => {
          const isSelected = symptom.id in selectedSymptoms
          const severity = selectedSymptoms[symptom.id] || 0
          return (
            <motion.div key={symptom.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button
                onClick={() => toggleSymptom(symptom.id)}
                className={`w-full flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                  isSelected
                    ? 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/30 shadow-sm'
                    : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                <span className={isSelected ? 'text-rose-500' : 'text-muted-foreground'}>{symptom.icon}</span>
                <span
                  className={`text-xs font-medium ${
                    isSelected ? 'text-rose-700 dark:text-rose-300' : 'text-muted-foreground'
                  }`}
                >
                  {symptom.label}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="w-full"
                  >
                    <div className="flex justify-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSeverity(symptom.id, level)
                          }}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            level <= severity ? 'border-rose-400 bg-rose-400' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {severity <= 1 ? 'Mild' : severity <= 3 ? 'Moderate' : 'Severe'}
                    </p>
                  </motion.div>
                )}
              </button>
            </motion.div>
          )
        })}
      </div>

      {Object.keys(selectedSymptoms).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200"
        >
          <p className="text-xs text-rose-700 dark:text-rose-300">
            {Object.keys(selectedSymptoms).length} symptom{Object.keys(selectedSymptoms).length > 1 ? 's' : ''} selected
          </p>
          <Button
            size="sm"
            className="h-7 bg-rose-500 hover:bg-rose-600 text-white text-xs"
            onClick={handleSave}
            disabled={saving || !userId}
          >
            <Check className="h-3 w-3 mr-1" />
            {saved ? 'Saved!' : 'Save Symptoms'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Period Predictions ───────────────────────────────────────────────

function PeriodPredictions({
  cycleStart,
  cycleLength,
  periodLength,
  historyCount,
}: {
  cycleStart: Date
  cycleLength: number
  periodLength: number
  historyCount: number
}) {
  const nextPeriodStart = addDays(cycleStart, cycleLength)
  const daysUntilNext = differenceInDays(nextPeriodStart, new Date())
  // Confidence grows with history but caps at 90% — purely a heuristic, not a fake number.
  const confidence = Math.min(90, Math.round(50 + historyCount * 8))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="space-y-4"
    >
      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border border-rose-100 dark:border-rose-900/40">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Next Period In</p>
        <motion.p
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
          className="text-4xl font-bold text-rose-600"
        >
          {Math.max(0, daysUntilNext)}
        </motion.p>
        <p className="text-sm text-muted-foreground">days</p>
        <p className="text-xs text-rose-500 font-medium mt-1">{format(nextPeriodStart, 'EEEE, MMMM d')}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-3 rounded-xl bg-black/5 dark:bg-white/5">
          <CalendarDays className="h-4 w-4 mx-auto mb-1 text-rose-500" />
          <p className="text-lg font-bold text-rose-600">{cycleLength}</p>
          <p className="text-[10px] text-muted-foreground">Cycle Length</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-black/5 dark:bg-white/5">
          <Droplets className="h-4 w-4 mx-auto mb-1 text-pink-500" />
          <p className="text-lg font-bold text-pink-600">{periodLength}</p>
          <p className="text-[10px] text-muted-foreground">Period Length</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-black/5 dark:bg-white/5">
          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
          <p className="text-lg font-bold text-emerald-600">{confidence}%</p>
          <p className="text-[10px] text-muted-foreground">Confidence</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Prediction Confidence</span>
          <span className="text-xs font-medium text-emerald-600">{confidence}%</span>
        </div>
        <Progress value={confidence} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-rose-400 [&>div]:to-emerald-400" />
        <p className="text-[10px] text-muted-foreground">Based on {historyCount} tracked cycle{historyCount === 1 ? '' : 's'}</p>
      </div>
    </motion.div>
  )
}

// ─── Historical Cycles Table ──────────────────────────────────────────

function HistoricalCyclesTable({ cycles }: { cycles: CycleEntry[] }) {
  if (cycles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No cycle history yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Your logged cycles will appear here. Log your first period to begin building your history.
        </p>
      </div>
    )
  }

  // Try to extract flow from notes for legacy entries; default to "Medium" if absent
  function parseFlow(notes?: string | null): string {
    if (!notes) return 'Medium'
    const lower = notes.toLowerCase()
    if (lower.includes('heavy')) return 'Heavy'
    if (lower.includes('light')) return 'Light'
    if (lower.includes('medium')) return 'Medium'
    return 'Medium'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="max-h-64 overflow-y-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Start Date</TableHead>
              <TableHead className="text-xs">End Date</TableHead>
              <TableHead className="text-xs text-center">Period</TableHead>
              <TableHead className="text-xs text-center">Cycle</TableHead>
              <TableHead className="text-xs">Flow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cycles.map((cycle) => (
              <TableRow key={cycle.id}>
                <TableCell className="text-xs font-medium">
                  {format(new Date(cycle.startDate), 'MMM d, yy')}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {cycle.endDate ? format(new Date(cycle.endDate), 'MMM d, yy') : '—'}
                </TableCell>
                <TableCell className="text-xs text-center">
                  <Badge variant="outline" className="text-[10px] px-1.5 border-rose-200 text-rose-600">
                    {cycle.periodLength}d
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-center">
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {cycle.cycleLength}d
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {(() => {
                    const flow = parseFlow(cycle.notes)
                    return (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          flow === 'Heavy'
                            ? 'text-rose-600'
                            : flow === 'Medium'
                            ? 'text-pink-500'
                            : 'text-pink-400'
                        }`}
                      >
                        <Droplets className="h-3 w-3" />
                        {flow}
                      </span>
                    )
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────

function EmptyStateHero({ onLogClick }: { onLogClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 mb-4">
        <Droplets className="h-7 w-7 text-rose-500" />
      </div>
      <h3 className="text-lg font-semibold">Welcome to your Cycle Tracker</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        Log your first period to unlock cycle predictions, fertility windows, ovulation tracking, and personalized phase insights.
      </p>
      <Button className="mt-4 bg-rose-500 hover:bg-rose-600 text-white" onClick={onLogClick}>
        <Plus className="h-4 w-4 mr-2" />
        Log your first period
      </Button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────

export default function PeriodModule() {
  const userProfile = useAppStore((s) => s.userProfile)
  const [cycles, setCycles] = useState<CycleEntry[]>([])
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
    fetch(`/api/cycles?userId=${encodeURIComponent(userProfile.id)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CycleEntry[]) => {
        if (!cancelled) {
          setCycles(Array.isArray(data) ? data : [])
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

  const defaultCycleLength = userProfile?.cycleLength ?? 28
  const defaultPeriodLength = userProfile?.periodLength ?? 5

  // Latest cycle = most recent startDate
  const latestCycle = cycles[0]
  const cycleStart = latestCycle ? new Date(latestCycle.startDate) : null
  const cycleLength = latestCycle?.cycleLength ?? defaultCycleLength
  const periodLength = latestCycle?.periodLength ?? defaultPeriodLength

  const cycleDay = useMemo(() => {
    if (!cycleStart) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(cycleStart)
    start.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (diffDays < 1) return null
    return ((diffDays - 1) % cycleLength) + 1
  }, [cycleStart, cycleLength])

  const refresh = () => setRefreshKey((k) => k + 1)

  return (
    <div className="w-full space-y-6 pb-4">
      {/* Hero: Cycle Wheel */}
      <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Cycle Tracker
              </CardTitle>
              <CardDescription className="text-xs">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
                {cycleDay ? ` — Day ${cycleDay} of ${cycleLength}` : ''}
              </CardDescription>
            </div>
            {cycleDay && (
              <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-0">
                <Clock className="h-3 w-3 mr-1" />
                {Math.max(0, cycleLength - cycleDay)} days left
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex justify-center pt-2 pb-6">
          {loading ? (
            <div className="h-[320px] sm:h-[380px] w-full animate-pulse rounded-2xl bg-muted/40" />
          ) : cycleDay ? (
            <CycleWheel cycleDay={cycleDay} cycleLength={cycleLength} />
          ) : (
            <EmptyStateHero onLogClick={() => {
              const tab = document.querySelector<HTMLButtonElement>('[data-log-tab="true"]')
              tab?.click()
            }} />
          )}
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl h-10">
          <TabsTrigger value="calendar" className="text-xs gap-1 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs gap-1 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700">
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="log" data-log-tab="true" className="text-xs gap-1 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log</span>
          </TabsTrigger>
          <TabsTrigger value="symptoms" className="text-xs gap-1 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700">
            <Heart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Symptoms</span>
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-rose-500" />
                Cycle Calendar
              </CardTitle>
              <CardDescription className="text-xs">
                Track your period, ovulation, and fertile window
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cycleStart ? (
                <CycleCalendar
                  cycleStart={cycleStart}
                  cycleLength={cycleLength}
                  periodLength={periodLength}
                />
              ) : (
                <EmptyStateHero onLogClick={() => {
                  const tab = document.querySelector<HTMLButtonElement>('[data-log-tab="true"]')
                  tab?.click()
                }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-500" />
                Cycle Timeline
              </CardTitle>
              <CardDescription className="text-xs">Your cycle phases and hormone levels</CardDescription>
            </CardHeader>
            <CardContent>
              {cycleDay ? (
                <CycleTimeline cycleDay={cycleDay} cycleLength={cycleLength} />
              ) : (
                <EmptyStateHero onLogClick={() => {
                  const tab = document.querySelector<HTMLButtonElement>('[data-log-tab="true"]')
                  tab?.click()
                }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Log Tab */}
        <TabsContent value="log">
          <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-rose-500" />
                Log Period
              </CardTitle>
              <CardDescription className="text-xs">Record your period details</CardDescription>
            </CardHeader>
            <CardContent>
              <LogPeriodSection
                userId={userProfile?.id}
                onLogged={refresh}
                defaultCycleLength={defaultCycleLength}
                defaultPeriodLength={defaultPeriodLength}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Symptoms Tab */}
        <TabsContent value="symptoms">
          <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Symptom Quick Log
              </CardTitle>
              <CardDescription className="text-xs">
                Tap symptoms you are experiencing and rate their severity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SymptomQuickLog userId={userProfile?.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom row: Predictions + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-500" />
              Period Predictions
            </CardTitle>
            <CardDescription className="text-xs">AI-powered cycle forecasting</CardDescription>
          </CardHeader>
          <CardContent>
            {cycleStart ? (
              <PeriodPredictions
                cycleStart={cycleStart}
                cycleLength={cycleLength}
                periodLength={periodLength}
                historyCount={cycles.length}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No predictions yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Log at least one period to enable next-period predictions and confidence scoring.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-rose-500" />
              Cycle History
            </CardTitle>
            <CardDescription className="text-xs">Your recent cycle records</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <HistoricalCyclesTable cycles={cycles} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
