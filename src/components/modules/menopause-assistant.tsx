'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SunDim,
  Thermometer,
  Moon,
  Brain,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Check,
  Save,
  ChevronDown,
  Heart,
  Activity,
  Pill,
  TrendingUp,
  Leaf,
  Dumbbell,
  BedDouble,
  Stethoscope,
  Apple,
  X,
  BarChart3,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
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
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

type MenopauseStage = 'perimenopause' | 'menopause' | 'postmenopause'

interface HRTEntry {
  id: string
  medication: string
  dosage: string
  frequency: string
  startDate: string
  effectiveness: number
  notes: string
}

// ─── Stage Data ─────────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 'perimenopause' as MenopauseStage,
    title: 'Perimenopause',
    age: '40s - Early 50s',
    description: 'Transition period before menopause. Hormone levels begin to fluctuate, causing irregular periods and early symptoms.',
    symptoms: ['Irregular periods', 'Hot flashes', 'Mood swings', 'Sleep problems'],
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-300 dark:border-amber-800',
    icon: '🌅',
  },
  {
    id: 'menopause' as MenopauseStage,
    title: 'Menopause',
    age: 'Early 50s',
    description: '12 consecutive months without a period. Estrogen levels drop significantly, and symptoms may intensify.',
    symptoms: ['No periods', 'Severe hot flashes', 'Vaginal dryness', 'Bone density loss'],
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-300 dark:border-red-800',
    icon: '🔥',
  },
  {
    id: 'postmenopause' as MenopauseStage,
    title: 'Postmenopause',
    age: 'Mid 50s+',
    description: 'Years after menopause. Some symptoms ease, but health risks like osteoporosis and heart disease increase.',
    symptoms: ['Decreased symptoms', 'Bone health concerns', 'Heart health risks', 'Weight management'],
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-300 dark:border-purple-800',
    icon: '🌙',
  },
]

// ─── Chart data is derived from real API entries (fetched in component) ─────

// ─── Educational management tips (kept — not user data) ────────────────────

const MANAGEMENT_TIPS = [
  {
    id: 'diet',
    title: 'Diet & Nutrition',
    icon: Apple,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    tips: [
      'Increase calcium-rich foods: dairy, leafy greens, fortified foods',
      'Add phytoestrogens: soy products, flaxseeds, chickpeas',
      'Limit caffeine and alcohol — both can trigger hot flashes',
      'Stay hydrated with 8+ glasses of water daily',
      'Consider vitamin D supplementation (1000-2000 IU daily)',
    ],
  },
  {
    id: 'exercise',
    title: 'Exercise & Movement',
    icon: Dumbbell,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    tips: [
      'Weight-bearing exercises help maintain bone density',
      'Aim for 150 minutes of moderate aerobic activity per week',
      'Yoga and stretching can reduce stress and improve sleep',
      'Kegel exercises strengthen pelvic floor muscles',
      'Start slow and gradually increase intensity',
    ],
  },
  {
    id: 'stress',
    title: 'Stress Management',
    icon: Leaf,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    tips: [
      'Practice deep breathing exercises during hot flashes',
      'Meditation for 10-15 minutes daily reduces cortisol levels',
      'Keep a journal to process emotions and track triggers',
      'Connect with others — support groups can be invaluable',
      'Consider cognitive behavioral therapy (CBT) for mood changes',
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep Hygiene',
    icon: BedDouble,
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    tips: [
      'Keep bedroom cool (65-68°F) and well-ventilated',
      'Use moisture-wicking bedding and sleepwear',
      'Establish a consistent bedtime routine',
      'Avoid screens 1 hour before sleep',
      'Try magnesium supplement before bed (consult doctor)',
    ],
  },
  {
    id: 'doctor',
    title: 'When to See Your Doctor',
    icon: Stethoscope,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    tips: [
      'Heavy or prolonged bleeding during perimenopause',
      'Severe hot flashes that disrupt daily life',
      'Signs of depression or severe mood changes',
      'Bone pain or increased fracture risk',
      'Discuss HRT options and bone density screening',
    ],
  },
]

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

export default function MenopauseModule() {
  // ── State ──
  const userProfile = useAppStore((s) => s.userProfile)
  const [selectedStage, setSelectedStage] = useState<MenopauseStage | null>(null)
  const [hotFlashes, setHotFlashes] = useState(0)
  const [nightSweats, setNightSweats] = useState(0)
  const [moodChanges, setMoodChanges] = useState(false)
  const [sleepIssues, setSleepIssues] = useState(false)
  const [vaginalDryness, setVaginalDryness] = useState(false)
  const [jointPain, setJointPain] = useState(false)
  const [anxietyLevel, setAnxietyLevel] = useState([3])
  const [weightChange, setWeightChange] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly')
  const [hrtEntries, setHrtEntries] = useState<HRTEntry[]>([])
  const [showHrtForm, setShowHrtForm] = useState(false)
  const [history, setHistory] = useState<Array<{
    id: string
    date: string
    hotFlashes?: number
    nightSweats?: number
    moodChanges?: boolean
    sleepIssues?: boolean
    anxiety?: number
  }>>([])
  const [newHrt, setNewHrt] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    effectiveness: 3,
    notes: '',
  })

  // Fetch real menopause history (used to populate charts once user has logs)
  useEffect(() => {
    if (!userProfile?.id) return
    let cancelled = false
    fetch(`/api/menopause?userId=${encodeURIComponent(userProfile.id)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((records = []) => {
        if (cancelled || !Array.isArray(records)) return
        setHistory(records)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userProfile?.id])

  // ── Computed chart data (derived from real API records) ──
  const hotFlashesData = useMemo(() =>
    history.slice(0, timeRange === 'weekly' ? 8 : 30).reverse().map((e, i) => ({
      date: timeRange === 'weekly' ? `Week ${i + 1}` : new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hotFlashes: e.hotFlashes ?? 0,
      nightSweats: e.nightSweats ?? 0,
    })), [history, timeRange])
  const sleepData = useMemo(() =>
    history.slice(0, timeRange === 'weekly' ? 8 : 30).reverse().map((e, i) => ({
      date: timeRange === 'weekly' ? `Week ${i + 1}` : new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      quality: e.sleepIssues ? 2 : 4,
      duration: e.sleepIssues ? 5 : 7,
    })), [history, timeRange])
  const moodData = useMemo(() =>
    history.slice(0, timeRange === 'weekly' ? 8 : 30).reverse().map((e, i) => ({
      date: timeRange === 'weekly' ? `Week ${i + 1}` : new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: e.moodChanges ? 2 : 4,
      anxiety: e.anxiety ?? 3,
    })), [history, timeRange])
  const hasHistory = history.length > 0

  // ── Handlers ──
  const handleSave = async () => {
    if (!userProfile?.id) return
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await fetch('/api/menopause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          date: today,
          hotFlashes,
          nightSweats,
          moodChanges,
          sleepIssues,
          vaginalDryness,
          jointPain,
          weightChange: weightChange || undefined,
          anxiety: anxietyLevel[0],
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      // Refresh history
      const fresh = await fetch(`/api/menopause?userId=${encodeURIComponent(userProfile.id)}`).then((r) => r.json())
      if (Array.isArray(fresh)) setHistory(fresh)
    } catch (e) {
      console.error('Failed to save menopause data:', e)
      toast.error('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addHrtEntry = () => {
    if (!newHrt.medication || !newHrt.dosage) return
    const entry: HRTEntry = {
      id: Date.now().toString(),
      ...newHrt,
    }
    setHrtEntries([...hrtEntries, entry])
    setNewHrt({
      medication: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      effectiveness: 3,
      notes: '',
    })
    setShowHrtForm(false)
  }

  const removeHrtEntry = (id: string) => {
    setHrtEntries(hrtEntries.filter((e) => e.id !== id))
  }

  const effectivenessLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
  const effectivenessColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-400', 'bg-emerald-600']

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
          <SunDim className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menopause Assistant</h2>
          <p className="text-sm text-muted-foreground">Personalized support for every stage</p>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1: Stage Selector
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" /> Your Menopause Stage
            </CardTitle>
            <CardDescription>Select the stage that best describes your current experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {STAGES.map((stage) => (
                <motion.button
                  key={stage.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStage(stage.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedStage === stage.id
                      ? `${stage.borderColor} ${stage.bgColor} shadow-md`
                      : 'border-transparent bg-gray-50 dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{stage.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{stage.title}</h3>
                      <span className="text-[10px] text-muted-foreground">{stage.age}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{stage.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {stage.symptoms.map((symptom) => (
                      <Badge
                        key={symptom}
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 bg-white/60 dark:bg-gray-800/60"
                      >
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                  {selectedStage === stage.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Selected</span>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2: Daily Symptom Tracker
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" /> Daily Symptom Tracker
            </CardTitle>
            <CardDescription>Log your symptoms for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hot Flashes Counter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  🔥 Hot Flashes Today
                </Label>
                <div className="flex items-center gap-4">
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setHotFlashes(Math.max(0, hotFlashes - 1))}
                    >
                      <Minus className="h-4 w-4 text-red-500" />
                    </Button>
                  </motion.div>
                  <motion.div
                    key={hotFlashes}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="flex-1 text-center"
                  >
                    <span className="text-4xl font-bold text-red-600 dark:text-red-400">{hotFlashes}</span>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => setHotFlashes(Math.min(20, hotFlashes + 1))}
                    >
                      <Plus className="h-4 w-4 text-red-500" />
                    </Button>
                  </motion.div>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                        i < hotFlashes
                          ? i < 3 ? 'bg-amber-400' : i < 6 ? 'bg-orange-500' : 'bg-red-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hotFlashes === 0 ? 'No hot flashes today — great!' : hotFlashes <= 3 ? 'Mild — manageable' : hotFlashes <= 6 ? 'Moderate — consider triggers' : 'Severe — consult your doctor'}
                </p>
              </div>

              {/* Night Sweats Counter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  🌙 Night Sweats
                </Label>
                <div className="flex items-center gap-4">
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      onClick={() => setNightSweats(Math.max(0, nightSweats - 1))}
                    >
                      <Minus className="h-4 w-4 text-indigo-500" />
                    </Button>
                  </motion.div>
                  <motion.div
                    key={nightSweats}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="flex-1 text-center"
                  >
                    <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{nightSweats}</span>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      onClick={() => setNightSweats(Math.min(10, nightSweats + 1))}
                    >
                      <Plus className="h-4 w-4 text-indigo-500" />
                    </Button>
                  </motion.div>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                        i < nightSweats
                          ? i < 2 ? 'bg-indigo-300' : i < 5 ? 'bg-indigo-500' : 'bg-indigo-700'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nightSweats === 0 ? 'No night sweats — restful sleep!' : nightSweats <= 2 ? 'Mild disruption' : 'Significant — try cooling bedding'}
                </p>
              </div>

              <Separator className="md:col-span-2" />

              {/* Toggle Switches */}
              <div className="md:col-span-2">
                <Label className="text-sm font-medium mb-3 block">Other Symptoms</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Mood Changes', icon: '😤', state: moodChanges, setter: setMoodChanges },
                    { label: 'Sleep Issues', icon: '😴', state: sleepIssues, setter: setSleepIssues },
                    { label: 'Vaginal Dryness', icon: '💧', state: vaginalDryness, setter: setVaginalDryness },
                    { label: 'Joint Pain', icon: '🦴', state: jointPain, setter: setJointPain },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between gap-2 p-3 rounded-xl border transition-all duration-200 ${
                        item.state
                          ? 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20'
                          : 'border-transparent bg-gray-50 dark:bg-gray-800/40'
                      }`}
                    >
                      <span className="text-sm flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span className="text-xs font-medium">{item.label}</span>
                      </span>
                      <Switch
                        checked={item.state}
                        onCheckedChange={item.setter}
                        className="data-[state=checked]:bg-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="md:col-span-2" />

              {/* Anxiety Slider */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  😰 Anxiety Level
                </Label>
                <Slider
                  value={anxietyLevel}
                  onValueChange={setAnxietyLevel}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>Calm</span>
                  <span>Slight</span>
                  <span>Moderate</span>
                  <span>Anxious</span>
                  <span>Severe</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${
                        level <= anxietyLevel[0]
                          ? level <= 2 ? 'bg-emerald-400' : level <= 3 ? 'bg-amber-400' : 'bg-red-400'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Weight Change */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  ⚖️ Weight Change
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={weightChange}
                    onChange={(e) => setWeightChange(e.target.value)}
                    className="w-24 text-center border-red-200 dark:border-red-900/50 focus-visible:ring-red-400"
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                  <div className="flex gap-1 ml-2">
                    {weightChange && parseFloat(weightChange) !== 0 && (
                      <Badge
                        className={`border-0 ${
                          parseFloat(weightChange) > 0
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}
                      >
                        {parseFloat(weightChange) > 0 ? '↑ Gain' : '↓ Loss'}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Enter positive for gain, negative for loss</p>
              </div>

              {/* Save Button */}
              <div className="md:col-span-2 flex justify-end pt-2">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSave}
                    className={`gap-2 ${
                      saved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 3: Symptom Trends
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" /> Symptom Trends
                </CardTitle>
                <CardDescription>Visualize your symptoms over time</CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                <button
                  onClick={() => setTimeRange('weekly')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    timeRange === 'weekly'
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600 dark:text-red-400'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeRange('monthly')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    timeRange === 'monthly'
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600 dark:text-red-400'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hotflashes" className="space-y-4">
              <TabsList className="bg-red-50 dark:bg-red-950/30">
                <TabsTrigger value="hotflashes" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs">
                  🔥 Hot Flashes
                </TabsTrigger>
                <TabsTrigger value="sleep" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs">
                  😴 Sleep Quality
                </TabsTrigger>
                <TabsTrigger value="mood" className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs">
                  😔 Mood Pattern
                </TabsTrigger>
              </TabsList>

              {/* Hot Flashes Chart */}
              <TabsContent value="hotflashes">
                {hasHistory ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hotFlashesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hotFlashGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="nightSweatGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="hotFlashes"
                        name="Hot Flashes"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#hotFlashGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="nightSweats"
                        name="Night Sweats"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill="url(#nightSweatGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Thermometer className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">No symptom logs yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Log your hot flashes and night sweats daily to see trends here.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Sleep Quality Chart */}
              <TabsContent value="sleep">
                {hasHistory ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sleepData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 8]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="quality"
                        name="Sleep Quality"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        name="Hours Slept"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BedDouble className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">No sleep logs yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Log your sleep quality over time to see patterns here.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Mood Pattern Chart */}
              <TabsContent value="mood">
                {hasHistory ? (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={moodData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodMenopauseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="anxietyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 7]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        name="Mood Score"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        fill="url(#moodMenopauseGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="anxiety"
                        name="Anxiety Level"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fill="url(#anxietyGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Brain className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">No mood logs yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Log mood and anxiety over time to see patterns here.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4: AI Insights
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> AI-Powered Insights
            </CardTitle>
            <CardDescription>Personalized analysis based on your tracked data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Personalized insights coming soon</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Log your symptoms, sleep, and mood for a few weeks — ChandraCycle will then surface correlations like hot-flash triggers and sleep-mood patterns here.
              </p>
            </div>

            {/* AI Disclaimer */}
            <div className="flex items-start gap-2 p-3 mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Insights will be based on tracked data patterns and general medical knowledge. Always consult your healthcare provider before making treatment decisions.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 5: Management Tips
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" /> Management Tips
            </CardTitle>
            <CardDescription>Practical advice for managing your symptoms</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {MANAGEMENT_TIPS.map((category, index) => (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className={`border rounded-xl px-4 overflow-hidden ${
                    selectedStage === 'menopause'
                      ? 'border-red-100 dark:border-red-900/30'
                      : selectedStage === 'postmenopause'
                        ? 'border-purple-100 dark:border-purple-900/30'
                        : 'border-amber-100 dark:border-amber-900/30'
                  }`}
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.bgColor}`}>
                        <category.icon className={`h-4 w-4 ${category.iconColor}`} />
                      </div>
                      <span className="text-sm font-medium">{category.title}</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                        {category.tips.length} tips
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      {category.tips.map((tip, tipIndex) => (
                        <motion.div
                          key={tipIndex}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: tipIndex * 0.05 }}
                          className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                        </motion.div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 6: HRT Tracker
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4 text-red-500" /> HRT Tracker
                </CardTitle>
                <CardDescription>Track your hormone replacement therapy</CardDescription>
              </div>
              <Button
                onClick={() => setShowHrtForm(!showHrtForm)}
                size="sm"
                className="gap-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {showHrtForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showHrtForm ? 'Cancel' : 'Add Medication'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add HRT Form */}
            <AnimatePresence>
              {showHrtForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 mb-4 space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4 text-red-500" /> New Medication
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Medication Name</Label>
                        <Input
                          placeholder="e.g., Estradiol"
                          value={newHrt.medication}
                          onChange={(e) => setNewHrt({ ...newHrt, medication: e.target.value })}
                          className="border-red-200 dark:border-red-900/50 focus-visible:ring-red-400 h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Dosage</Label>
                        <Input
                          placeholder="e.g., 0.05mg"
                          value={newHrt.dosage}
                          onChange={(e) => setNewHrt({ ...newHrt, dosage: e.target.value })}
                          className="border-red-200 dark:border-red-900/50 focus-visible:ring-red-400 h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Frequency</Label>
                        <Input
                          placeholder="e.g., Daily, Weekly"
                          value={newHrt.frequency}
                          onChange={(e) => setNewHrt({ ...newHrt, frequency: e.target.value })}
                          className="border-red-200 dark:border-red-900/50 focus-visible:ring-red-400 h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Start Date</Label>
                        <Input
                          type="date"
                          value={newHrt.startDate}
                          onChange={(e) => setNewHrt({ ...newHrt, startDate: e.target.value })}
                          className="border-red-200 dark:border-red-900/50 focus-visible:ring-red-400 h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Effectiveness (1-5)</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setNewHrt({ ...newHrt, effectiveness: val })}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              newHrt.effectiveness === val
                                ? `${effectivenessColors[val]} text-white shadow-sm`
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Selected: {effectivenessLabels[newHrt.effectiveness]}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Notes</Label>
                      <Input
                        placeholder="Any observations..."
                        value={newHrt.notes}
                        onChange={(e) => setNewHrt({ ...newHrt, notes: e.target.value })}
                        className="border-red-200 dark:border-red-900/50 focus-visible:ring-red-400 h-9"
                      />
                    </div>
                    <Button
                      onClick={addHrtEntry}
                      className="w-full bg-red-500 hover:bg-red-600 text-white gap-2"
                      disabled={!newHrt.medication || !newHrt.dosage}
                    >
                      <Plus className="h-4 w-4" /> Add Medication
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* HRT Entries List */}
            <div className="space-y-3">
              {hrtEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground">No medications tracked yet</p>
                  <p className="text-xs text-muted-foreground">Click &quot;Add Medication&quot; to get started</p>
                </div>
              ) : (
                hrtEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 shrink-0">
                      <Pill className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold">{entry.medication}</h4>
                        <Badge variant="secondary" className="text-[10px]">{entry.dosage}</Badge>
                        <Badge variant="outline" className="text-[10px]">{entry.frequency}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Started: {new Date(entry.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>
                      )}
                      {/* Effectiveness bar */}
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-medium text-muted-foreground">Effectiveness:</span>
                          <span className="text-[10px] font-semibold">{effectivenessLabels[entry.effectiveness]}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${effectivenessColors[entry.effectiveness]}`}
                            style={{ width: `${(entry.effectiveness / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => removeHrtEntry(entry.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>

            {/* HRT Summary */}
            {hrtEntries.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">HRT Summary</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{hrtEntries.length}</div>
                    <div className="text-[10px] text-muted-foreground">Medications</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {(hrtEntries.reduce((sum, e) => sum + e.effectiveness, 0) / hrtEntries.length).toFixed(1)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Avg Effectiveness</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {hrtEntries.filter((e) => e.effectiveness >= 4).length}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Working Well</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
