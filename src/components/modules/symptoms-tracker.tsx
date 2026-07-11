'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HeartPulse,
  Smile,
  Check,
  Save,
  Droplets,
  Moon,
  Zap,
  TrendingUp,
  Brain,
  Activity,
  Sparkles,
  AlertCircle,
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
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────────

type MoodType = 'happy' | 'calm' | 'anxious' | 'sad' | 'irritable' | 'energetic' | 'tired' | 'neutral'

interface MoodOption {
  id: MoodType
  emoji: string
  label: string
  color: string
  score: number
}

interface SymptomOption {
  id: string
  label: string
  icon: string
}

type Severity = 'mild' | 'moderate' | 'severe'

interface SymptomState {
  checked: boolean
  severity: Severity
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MOOD_OPTIONS: MoodOption[] = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'bg-yellow-100 border-yellow-400 text-yellow-700', score: 5 },
  { id: 'calm', emoji: '😌', label: 'Calm', color: 'bg-green-100 border-green-400 text-green-700', score: 4 },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: 'bg-orange-100 border-orange-400 text-orange-700', score: 2 },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'bg-blue-100 border-blue-400 text-blue-700', score: 1 },
  { id: 'irritable', emoji: '😤', label: 'Irritable', color: 'bg-red-100 border-red-400 text-red-700', score: 1 },
  { id: 'energetic', emoji: '⚡', label: 'Energetic', color: 'bg-amber-100 border-amber-400 text-amber-700', score: 5 },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'bg-purple-100 border-purple-400 text-purple-700', score: 2 },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: 'bg-gray-100 border-gray-400 text-gray-700', score: 3 },
]

const SYMPTOM_OPTIONS: SymptomOption[] = [
  { id: 'cramps', label: 'Cramps', icon: '🩹' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'bloating', label: 'Bloating', icon: '🫧' },
  { id: 'acne', label: 'Acne', icon: '💅' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'backache', label: 'Backache', icon: '🦴' },
  { id: 'nausea', label: 'Nausea', icon: '🤢' },
  { id: 'breast_tenderness', label: 'Breast Tenderness', icon: '💗' },
  { id: 'dizziness', label: 'Dizziness', icon: '💫' },
  { id: 'insomnia', label: 'Insomnia', icon: '🌙' },
]

const ENERGY_EMOJIS = ['😴', '😪', '😐', '😊', '⚡']
const STRESS_COLORS = ['bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']
const STRESS_LABELS = ['Very Low', 'Low', 'Moderate', 'High', 'Very High']

// ─── Empty-state component ─────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
    </div>
  )
}

// ─── Custom Tooltip (defined outside render) ─────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SymptomsModule() {
  const userProfile = useAppStore((s) => s.userProfile)
  // ── State ──
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [energyLevel, setEnergyLevel] = useState([3])
  const [stressLevel, setStressLevel] = useState([2])
  const [symptoms, setSymptoms] = useState<Record<string, SymptomState>>(() => {
    const initial: Record<string, SymptomState> = {}
    SYMPTOM_OPTIONS.forEach((s) => {
      initial[s.id] = { checked: false, severity: 'mild' }
    })
    return initial
  })
  const [sleepHours, setSleepHours] = useState(7)
  const [waterIntake, setWaterIntake] = useState(4)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Real mood history (fetched from API)
  const [moodHistory, setMoodHistory] = useState<
    Array<{ id: string; mood: string; energy: number; stress: number; date: string }>
  >([])
  const [symptomHistory, setSymptomHistory] = useState<
    Array<{ id: string; category: string; severity: number; date: string }>
  >([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    if (!userProfile?.id) {
      setHistoryLoading(false)
      return
    }
    let cancelled = false
    setHistoryLoading(true)
    Promise.all([
      fetch(`/api/mood?userId=${encodeURIComponent(userProfile.id)}`).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/symptoms?userId=${encodeURIComponent(userProfile.id)}`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([moods, syms]: [Array<{ id: string; mood: string; energy: number; stress: number; date: string }>, Array<{ id: string; category: string; severity: number; date: string }>]) => {
        if (!cancelled) {
          setMoodHistory(Array.isArray(moods) ? moods : [])
          setSymptomHistory(Array.isArray(syms) ? syms : [])
          setHistoryLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userProfile?.id])

  // Derive 30-day mood/energy chart data from real mood entries
  const moodHistoryData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days: Array<{ date: string; mood: number | null; energy: number | null }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      const entry = moodHistory.find((m) => m.date?.startsWith(iso))
      const moodScore = entry
        ? MOOD_OPTIONS.find((m) => m.id === entry.mood)?.score ?? null
        : null
      days.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: moodScore,
        energy: entry ? entry.energy : null,
      })
    }
    return days
  }, [moodHistory])

  // Derive symptom frequency from real symptom entries (last 30 days)
  const symptomFrequencyData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffIso = cutoff.toISOString().split('T')[0]
    const counts = new Map<string, number>()
    symptomHistory.forEach((s) => {
      if (s.date && s.date >= cutoffIso) {
        const label = SYMPTOM_OPTIONS.find((opt) => opt.id === s.category)?.label ?? s.category
        counts.set(label, (counts.get(label) ?? 0) + 1)
      }
    })
    const palette = ['#f472b6', '#fb7185', '#e879f9', '#f9a8d4', '#fda4af', '#fecdd3', '#fbcfe8', '#e9d5ff', '#ddd6fe', '#f5d0fe']
    return Array.from(counts.entries())
      .map(([symptom, frequency], i) => ({ symptom, frequency, fill: palette[i % palette.length] }))
      .sort((a, b) => b.frequency - a.frequency)
  }, [symptomHistory])

  const hasMoodData = moodHistory.length > 0
  const hasSymptomData = symptomHistory.length > 0

  // ── Handlers ──
  const toggleSymptom = (id: string) => {
    setSymptoms((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked, severity: prev[id].checked ? 'mild' : prev[id].severity },
    }))
  }

  const setSymptomSeverity = (id: string, severity: Severity) => {
    setSymptoms((prev) => ({
      ...prev,
      [id]: { ...prev[id], severity },
    }))
  }

  const handleSave = async () => {
    if (!userProfile?.id) return
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const promises: Promise<unknown>[] = []
      // Mood entry (only if user selected a mood)
      if (selectedMood) {
        promises.push(
          fetch('/api/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userProfile.id,
              mood: selectedMood,
              energy: energyLevel[0],
              stress: stressLevel[0],
              date: today,
              notes: notes || undefined,
            }),
          })
        )
      }
      // Symptom entries (only for checked ones)
      const sevMap: Record<Severity, number> = { mild: 2, moderate: 3, severe: 4 }
      Object.entries(symptoms).forEach(([category, state]) => {
        if (state.checked) {
          promises.push(
            fetch('/api/symptoms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userProfile.id,
                category,
                severity: sevMap[state.severity],
                date: today,
              }),
            })
          )
        }
      })
      // Sleep entry
      promises.push(
        fetch('/api/sleep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            hoursSlept: sleepHours,
            quality: 3,
            date: today,
          }),
        })
      )
      // Water entry
      promises.push(
        fetch('/api/water', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userProfile.id,
            glasses: waterIntake,
            date: today,
          }),
        })
      )
      await Promise.all(promises)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const getStressColor = () => {
    const level = stressLevel[0] - 1
    return STRESS_COLORS[level] || STRESS_COLORS[0]
  }

  const checkedSymptomsCount = Object.values(symptoms).filter((s) => s.checked).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/30">
          <HeartPulse className="h-5 w-5 text-pink-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Symptoms & Mood</h2>
          <p className="text-sm text-muted-foreground">Track how you feel and discover patterns</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="bg-pink-50 dark:bg-pink-950/30 h-auto flex-wrap">
          <TabsTrigger value="today" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            📝 Today&apos;s Log
          </TabsTrigger>
          <TabsTrigger value="mood-history" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            📊 Mood History
          </TabsTrigger>
          <TabsTrigger value="patterns" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            🔍 Patterns
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">
            🧠 AI Insights
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: Today's Log
        ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="today">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ── Mood Selector ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smile className="h-4 w-4 text-pink-500" /> How are you feeling?
                  </CardTitle>
                  <CardDescription>Select your current mood</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {MOOD_OPTIONS.map((mood) => (
                      <motion.button
                        key={mood.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMood(mood.id)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                          selectedMood === mood.id
                            ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 shadow-md'
                            : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-pink-300'
                        }`}
                      >
                        <span className="text-2xl">{mood.emoji}</span>
                        <span className="text-[10px] font-medium text-muted-foreground">{mood.label}</span>
                      </motion.button>
                    ))}
                  </div>
                  {selectedMood && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-pink-600 dark:text-pink-400 mt-3 text-center font-medium"
                    >
                      You&apos;re feeling {MOOD_OPTIONS.find((m) => m.id === selectedMood)?.label.toLowerCase()} today
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Energy & Stress Sliders ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Energy & Stress
                  </CardTitle>
                  <CardDescription>Rate your current levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Energy */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Energy Level</Label>
                      <span className="text-2xl">{ENERGY_EMOJIS[energyLevel[0] - 1]}</span>
                    </div>
                    <Slider
                      value={energyLevel}
                      onValueChange={setEnergyLevel}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                      <span>Very Low</span>
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                      <span>Very High</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Stress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Stress Level</Label>
                      <Badge
                        className={`${getStressColor()} text-white border-0`}
                      >
                        {STRESS_LABELS[stressLevel[0] - 1]}
                      </Badge>
                    </div>
                    <Slider
                      value={stressLevel}
                      onValueChange={setStressLevel}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                            level <= stressLevel[0] ? STRESS_COLORS[level - 1] : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Symptom Checkboxes ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2"
            >
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-rose-500" /> Symptoms
                    {checkedSymptomsCount > 0 && (
                      <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                        {checkedSymptomsCount} selected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Check any symptoms you&apos;re experiencing and set severity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SYMPTOM_OPTIONS.map((symptom) => (
                      <motion.div
                        key={symptom.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`rounded-xl border-2 p-3 transition-all duration-200 ${
                          symptoms[symptom.id].checked
                            ? 'border-pink-300 bg-pink-50/50 dark:bg-pink-950/20'
                            : 'border-transparent bg-gray-50/50 dark:bg-gray-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={symptom.id}
                            checked={symptoms[symptom.id].checked}
                            onCheckedChange={() => toggleSymptom(symptom.id)}
                            className="data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                          />
                          <Label htmlFor={symptom.id} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
                            <span>{symptom.icon}</span>
                            {symptom.label}
                          </Label>
                        </div>
                        <AnimatePresence>
                          {symptoms[symptom.id].checked && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="flex gap-1.5 mt-2 ml-6">
                                {(['mild', 'moderate', 'severe'] as Severity[]).map((sev) => (
                                  <button
                                    key={sev}
                                    onClick={() => setSymptomSeverity(symptom.id, sev)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 ${
                                      symptoms[symptom.id].severity === sev
                                        ? sev === 'mild'
                                          ? 'bg-green-500 text-white'
                                          : sev === 'moderate'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-red-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Sleep & Water ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-400" /> Sleep
                  </CardTitle>
                  <CardDescription>How many hours did you sleep?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setSleepHours(Math.max(0, sleepHours - 0.5))}
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center">
                      <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{sleepHours}</span>
                      <span className="text-sm text-muted-foreground ml-1">hrs</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setSleepHours(Math.min(14, sleepHours + 0.5))}
                    >
                      +
                    </Button>
                  </div>
                  <Progress value={(sleepHours / 9) * 100} className="h-3 bg-indigo-100 dark:bg-indigo-950/30 [&>[data-slot=progress-indicator]]:bg-indigo-500" />
                  <p className="text-xs text-muted-foreground text-center">
                    {sleepHours < 6
                      ? '😴 Below recommended — try to get more rest'
                      : sleepHours < 8
                        ? '😊 Decent sleep — room for improvement'
                        : '🌟 Great sleep — well rested!'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-sky-500" /> Water Intake
                  </CardTitle>
                  <CardDescription>Target: 8 glasses per day</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }, (_, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setWaterIntake(i + 1)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                          i < waterIntake
                            ? 'bg-sky-100 dark:bg-sky-900/30 border-2 border-sky-400'
                            : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-sky-200'
                        }`}
                      >
                        <span className="text-lg">{i < waterIntake ? '💧' : '🥛'}</span>
                        <span className="text-[9px] font-medium text-muted-foreground">{i + 1}</span>
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{waterIntake}/8 glasses</span>
                    <Badge
                      className={`${
                        waterIntake >= 8
                          ? 'bg-emerald-500 text-white'
                          : waterIntake >= 5
                            ? 'bg-sky-500 text-white'
                            : 'bg-amber-500 text-white'
                      } border-0`}
                    >
                      {waterIntake >= 8 ? '🎯 Goal met!' : `${Math.round((waterIntake / 8) * 100)}%`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Notes & Save ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">📝 Notes</CardTitle>
                  <CardDescription>Any additional observations for today</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="How was your day? Any triggers or observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] resize-none border-pink-200 dark:border-pink-900/50 focus-visible:ring-pink-400"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{notes.length} characters</p>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleSave}
                        disabled={saving || !userProfile?.id}
                        className={`gap-2 ${
                          saved
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-pink-500 hover:bg-pink-600'
                        } text-white`}
                      >
                        {saved ? (
                          <>
                            <Check className="h-4 w-4" /> Saved!
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" /> Save Today&apos;s Log
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: Mood History
        ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="mood-history">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-pink-500" /> Mood & Energy Over 30 Days
                </CardTitle>
                <CardDescription>Track how your mood and energy levels change over time</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="h-[380px] w-full animate-pulse rounded-xl bg-muted/40" />
                ) : hasMoodData ? (
                  <>
                    <div className="h-[380px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={moodHistoryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={false}
                            interval={2}
                          />
                          <YAxis
                            domain={[0, 6]}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <RechartsTooltip content={<ChartTooltip />} />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Area
                            type="monotone"
                            dataKey="mood"
                            name="Mood Score"
                            stroke="#ec4899"
                            strokeWidth={2.5}
                            fill="url(#moodGradient)"
                            dot={false}
                            activeDot={{ r: 5, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
                            connectNulls
                          />
                          <Area
                            type="monotone"
                            dataKey="energy"
                            name="Energy Level"
                            stroke="#f59e0b"
                            strokeWidth={2.5}
                            fill="url(#energyGradient)"
                            dot={false}
                            activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                            connectNulls
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Summary Stats — derived from real data */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                      {(() => {
                        const validMoods = moodHistoryData.filter((d) => d.mood !== null)
                        const validEnergy = moodHistoryData.filter((d) => d.energy !== null)
                        const avgMood =
                          validMoods.length > 0
                            ? (validMoods.reduce((a, b) => a + (b.mood ?? 0), 0) / validMoods.length).toFixed(1)
                            : '—'
                        const avgEnergy =
                          validEnergy.length > 0
                            ? (validEnergy.reduce((a, b) => a + (b.energy ?? 0), 0) / validEnergy.length).toFixed(1)
                            : '—'
                        const bestDay = validMoods.length > 0
                          ? moodHistoryData.reduce((best, d) =>
                              (d.mood ?? 0) > (best.mood ?? 0) ? d : best
                            ).date
                          : '—'
                        return [
                          { label: 'Avg Mood', value: avgMood, icon: '😊', color: 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300' },
                          { label: 'Avg Energy', value: avgEnergy, icon: '⚡', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' },
                          { label: 'Best Day', value: bestDay, icon: '🌟', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' },
                          { label: 'Entries', value: String(moodHistory.length), icon: '📈', color: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300' },
                        ]
                      })().map((stat) => (
                        <div key={stat.label} className={`rounded-xl p-3 ${stat.color}`}>
                          <div className="text-lg mb-1">{stat.icon}</div>
                          <div className="text-xs font-medium opacity-70">{stat.label}</div>
                          <div className="text-sm font-bold">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="No mood history yet"
                    description="Log your mood and energy on the Today's Log tab to see your patterns over time appear here."
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: Symptom Patterns
        ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="patterns">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-500" /> Symptom Frequency (30 Days)
                </CardTitle>
                <CardDescription>How often each symptom has occurred in the past month</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="h-[420px] w-full animate-pulse rounded-xl bg-muted/40" />
                ) : hasSymptomData ? (
                  <>
                    <div className="h-[420px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={symptomFrequencyData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="symptom"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            width={120}
                          />
                          <RechartsTooltip content={<ChartTooltip />} />
                          <Bar
                            dataKey="frequency"
                            name="Days"
                            radius={[0, 6, 6, 0]}
                            barSize={20}
                            fill="#f472b6"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Top symptoms callout */}
                    {symptomFrequencyData.length > 0 && (
                      <div className="mt-6 p-4 rounded-xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-pink-500" />
                          <span className="text-sm font-semibold text-pink-700 dark:text-pink-300">Top 3 Most Frequent</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {symptomFrequencyData.slice(0, 3).map((s) => (
                            <Badge key={s.symptom} className="bg-pink-500 text-white border-0">
                              {s.symptom} — {s.frequency} day{s.frequency === 1 ? '' : 's'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    icon={Activity}
                    title="No symptoms logged yet"
                    description="Start logging symptoms on the Today's Log tab to see your 30-day frequency patterns here."
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: AI Insights
        ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="insights">
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
            <CardContent className="py-2">
              <EmptyState
                icon={Brain}
                title="Personalized AI insights coming soon"
                description="Once you've logged a few weeks of symptoms, moods, and cycle data, ChandraCycle will surface correlations and personalized recommendations here."
              />
            </CardContent>
          </Card>

          {/* AI Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-2 p-4 mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40"
          >
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              AI insights will be generated based on your tracked data patterns. They will not be medical advice. Always consult your healthcare provider for medical concerns.
            </p>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
