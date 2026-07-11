'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Heart,
  Moon,
  Droplets,
  Brain,
  BarChart3,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// ── Types ───────────────────────────────────────────────────────────────────
type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'annual'

interface PeriodData {
  cycleSummary: { day: number; phase: string; note: string }[]
  symptomFrequency: { name: string; count: number }[]
  moodDistribution: { name: string; value: number; color: string }[]
  sleepAvg: number
  waterAvg: number
  cycleRegularity: number
  symptomSeverity: number
  moodStability: number
  wellnessScore: number
  prevCycleRegularity: number
  prevSymptomSeverity: number
  prevMoodStability: number
  prevWellnessScore: number
  insights: string[]
  trendLine: { label: string; wellness: number; symptoms: number }[]
  radarData: { subject: string; current: number; previous: number }[]
}

// ── Report Data ─────────────────────────────────────────────────────────────
// NOTE: Demo / placeholder report data was removed so a brand-new user starts
// with an empty state ("No reports yet"). When a real reporting backend is
// wired up, fetch the PeriodData for the selected period from the API and
// replace `periodData` below — the chart/UI shell below will render it as-is.

// `periodData` stays null until a real backend supplies it. The component
// gates its chart grid on `periodData === null` to render the empty state.
const periodData: PeriodData | null = null

// ── Helpers ─────────────────────────────────────────────────────────────────
function TrendIcon({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  if (diff > 2) return <TrendingUp className="size-4 text-emerald-500" />
  if (diff < -2) return <TrendingDown className="size-4 text-red-400" />
  return <Minus className="size-4 text-muted-foreground" />
}

function TrendLabel({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) {
  const diff = current - previous
  const pct = previous !== 0 ? Math.round((diff / previous) * 100) : 0
  if (diff > 2)
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        +{pct}%{suffix}
      </span>
    )
  if (diff < -2)
    return (
      <span className="text-xs text-red-500 font-medium">
        {pct}%{suffix}
      </span>
    )
  return (
    <span className="text-xs text-muted-foreground font-medium">No change{suffix}</span>
  )
}

// ── Score Card ──────────────────────────────────────────────────────────────
function ScoreCard({
  title,
  score,
  prevScore,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string
  score: number
  prevScore: number
  icon: React.ElementType
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden border-teal-100 dark:border-teal-900/50 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="size-4 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon current={score} previous={prevScore} />
              <TrendLabel current={score} previous={prevScore} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{score}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          <Progress value={score} className="mt-3 h-1.5 bg-teal-100 dark:bg-teal-900/50 [&>div]:bg-teal-500" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function ReportsModule() {
  const [period, setPeriod] = useState<ReportPeriod>('weekly')
  // `data` is null when no real report data has been fetched yet (the default
  // for a brand-new user). The body renders an empty-state card in that case;
  // replace this with a fetch from `/api/reports?period=...` when the backend
  // is ready, and the existing chart UI below will render automatically.
  const data: PeriodData | null = periodData

  const chartConfig = {
    wellness: { label: 'Wellness', color: '#14b8a6' },
    symptoms: { label: 'Symptoms', color: '#f59e0b' },
    count: { label: 'Count', color: '#14b8a6' },
  }

  const radarChartConfig = {
    current: { label: 'Current', color: '#14b8a6' },
    previous: { label: 'Previous', color: '#99f6e4' },
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-teal-50/50 to-white dark:from-teal-950/20 dark:to-background rounded-xl border border-teal-100 dark:border-teal-900/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-teal-100 dark:border-teal-900/50 bg-white/80 dark:bg-background/80 backdrop-blur-sm rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500 text-white">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Report Center</h2>
            <p className="text-xs text-muted-foreground">AI-powered health insights</p>
          </div>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
          <TabsList className="bg-teal-50 dark:bg-teal-950/50">
            <TabsTrigger value="daily" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white text-xs px-3">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white text-xs px-3">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white text-xs px-3">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="annual" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white text-xs px-3">
              Annual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
        {data === null ? (
          // ── Empty state: no reports yet (brand-new user) ──
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="border-dashed border-teal-200 dark:border-teal-900/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/40 mb-3">
                  <BarChart3 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm font-medium text-foreground">No reports yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Start logging your cycle, mood, sleep, and symptoms across ChandraCycle.
                  Once you have a few days of data, your {period} report — wellness score,
                  symptom patterns, mood distribution, and AI insights — will appear here.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                  <Badge variant="secondary" className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[10px] gap-1">
                    <Activity className="h-3 w-3" /> Log cycle
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] gap-1">
                    <Brain className="h-3 w-3" /> Log mood
                  </Badge>
                  <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] gap-1">
                    <Moon className="h-3 w-3" /> Log sleep
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
        {/* Score Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ScoreCard
            title="Cycle Regularity"
            score={data.cycleRegularity}
            prevScore={data.prevCycleRegularity}
            icon={Activity}
            color="bg-teal-500"
            delay={0}
          />
          <ScoreCard
            title="Symptom Severity"
            score={100 - data.symptomSeverity}
            prevScore={100 - data.prevSymptomSeverity}
            icon={Heart}
            color="bg-rose-400"
            delay={0.05}
          />
          <ScoreCard
            title="Mood Stability"
            score={data.moodStability}
            prevScore={data.prevMoodStability}
            icon={Brain}
            color="bg-amber-400"
            delay={0.1}
          />
          <ScoreCard
            title="Wellness Score"
            score={data.wellnessScore}
            prevScore={data.prevWellnessScore}
            icon={Sparkles}
            color="bg-emerald-500"
            delay={0.15}
          />
        </div>

        {/* Charts Row 1: Symptom Frequency + Mood Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Symptom Frequency Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-teal-100 dark:border-teal-900/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Symptom Frequency</CardTitle>
                <CardDescription className="text-xs">Most reported symptoms this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.symptomFrequency} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mood Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="border-teal-100 dark:border-teal-900/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Mood Distribution</CardTitle>
                <CardDescription className="text-xs">How your moods were distributed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.moodDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.moodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2: Wellness Trend Line + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Wellness & Symptom Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-teal-100 dark:border-teal-900/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Wellness & Symptom Trends</CardTitle>
                <CardDescription className="text-xs">Tracking over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trendLine} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Line
                        type="monotone"
                        dataKey="wellness"
                        stroke="#14b8a6"
                        strokeWidth={2.5}
                        dot={{ fill: '#14b8a6', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="symptoms"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', r: 3 }}
                        activeDot={{ r: 5 }}
                        strokeDasharray="5 5"
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Radar: Current vs Previous */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card className="border-teal-100 dark:border-teal-900/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Period Comparison</CardTitle>
                <CardDescription className="text-xs">Current vs previous period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar
                        name="Current"
                        dataKey="current"
                        stroke="#14b8a6"
                        fill="#14b8a6"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Previous"
                        dataKey="previous"
                        stroke="#99f6e4"
                        fill="#99f6e4"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Key Metrics Row: Sleep + Water Averages */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="border-teal-100 dark:border-teal-900/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
                  <Moon className="size-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Sleep Average</p>
                  <p className="text-lg font-bold text-foreground">{data.sleepAvg}h</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {data.sleepAvg >= 7 ? 'Good' : data.sleepAvg >= 6 ? 'Fair' : 'Low'}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <Card className="border-teal-100 dark:border-teal-900/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50">
                  <Droplets className="size-5 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Water Average</p>
                  <p className="text-lg font-bold text-foreground">{data.waterAvg} glasses</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {data.waterAvg >= 8 ? 'On Target' : data.waterAvg >= 6 ? 'Fair' : 'Low'}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Trend Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-teal-100 dark:border-teal-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Trend Comparison</CardTitle>
              <CardDescription className="text-xs">Current vs previous period metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Cycle Regularity', current: data.cycleRegularity, previous: data.prevCycleRegularity, higher: true },
                  { label: 'Symptom Severity (inverted)', current: 100 - data.symptomSeverity, previous: 100 - data.prevSymptomSeverity, higher: true },
                  { label: 'Mood Stability', current: data.moodStability, previous: data.prevMoodStability, higher: true },
                  { label: 'Overall Wellness', current: data.wellnessScore, previous: data.prevWellnessScore, higher: true },
                  { label: 'Sleep Quality', current: Math.round(data.sleepAvg * 10), previous: Math.round((data.sleepAvg - 0.3) * 10), higher: true },
                  { label: 'Hydration', current: Math.round(data.waterAvg * 10), previous: Math.round((data.waterAvg - 0.5) * 10), higher: true },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground w-36 shrink-0 truncate">{item.label}</p>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-teal-100 dark:bg-teal-900/50 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-teal-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.previous}%` }}
                          transition={{ duration: 0.8, delay: 0.1 * i }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{item.previous}</span>
                    </div>
                    <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-teal-100 dark:bg-teal-900/50 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-teal-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.current}%` }}
                          transition={{ duration: 0.8, delay: 0.1 * i + 0.3 }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-foreground w-7 text-right">{item.current}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-teal-400" />
                    <span className="text-[10px] text-muted-foreground">Previous</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-teal-600" />
                    <span className="text-[10px] text-muted-foreground">Current</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Health Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <Card className="border-teal-100 dark:border-teal-900/50 bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-950/20 dark:to-background">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-teal-500" />
                <CardTitle className="text-sm font-semibold">AI Health Insights</CardTitle>
              </div>
              <CardDescription className="text-xs">Generated based on your tracking data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {data.insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.08 }}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/80 dark:bg-background/80 border border-teal-100 dark:border-teal-900/30"
                  >
                    <div className="mt-0.5 size-1.5 rounded-full bg-teal-500 shrink-0" />
                    <p className="text-xs text-foreground leading-relaxed">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cycle Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="border-teal-100 dark:border-teal-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Cycle Summary</CardTitle>
              <CardDescription className="text-xs">Key phase milestones this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.cycleSummary.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="flex items-center justify-center size-7 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-medium shrink-0">
                      {item.day}
                    </div>
                    <Badge variant="outline" className="text-[10px] border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 shrink-0">
                      {item.phase}
                    </Badge>
                    <span className="text-muted-foreground truncate">{item.note}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Export Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.65 }}
        >
          <Card className="border-teal-100 dark:border-teal-900/50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Export Report</p>
                  <p className="text-xs text-muted-foreground">Download your health data for sharing</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                  >
                    <FileText className="size-3.5 mr-1.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                  >
                    <FileSpreadsheet className="size-3.5 mr-1.5" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                  >
                    <Download className="size-3.5 mr-1.5" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
