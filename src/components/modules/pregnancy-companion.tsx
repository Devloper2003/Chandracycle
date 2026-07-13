'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Baby,
  CalendarHeart,
  Syringe,
  Pill,
  BookHeart,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Clock,
  Heart,
  Sparkles,
  Activity,
  TrendingUp,
  AlertCircle,
  Timer,
  Star,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

// ─── Configuration (kept — educational reference & options) ─────────────
const TOTAL_WEEKS = 40

const babyData: Record<number, { size: string; emoji: string; weight: string; length: string; milestone: string }> = {
  4: { size: 'Poppy Seed', emoji: '🌱', weight: '~1g', length: '~2mm', milestone: 'Embryo implants; neural tube forming' },
  8: { size: 'Raspberry', emoji: '🫐', weight: '~1g', length: '~1.6cm', milestone: 'Heart beating; limbs forming' },
  12: { size: 'Plum', emoji: '🫒', weight: '~14g', length: '~5.4cm', milestone: 'Fingers & toes formed; reflexes begin' },
  16: { size: 'Avocado', emoji: '🥑', weight: '~100g', length: '~11.6cm', milestone: 'Facial expressions; eyes sensitive to light' },
  20: { size: 'Banana', emoji: '🍌', weight: '~300g', length: '~25cm', milestone: 'Halfway! You may feel kicks' },
  24: { size: 'Mango', emoji: '🥭', weight: '~600g', length: '~30cm', milestone: 'Lungs developing branches; viable outside womb' },
  28: { size: 'Eggplant', emoji: '🍆', weight: '~1kg', length: '~37.6cm', milestone: 'Third trimester; eyes opening' },
  32: { size: 'Squash', emoji: '🥒', weight: '~1.8kg', length: '~42cm', milestone: 'Bones hardening; practicing breathing' },
  36: { size: 'Honeydew', emoji: '🍈', weight: '~2.6kg', length: '~47cm', milestone: 'Rapid brain growth; head down position' },
  40: { size: 'Watermelon', emoji: '🍉', weight: '~3.5kg', length: '~50cm', milestone: 'Full term! Ready to meet you' },
}

const timelineMilestones: { week: number; label: string; detail: string }[] = [
  { week: 4, label: 'Implantation', detail: 'Embryo attaches to uterine wall' },
  { week: 8, label: 'Heartbeat', detail: 'Heart begins to beat' },
  { week: 12, label: 'First Trimester End', detail: 'Risk of miscarriage drops' },
  { week: 16, label: 'Gender Visible', detail: 'Can see on ultrasound' },
  { week: 20, label: 'Halfway', detail: 'Anatomy scan ultrasound' },
  { week: 24, label: 'Viability', detail: 'Baby could survive outside' },
  { week: 28, label: 'Third Trimester', detail: 'Final stretch begins' },
  { week: 32, label: 'Positioning', detail: 'Baby moves head-down' },
  { week: 36, label: 'Early Term', detail: 'Lungs nearly mature' },
  { week: 40, label: 'Full Term', detail: 'Ready for birth!' },
]

const commonSymptoms = [
  { id: 's1', name: 'Morning Sickness', icon: '🤢' },
  { id: 's2', name: 'Fatigue', icon: '😴' },
  { id: 's3', name: 'Back Pain', icon: '🦴' },
  { id: 's4', name: 'Heartburn', icon: '🔥' },
  { id: 's5', name: 'Swollen Feet', icon: '🦶' },
  { id: 's6', name: 'Frequent Urination', icon: '🚽' },
  { id: 's7', name: 'Braxton Hicks', icon: '💫' },
  { id: 's8', name: 'Insomnia', icon: '🌙' },
  { id: 's9', name: 'Cravings', icon: '🍫' },
  { id: 's10', name: 'Mood Swings', icon: '🎭' },
  { id: 's11', name: 'Round Ligament Pain', icon: '⚡' },
  { id: 's12', name: 'Shortness of Breath', icon: '😮‍💨' },
]

interface Appointment {
  id: string
  title: string
  date: string
  time: string
  doctor: string
  type: string
}

interface Vaccination {
  id: string
  name: string
  dueWeek: number
  completed: boolean
  notes: string
}

interface Medicine {
  id: string
  name: string
  dosage: string
  time: string
  takenToday: boolean
}

interface JournalEntry {
  id: string
  date: string
  content: string
  mood: string
}

// ─── Component ────────────────────────────────────────────────────────
export default function PregnancyModule() {
  const userProfile = useAppStore((s) => s.userProfile)
  const [currentWeek, setCurrentWeek] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkedSymptoms, setCheckedSymptoms] = useState<string[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [newAppt, setNewAppt] = useState({ title: '', date: '', time: '', doctor: '', type: '' })
  const [newJournal, setNewJournal] = useState({ content: '', mood: '😊' })
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [timelineScroll, setTimelineScroll] = useState(0)

  // Fetch real pregnancy tracking data
  useEffect(() => {
    if (!userProfile?.id) {
      // Defer to avoid cascading renders (react-hooks/set-state-in-effect)
      let cancelled = false
      Promise.resolve().then(() => { if (!cancelled) setLoading(false) })
      return () => { cancelled = true }
    }
    let cancelled = false
    fetch(`/api/pregnancy?userId=${encodeURIComponent(userProfile.id)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((records: Array<{ week: number; date: string }> = []) => {
        if (cancelled) return
        if (Array.isArray(records) && records.length > 0) {
          // Latest pregnancy record's week = current week
          setCurrentWeek(records[0].week ?? null)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userProfile?.id])

  const DAYS_REMAINING = currentWeek ? (TOTAL_WEEKS - currentWeek) * 7 : 0
  const TRIMESTER = currentWeek ? (currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3) : null
  const baby = currentWeek ? babyData[currentWeek] || babyData[20] : null
  const progressPercent = currentWeek ? (currentWeek / TOTAL_WEEKS) * 100 : 0
  const trimesterLabel = TRIMESTER === 1 ? 'First' : TRIMESTER === 2 ? 'Second' : TRIMESTER === 3 ? 'Third' : '—'
  const trimesterColor = TRIMESTER === 1 ? 'bg-purple-100 text-purple-700' : TRIMESTER === 2 ? 'bg-violet-100 text-violet-700' : TRIMESTER === 3 ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-muted text-muted-foreground'

  const toggleSymptom = (id: string) => {
    setCheckedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const addAppointment = () => {
    if (!newAppt.title || !newAppt.date) return
    const appt: Appointment = {
      id: Date.now().toString(),
      title: newAppt.title,
      date: newAppt.date,
      time: newAppt.time || 'TBD',
      doctor: newAppt.doctor || 'TBD',
      type: newAppt.type || 'Checkup',
    }
    setAppointments([...appointments, appt].sort((a, b) => a.date.localeCompare(b.date)))
    setNewAppt({ title: '', date: '', time: '', doctor: '', type: '' })
  }

  const toggleVaccination = (id: string) => {
    setVaccinations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, completed: !v.completed } : v))
    )
  }

  const toggleMedicine = (id: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, takenToday: !m.takenToday } : m))
    )
  }

  const addJournalEntry = () => {
    if (!newJournal.content.trim()) return
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      content: newJournal.content,
      mood: newJournal.mood,
    }
    setJournalEntries([entry, ...journalEntries])
    setNewJournal({ content: '', mood: '😊' })
    setShowJournalForm(false)
  }

  const moods = ['😊', '🥰', '😴', '🤢', '😢', '😤', '🤗', '😌']

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-80 bg-muted rounded-2xl" />
      </div>
    )
  }

  if (!currentWeek || !baby) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-purple-600 flex items-center gap-2">
              <Stethoscope className="h-7 w-7" />
              Pregnancy Companion
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track your pregnancy journey week by week
            </p>
          </div>
        </motion.div>
        <Card className="border-purple-200/50">
          <CardContent className="py-2">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/40 mb-4">
                <Baby className="h-7 w-7 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold">Welcome to Pregnancy Companion</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Log your current pregnancy week to unlock baby growth updates, milestone tracking, appointment reminders, vaccination schedules, and a private journal.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-purple-600 flex items-center gap-2">
            <Stethoscope className="h-7 w-7" />
            Pregnancy Companion
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your journey through {trimesterLabel} Trimester — {DAYS_REMAINING} days to go
          </p>
        </div>
        <Badge className={`${trimesterColor} border-0 px-3 py-1 text-sm self-start hover:${trimesterColor}`}>
          <Baby className="h-3.5 w-3.5 mr-1.5" />
          {trimesterLabel} Trimester
        </Badge>
      </motion.div>

      {/* Top Row: Week Indicator + Baby Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Week Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full border-purple-200/50 bg-gradient-to-br from-purple-50/80 to-violet-50/50">
            <CardHeader>
              <CardTitle className="text-base text-purple-700 flex items-center gap-2">
                <CalendarHeart className="h-4 w-4" />
                Week Indicator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                  className="inline-flex items-baseline gap-1"
                >
                  <span className="text-5xl sm:text-6xl font-bold text-purple-700">{currentWeek}</span>
                  <span className="text-2xl text-purple-500 font-medium">/40</span>
                </motion.div>
                <p className="text-sm text-purple-600 mt-1 font-medium">Weeks Pregnant</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Week 1</span>
                  <span>{Math.round(progressPercent)}% Complete</span>
                  <span>Week 40</span>
                </div>
                <Progress value={progressPercent} className="h-3 bg-purple-100 [&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-violet-500" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white/60 p-3 text-center">
                  <p className="text-xl font-bold text-purple-600">{TRIMESTER}</p>
                  <p className="text-[10px] text-muted-foreground">Trimester</p>
                </div>
                <div className="rounded-lg bg-white/60 p-3 text-center">
                  <p className="text-xl font-bold text-violet-600">{DAYS_REMAINING}</p>
                  <p className="text-[10px] text-muted-foreground">Days Left</p>
                </div>
                <div className="rounded-lg bg-white/60 p-3 text-center">
                  <p className="text-xl font-bold text-fuchsia-600">~6</p>
                  <p className="text-[10px] text-muted-foreground">Months</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Baby Growth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full border-purple-200/50">
            <CardHeader>
              <CardTitle className="text-base text-purple-700 flex items-center gap-2">
                <Baby className="h-4 w-4" />
                Baby Growth
              </CardTitle>
              <CardDescription>Development at week {currentWeek}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                <div className="text-5xl">{baby.emoji}</div>
                <div>
                  <p className="text-lg font-bold text-purple-700">Size of a {baby.size}</p>
                  <p className="text-xs text-muted-foreground">at Week {currentWeek}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-purple-50/70 p-3 text-center border border-purple-100/50">
                  <p className="text-lg font-semibold text-purple-700">{baby.weight}</p>
                  <p className="text-[10px] text-muted-foreground">Approx. Weight</p>
                </div>
                <div className="rounded-lg bg-violet-50/70 p-3 text-center border border-violet-100/50">
                  <p className="text-lg font-semibold text-violet-700">{baby.length}</p>
                  <p className="text-[10px] text-muted-foreground">Crown-to-Rump</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-fuchsia-50/50 border border-fuchsia-100/50">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-fuchsia-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-fuchsia-700">This Week&apos;s Milestone</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{baby.milestone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 40-Week Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-purple-200/50">
          <CardHeader>
            <CardTitle className="text-base text-purple-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              40-Week Timeline
            </CardTitle>
            <CardDescription>Key milestones throughout your pregnancy</CardDescription>
            <CardAction>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTimelineScroll(Math.max(0, timelineScroll - 200))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTimelineScroll(timelineScroll + 200)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full" id="timeline-scroll">
              <div className="relative pb-4" style={{ minWidth: `${TOTAL_WEEKS * 28}px` }}>
                {/* Week markers */}
                <div className="flex items-end gap-0">
                  {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
                    const week = i + 1
                    const isCurrent = week === currentWeek
                    const isPast = week < currentWeek
                    const milestone = timelineMilestones.find((m) => m.week === week)
                    const isTrimesterStart = week === 1 || week === 14 || week === 28

                    return (
                      <div key={week} className="flex flex-col items-center relative" style={{ minWidth: '28px' }}>
                        {/* Milestone flag */}
                        {milestone && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.01 }}
                            className="absolute -top-14 flex flex-col items-center z-10"
                          >
                            <Badge className={`${isPast ? 'bg-purple-100 text-purple-700' : 'bg-violet-100 text-violet-700'} border-0 text-[8px] px-1.5 py-0 h-5 whitespace-nowrap`}>
                              {milestone.label}
                            </Badge>
                            <div className={`w-0.5 h-2 ${isPast ? 'bg-purple-300' : 'bg-violet-300'}`} />
                          </motion.div>
                        )}
                        {/* Week bar */}
                        <div
                          className={`
                            w-5 h-8 rounded-sm transition-colors
                            ${isCurrent ? 'bg-purple-500 shadow-md shadow-purple-200' : ''}
                            ${isPast && !isCurrent ? 'bg-purple-300/60' : ''}
                            ${!isPast && !isCurrent ? 'bg-purple-100/40' : ''}
                          `}
                        />
                        {/* Label */}
                        <span className={`text-[8px] mt-1 ${isCurrent ? 'text-purple-700 font-bold' : 'text-muted-foreground'}`}>
                          {week % 4 === 0 || isCurrent || isTrimesterStart ? week : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ScrollArea>

                {/* Trimester labels */}
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1">
                  <span>1st Trimester</span>
                  <span>2nd Trimester</span>
                  <span>3rd Trimester</span>
                </div>
                <div className="flex gap-0 mt-1 rounded-full overflow-hidden h-1.5">
                  <div className="bg-purple-200 flex-1" />
                  <div className="bg-violet-300 flex-1" />
                  <div className="bg-fuchsia-200 flex-1" />
                </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Middle Row: Symptom Tracker + Appointment Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symptom Tracker */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full border-purple-200/50">
            <CardHeader>
              <CardTitle className="text-base text-purple-700 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Symptom Tracker
              </CardTitle>
              <CardDescription>Log how you&apos;re feeling today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {commonSymptoms.map((symptom) => {
                  const isActive = checkedSymptoms.includes(symptom.id)
                  return (
                    <motion.button
                      key={symptom.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`
                        flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all
                        ${isActive
                          ? 'border-purple-300 bg-purple-50 text-purple-700 shadow-sm'
                          : 'border-border/50 bg-card text-muted-foreground hover:border-purple-200'
                        }
                      `}
                    >
                      <span className="text-base">{symptom.icon}</span>
                      <span className="truncate">{symptom.name}</span>
                      {isActive && <Check className="h-3 w-3 text-purple-500 ml-auto shrink-0" />}
                    </motion.button>
                  )
                })}
              </div>
              <div className="mt-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100/50">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-purple-700">{checkedSymptoms.length}</span> symptom{checkedSymptoms.length !== 1 ? 's' : ''} logged today
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointment Manager */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full border-purple-200/50">
            <CardHeader>
              <CardTitle className="text-base text-purple-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Appointment Manager
              </CardTitle>
              <CardDescription>Upcoming appointments</CardDescription>
              <CardAction>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Appointment</DialogTitle>
                      <DialogDescription>Schedule a new appointment</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Title</Label>
                        <Input
                          placeholder="e.g., Ultrasound"
                          value={newAppt.title}
                          onChange={(e) => setNewAppt({ ...newAppt, title: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={newAppt.date}
                            onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Time</Label>
                          <Input
                            type="time"
                            value={newAppt.time}
                            onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Doctor</Label>
                          <Input
                            placeholder="Dr. Name"
                            value={newAppt.doctor}
                            onChange={(e) => setNewAppt({ ...newAppt, doctor: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Type</Label>
                          <Input
                            placeholder="e.g., Checkup"
                            value={newAppt.type}
                            onChange={(e) => setNewAppt({ ...newAppt, type: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button onClick={addAppointment} className="bg-purple-500 hover:bg-purple-600 text-white">
                          Add Appointment
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2.5">
                  {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CalendarHeart className="h-7 w-7 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">No appointments yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Tap “Add Appointment” above to log your scans, lab work, and checkups.
                      </p>
                    </div>
                  ) : (
                    appointments.map((appt, idx) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-purple-50 border border-purple-100 shrink-0">
                        <span className="text-sm font-bold text-purple-700">{appt.date.slice(8)}</span>
                        <span className="text-[9px] text-purple-500 uppercase">
                          {new Date(appt.date).toLocaleString('en', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{appt.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{appt.time}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{appt.doctor}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] h-5 bg-purple-50 text-purple-700 border-0 shrink-0">
                        {appt.type}
                      </Badge>
                    </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row: Vaccination + Medicine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vaccination Tracker */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full border-purple-200/50">
            <CardHeader>
              <CardTitle className="text-base text-purple-700 flex items-center gap-2">
                <Syringe className="h-4 w-4" />
                Vaccination Tracker
              </CardTitle>
              <CardDescription>Required vaccinations during pregnancy</CardDescription>
            </CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Syringe className="h-7 w-7 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">No vaccinations logged</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Add vaccinations recommended by your doctor to track them here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {vaccinations.map((vax, idx) => (
                      <motion.div
                        key={vax.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 + idx * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-purple-200 transition-colors"
                      >
                        <Checkbox
                          id={`vax-${vax.id}`}
                          checked={vax.completed}
                          onCheckedChange={() => toggleVaccination(vax.id)}
                          className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`vax-${vax.id}`}
                            className={`text-sm font-medium cursor-pointer ${vax.completed ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {vax.name}
                          </Label>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[9px] h-4 bg-purple-50 text-purple-600 border-0">
                              Due: Week {vax.dueWeek}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{vax.notes}</p>
                        </div>
                        {vax.completed && (
                          <Check className="h-4 w-4 text-purple-500 shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-purple-50/50 border border-purple-100/50">
                    <span className="text-xs text-muted-foreground">
                      <span className="font-medium text-purple-700">{vaccinations.filter((v) => v.completed).length}</span> of {vaccinations.length} completed
                    </span>
                    <Progress
                      value={(vaccinations.filter((v) => v.completed).length / vaccinations.length) * 100}
                      className="w-20 h-1.5 bg-purple-100 [&>div]:bg-purple-500"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Medicine Reminder */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="h-full border-purple-200/50">
            <CardHeader>
              <CardTitle className="text-base text-purple-700 flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Medicine Reminder
              </CardTitle>
              <CardDescription>Daily supplements & medications</CardDescription>
            </CardHeader>
            <CardContent>
              {medicines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Pill className="h-7 w-7 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">No medicines tracked</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Log your prenatal vitamins and supplements to get daily reminders here.
                  </p>
                </div>
              ) : (
                <>
              <div className="space-y-2">
                {['Morning', 'Evening'].map((timeSlot) => (
                  <div key={timeSlot}>
                    <p className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-1.5">
                      <Timer className="h-3 w-3" />
                      {timeSlot}
                    </p>
                    <div className="space-y-1.5">
                      {medicines
                        .filter((m) => m.time === timeSlot)
                        .map((med) => (
                          <div
                            key={med.id}
                            onClick={() => toggleMedicine(med.id)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              med.takenToday
                                ? 'border-purple-200 bg-purple-50/50'
                                : 'border-border/50 hover:border-purple-200'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                med.takenToday
                                  ? 'border-purple-500 bg-purple-500'
                                  : 'border-muted-foreground/30'
                              }`}
                            >
                              {med.takenToday && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${med.takenToday ? 'line-through text-muted-foreground' : ''}`}>
                                {med.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{med.dosage}</p>
                            </div>
                            {med.takenToday && (
                              <Badge className="bg-green-50 text-green-700 border-0 text-[9px] px-1.5 py-0">
                                Taken
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                    {timeSlot === 'Morning' && <Separator className="my-3" />}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-purple-50/50 border border-purple-100/50">
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-purple-700">{medicines.filter((m) => m.takenToday).length}</span> of {medicines.length} taken today
                </span>
                <Progress
                  value={(medicines.filter((m) => m.takenToday).length / medicines.length) * 100}
                  className="w-20 h-1.5 bg-purple-100 [&>div]:bg-purple-500"
                />
              </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pregnancy Journal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-purple-200/50">
          <CardHeader>
            <CardTitle className="text-base text-purple-700 flex items-center gap-2">
              <BookHeart className="h-4 w-4" />
              Pregnancy Journal
            </CardTitle>
            <CardDescription>Capture your thoughts and memories</CardDescription>
            <CardAction>
              <Button
                size="sm"
                onClick={() => setShowJournalForm(!showJournalForm)}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Entry
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {showJournalForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 p-4 rounded-lg bg-purple-50/50 border border-purple-100">
                    <div className="space-y-1.5">
                      <Label className="text-xs">How are you feeling?</Label>
                      <div className="flex gap-2">
                        {moods.map((m) => (
                          <button
                            key={m}
                            onClick={() => setNewJournal({ ...newJournal, mood: m })}
                            className={`text-2xl p-1.5 rounded-lg transition-all ${
                              newJournal.mood === m ? 'bg-purple-100 scale-110' : 'hover:bg-muted'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">What&apos;s on your mind?</Label>
                      <Textarea
                        placeholder="Write about your day, feelings, or any memories you want to capture..."
                        value={newJournal.content}
                        onChange={(e) => setNewJournal({ ...newJournal, content: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={addJournalEntry}
                      size="sm"
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      Save Entry
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ScrollArea className="max-h-72">
              <div className="space-y-3">
                {journalEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <BookHeart className="h-7 w-7 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">No journal entries yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Tap “New Entry” above to start capturing your pregnancy memories.
                    </p>
                  </div>
                ) : (
                  journalEntries.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.85 + idx * 0.05 }}
                      className="p-4 rounded-lg border border-border/50 hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{entry.mood}</span>
                        <span className="text-xs font-medium text-purple-600">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Badge variant="secondary" className="text-[9px] h-4 bg-purple-50 text-purple-600 border-0 ml-auto">
                          Week {currentWeek}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{entry.content}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
