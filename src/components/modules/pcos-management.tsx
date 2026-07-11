'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Flower2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Dumbbell,
  Apple,
  Moon,
  BookOpen,
  ChevronRight,
  Star,
  Heart,
  Activity,
  Sparkles,
  FileBarChart,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Clock,
  Stethoscope,
  ExternalLink,
  Microscope,
  Dna,
  Pill,
  Brain,
  Info,
  X,
  HelpCircle,
  Droplet,
  Layers,
  FlaskConical,
  Flame,
  Eye,
  Scissors,
  Calendar,
  Sprout,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PCOSSymptom {
  id: string
  label: string
  checked: boolean
  severity: 'none' | 'mild' | 'moderate' | 'severe'
}

interface Recommendation {
  category: string
  icon: React.ReactNode
  items: string[]
  priority: 'high' | 'medium' | 'low'
}

// ─── Symptom checklist configuration (kept — these are options, not user data) ─

const initialSymptoms: PCOSSymptom[] = [
  { id: 'irregular-periods', label: 'Irregular periods', checked: false, severity: 'none' },
  { id: 'excess-hair', label: 'Excess hair growth', checked: false, severity: 'none' },
  { id: 'acne', label: 'Acne', checked: false, severity: 'none' },
  { id: 'weight-gain', label: 'Weight gain', checked: false, severity: 'none' },
  { id: 'hair-loss', label: 'Hair loss', checked: false, severity: 'none' },
  { id: 'skin-tags', label: 'Skin tags', checked: false, severity: 'none' },
  { id: 'fatigue', label: 'Fatigue', checked: false, severity: 'none' },
  { id: 'mood-changes', label: 'Mood changes', checked: false, severity: 'none' },
  { id: 'sleep-issues', label: 'Sleep issues', checked: false, severity: 'none' },
]

// Weight & sleep data are now empty by default — populated from real API data once the user logs entries.
// The monthly report-card radar is also empty until the user has tracking history.

const resourceLibrary = [
  {
    title: 'Understanding PCOS',
    description: 'A complete guide to Polycystic Ovary Syndrome, its causes, and effects on your body.',
    category: 'Basics',
    readTime: '8 min',
    color: 'from-pink-400 to-rose-400',
  },
  {
    title: 'PCOS-Friendly Diet Plan',
    description: 'Anti-inflammatory foods and meal plans designed to manage insulin resistance.',
    category: 'Diet',
    readTime: '12 min',
    color: 'from-amber-400 to-orange-400',
  },
  {
    title: 'Exercise & PCOS',
    description: 'Best workout routines for managing weight and improving insulin sensitivity.',
    category: 'Fitness',
    readTime: '6 min',
    color: 'from-emerald-400 to-teal-400',
  },
  {
    title: 'Mental Health & PCOS',
    description: 'Coping strategies for anxiety, depression, and body image concerns with PCOS.',
    category: 'Wellness',
    readTime: '10 min',
    color: 'from-purple-400 to-violet-400',
  },
  {
    title: 'Fertility & PCOS',
    description: 'Understanding ovulation, conception challenges, and treatment options.',
    category: 'Fertility',
    readTime: '15 min',
    color: 'from-sky-400 to-blue-400',
  },
  {
    title: 'When to See a Doctor',
    description: 'Red flags and signs that warrant professional medical evaluation.',
    category: 'Medical',
    readTime: '5 min',
    color: 'from-red-400 to-pink-400',
  },
]

// ─── Research & Learn data ────────────────────────────────────────────────────

const pcosCauses = [
  {
    title: 'Insulin Resistance',
    icon: <Droplet className="h-5 w-5 text-amber-500" />,
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200/60 dark:border-amber-800/30',
    desc: 'Up to 70% of women with PCOS have insulin resistance. Cells respond poorly to insulin, so the pancreas produces more — which in turn stimulates the ovaries to make extra androgens.',
  },
  {
    title: 'Hormonal Imbalance (High Androgens)',
    icon: <Dna className="h-5 w-5 text-pink-500" />,
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    border: 'border-pink-200/60 dark:border-pink-800/30',
    desc: 'Elevated testosterone and other male hormones disrupt ovulation and drive symptoms like acne, excess facial/body hair, and thinning scalp hair. LH-to-FSH ratio is often skewed (≥2:1).',
  },
  {
    title: 'Genetics & Family History',
    icon: <Dna className="h-5 w-5 text-rose-500" />,
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200/60 dark:border-rose-800/30',
    desc: 'PCOS runs in families. Having a mother or sister with PCOS significantly raises your risk. Multiple genes are believed to be involved, interacting with environmental factors.',
  },
  {
    title: 'Low-Grade Inflammation',
    icon: <Flame className="h-5 w-5 text-orange-500" />,
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200/60 dark:border-orange-800/30',
    desc: 'Women with PCOS often have chronic low-grade inflammation. This stimulates polycystic ovaries to produce androgens, fueling a self-reinforcing cycle of hormonal imbalance.',
  },
]

const pcosSymptomsToWatch = [
  {
    title: 'Irregular Periods',
    icon: <Calendar className="h-5 w-5 text-amber-500" />,
    severity: 'Very Common',
    severityColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    desc: 'Cycles shorter than 21 days or longer than 35 days, skipped periods, or very heavy bleeding. Caused by lack of ovulation.',
  },
  {
    title: 'Excess Androgen (Hirsutism, Acne)',
    icon: <Sparkles className="h-5 w-5 text-pink-500" />,
    severity: 'Common',
    severityColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    desc: 'Dark facial/body hair (chin, chest, abdomen), persistent adult acne, and oily skin due to elevated testosterone levels.',
  },
  {
    title: 'Polycystic Ovaries',
    icon: <Droplet className="h-5 w-5 text-rose-500" />,
    severity: 'Common',
    severityColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    desc: 'Enlarged ovaries containing 12 or more small follicles (cysts) visible on ultrasound. Note: cysts alone do NOT confirm PCOS.',
  },
  {
    title: 'Weight Gain',
    icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
    severity: 'Common',
    severityColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    desc: 'Difficulty losing weight, especially around the abdomen. Insulin resistance makes weight management more challenging.',
  },
  {
    title: 'Hair Thinning',
    icon: <Scissors className="h-5 w-5 text-amber-600" />,
    severity: 'Less Common',
    severityColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    desc: 'Male-pattern baldness, thinning at the crown, or widening part line. Caused by high androgens affecting hair follicles.',
  },
  {
    title: 'Skin Tags & Darkening',
    icon: <Eye className="h-5 w-5 text-rose-600" />,
    severity: 'Less Common',
    severityColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    desc: 'Small soft skin growths and dark, velvety patches (acanthosis nigricans) in skin folds — signs of insulin resistance.',
  },
]

const pcosTypes = [
  {
    name: 'Insulin-Resistant PCOS',
    prevalence: '~70%',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    gradient: 'from-amber-400 to-orange-400',
    markers: 'High insulin, high testosterone, weight gain',
    rootCause: 'Insulin resistance driving ovarian androgen production',
    approach: 'Low-GI diet, strength training, Metformin, Inositol',
    icon: <Droplet className="h-6 w-6 text-white" />,
  },
  {
    name: 'Adrenal PCOS',
    prevalence: '~10%',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    gradient: 'from-rose-400 to-pink-400',
    markers: 'High DHEA-S, normal insulin & testosterone',
    rootCause: 'Chronic stress driving adrenal androgen output',
    approach: 'Stress management, adaptogens, sleep, gentle exercise',
    icon: <Brain className="h-6 w-6 text-white" />,
  },
  {
    name: 'Post-Pill PCOS',
    prevalence: '~15%',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    gradient: 'from-pink-400 to-fuchsia-400',
    markers: 'Symptoms appear within months of stopping birth control',
    rootCause: 'Temporary androgen surge after contraceptive withdrawal',
    approach: 'Patience (6–12 months), liver support, blood sugar balance',
    icon: <Pill className="h-6 w-6 text-white" />,
  },
  {
    name: 'Inflammatory PCOS',
    prevalence: '~5–10%',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    gradient: 'from-orange-400 to-red-400',
    markers: 'Elevated CRP, food sensitivities, IBS, joint pain',
    rootCause: 'Chronic inflammation from diet, gut, or environment',
    approach: 'Anti-inflammatory diet, gut healing, key supplements',
    icon: <Flame className="h-6 w-6 text-white" />,
  },
]

const pcosLongTermRisks = [
  {
    title: 'Type 2 Diabetes',
    icon: <Droplet className="h-5 w-5 text-red-500" />,
    risk: '50%',
    riskLabel: 'risk by age 40',
    desc: 'More than half of women with PCOS develop type 2 diabetes by age 40 due to insulin resistance.',
    prevention: 'Annual glucose screening, low-sugar diet, regular exercise, Metformin if prescribed.',
  },
  {
    title: 'Cardiovascular Disease',
    icon: <Heart className="h-5 w-5 text-rose-500" />,
    risk: '2×',
    riskLabel: 'higher risk',
    desc: 'PCOS raises the risk of high blood pressure, cholesterol issues, and heart disease.',
    prevention: 'Manage weight, control lipids, avoid smoking, eat heart-healthy fats & fiber.',
  },
  {
    title: 'Endometrial Cancer',
    icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    risk: '2.7×',
    riskLabel: 'higher risk',
    desc: 'Infrequent periods cause endometrial buildup, increasing cancer risk over time.',
    prevention: 'Induce a period at least every 3 months (progestin therapy) to shed the lining.',
  },
  {
    title: 'Infertility',
    icon: <Flower2 className="h-5 w-5 text-pink-500" />,
    risk: '70–80%',
    riskLabel: 'with ovulation issues',
    desc: 'PCOS is the leading cause of anovulatory infertility, but most women can conceive with treatment.',
    prevention: 'Ovulation induction (Clomid/Letrozole), lifestyle changes, IVF if needed.',
  },
  {
    title: 'Sleep Apnea',
    icon: <Moon className="h-5 w-5 text-amber-500" />,
    risk: '5×',
    riskLabel: 'higher risk',
    desc: 'Sleep apnea is significantly more common in women with PCOS — independent of body weight.',
    prevention: 'Sleep study if snoring or fatigue, weight management, side-sleeping, avoid alcohol.',
  },
  {
    title: 'Depression & Anxiety',
    icon: <Brain className="h-5 w-5 text-rose-600" />,
    risk: '3×',
    riskLabel: 'higher risk',
    desc: 'Hormonal shifts, inflammation, and the emotional toll of chronic symptoms take a real toll.',
    prevention: 'Therapy, social support, regular movement, mindfulness, treat underlying hormones.',
  },
]

const pcosBloodTests = [
  'Total & free testosterone',
  'LH / FSH ratio (often ≥ 2:1 in PCOS)',
  'Fasting glucose & insulin (HOMA-IR)',
  'DHEA-S (adrenal androgen)',
  'Lipid panel (cholesterol, triglycerides)',
  'Thyroid panel (to rule out thyroid causes)',
  'Prolactin (to exclude other conditions)',
  'Sex hormone binding globulin (SHBG)',
  'Hemoglobin A1C (3-month blood sugar)',
  'Anti-Müllerian Hormone (AMH)',
]

const pcosTreatmentApproaches = [
  {
    title: 'Lifestyle Modifications',
    icon: <Sprout className="h-5 w-5 text-emerald-500" />,
    desc: 'The first-line treatment for all PCOS types — and the foundation every other approach builds upon.',
    items: [
      { label: 'Diet', detail: 'Low-glycemic, anti-inflammatory foods. Prioritize protein, fiber, healthy fats. Limit added sugars and refined carbs.' },
      { label: 'Exercise', detail: '150+ minutes/week of mixed cardio and strength training. Even small consistent movement improves insulin sensitivity.' },
      { label: 'Sleep', detail: '7–9 hours nightly. Poor sleep raises cortisol and insulin — both worsen PCOS symptoms.' },
      { label: 'Stress Management', detail: 'Daily mindfulness, yoga, breathwork, or journaling. Chronic stress drives adrenal androgens.' },
    ],
  },
  {
    title: 'Medications',
    icon: <Pill className="h-5 w-5 text-pink-500" />,
    desc: 'Prescribed by your doctor based on your specific symptoms, labs, and goals (fertility vs. symptom control).',
    items: [
      { label: 'Metformin', detail: 'Improves insulin sensitivity, lowers androgens, helps with weight and ovulation. Common first prescription.' },
      { label: 'Birth Control Pills', detail: 'Regulate cycles, reduce acne and excess hair. Manages symptoms but does not treat the root cause.' },
      { label: 'Spironolactone', detail: 'Anti-androgen that reduces hirsutism, acne, and hair loss. Often paired with contraception.' },
      { label: 'Clomid / Letrozole', detail: 'Ovulation induction for women trying to conceive. Letrozole is now preferred over Clomid for PCOS.' },
    ],
  },
  {
    title: 'Natural Supplements',
    icon: <FlaskConical className="h-5 w-5 text-amber-500" />,
    desc: 'May complement lifestyle and medication. Always consult your provider before starting — doses matter.',
    items: [
      { label: 'Myo-Inositol & D-Chiro-Inositol', detail: '40:1 ratio is most studied. Improves insulin sensitivity and ovulation in ~70% of women.' },
      { label: 'Vitamin D', detail: 'Up to 85% of women with PCOS are deficient. Repletion improves insulin resistance and fertility.' },
      { label: 'Omega-3 (EPA/DHA)', detail: 'Reduces inflammation, lowers testosterone, improves lipid profile. 1–2g daily.' },
      { label: 'Zinc', detail: 'Supports hormone balance, reduces hirsutism and acne. 15–30mg daily with food.' },
    ],
  },
]

const pcosStatistics = [
  {
    label: 'Global Prevalence',
    value: '8–13%',
    sub: 'of reproductive-age women',
    icon: <Activity className="h-5 w-5 text-rose-500" />,
    color: 'rose',
  },
  {
    label: 'Time to Diagnosis',
    value: '2–3 yrs',
    sub: 'average delay worldwide',
    icon: <Clock className="h-5 w-5 text-amber-500" />,
    color: 'amber',
  },
  {
    label: 'Lifestyle Success',
    value: '60–80%',
    sub: 'symptom improvement with changes',
    icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
    color: 'emerald',
  },
  {
    label: 'Pregnancy Success',
    value: '70–80%',
    sub: 'with ovulation induction',
    icon: <Flower2 className="h-5 w-5 text-pink-500" />,
    color: 'pink',
  },
]

const pcosMythsFacts = [
  {
    myth: 'PCOS means you have cysts on your ovaries.',
    fact: 'Not always — many women with PCOS do not have cysts, and many women with cysts do not have PCOS. Diagnosis requires 2 of 3 Rotterdam criteria.',
  },
  {
    myth: 'You can\'t get pregnant with PCOS.',
    fact: 'Many women with PCOS conceive naturally or with treatment. Up to 80% success rate with ovulation induction (Clomid/Letrozole).',
  },
  {
    myth: 'PCOS only affects overweight women.',
    fact: 'PCOS affects women of all sizes. Lean PCOS is real and often under-diagnosed because weight is mistakenly used as a gatekeeper symptom.',
  },
  {
    myth: 'PCOS goes away after menopause.',
    fact: 'Symptoms may change, but the underlying metabolic issues (insulin resistance, diabetes risk) persist and require lifelong management.',
  },
  {
    myth: 'Birth control cures PCOS.',
    fact: 'Birth control manages symptoms (cycles, acne, hair) but does not treat the root cause. Symptoms often return when stopped.',
  },
]

const pcosFaqs = [
  {
    q: 'Is PCOS curable?',
    a: 'PCOS is not curable, but it is highly manageable. With the right combination of lifestyle changes, supplements, and (when needed) medication, most women see significant improvement in symptoms and long-term health outcomes. PCOS is a lifelong condition, but it does not have to define your life.',
  },
  {
    q: 'Can I get pregnant with PCOS?',
    a: 'Yes — absolutely. PCOS is one of the most treatable causes of infertility. Many women conceive naturally once cycles regulate. For those who need help, ovulation induction with Letrozole or Clomid has a 70–80% success rate, and IVF is an option if needed. Working with a fertility specialist early can speed up the journey.',
  },
  {
    q: 'Does PCOS cause weight gain?',
    a: 'PCOS makes weight gain easier and weight loss harder — but it does not cause weight gain directly. Insulin resistance promotes fat storage (especially around the abdomen), and hormonal imbalances affect appetite and metabolism. Targeted diet, strength training, and insulin-sensitizing strategies can break the cycle.',
  },
  {
    q: 'Is PCOS genetic?',
    a: 'There is a strong genetic component. If your mother, sister, or aunt has PCOS, your risk is significantly higher. However, genes are not destiny — environment, diet, stress, and lifestyle play a major role in whether those genes are "expressed." This is why lifestyle changes are so effective.',
  },
  {
    q: 'Can diet really help PCOS?',
    a: 'Yes — diet is one of the most powerful tools for managing PCOS. A low-glycemic, anti-inflammatory diet improves insulin sensitivity in 60–80% of women. Even a 5–10% reduction in body weight can restore ovulation. Focus on whole foods, protein, fiber, healthy fats, and minimal added sugars.',
  },
  {
    q: 'What foods should I avoid with PCOS?',
    a: 'Limit refined carbohydrates (white bread, pastries), sugary drinks, processed snacks, fried foods, and excess dairy. These spike blood sugar, worsen insulin resistance, and promote inflammation. That said, no food is strictly "off-limits" forever — focus on a sustainable, balanced approach rather than rigid restriction.',
  },
  {
    q: 'How long does it take to see results from lifestyle changes?',
    a: 'Most women notice energy and mood improvements within 2–4 weeks. Cycle changes typically take 3–6 months of consistent effort. Skin and hair changes (acne reduction, less hair growth) may take 6–12 months. Sustainable habits compound over time — patience and consistency matter more than perfection.',
  },
  {
    q: 'When should I see a specialist?',
    a: 'See a healthcare provider if you have irregular periods, excess hair growth, persistent acne, or difficulty conceiving. Ask for a referral to an endocrinologist (for hormonal/metabolic care) or a reproductive endocrinologist (for fertility). A registered dietitian specializing in PCOS can also be invaluable.',
  },
]

const pcosRecommendedReading = [
  {
    name: 'PCOS Awareness Association',
    url: 'https://pcosawarenessassociation.org',
    desc: 'Education, advocacy, and community support for women with PCOS.',
  },
  {
    name: 'CDC — PCOS Information',
    url: 'https://www.cdc.gov/diabetes/about/pcos.html',
    desc: 'U.S. government resource on PCOS and its link to diabetes.',
  },
  {
    name: 'Mayo Clinic — PCOS',
    url: 'https://www.mayoclinic.org/diseases-conditions/pcos',
    desc: 'Comprehensive medical overview of causes, symptoms, and treatment.',
  },
  {
    name: 'NIH — PCOS Research',
    url: 'https://www.nichd.nih.gov/health/topics/pcos',
    desc: 'Latest research, clinical trials, and evidence-based information.',
  },
  {
    name: 'Office on Women\'s Health',
    url: 'https://www.womenshealth.gov/pcos',
    desc: 'Trusted government resource covering all aspects of PCOS care.',
  },
]

// ─── Motion variants for stagger animations ──────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

// ─── Circular Gauge Component ───────────────────────────────────────────────

function CircularGauge({ value, size = 180 }: { value: number; size?: number }) {
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (value / 100) * circumference
  const center = size / 2

  const getColorZone = (val: number) => {
    if (val <= 30) return { color: '#22c55e', label: 'Low Risk', bg: 'bg-green-50 dark:bg-green-950/20' }
    if (val <= 55) return { color: '#eab308', label: 'Moderate Risk', bg: 'bg-yellow-50 dark:bg-yellow-950/20' }
    if (val <= 75) return { color: '#f97316', label: 'High Risk', bg: 'bg-orange-50 dark:bg-orange-950/20' }
    return { color: '#ef4444', label: 'Very High Risk', bg: 'bg-red-50 dark:bg-red-950/20' }
  }

  const zone = getColorZone(value)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative rounded-2xl p-6 ${zone.bg}`}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={zone.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold"
            style={{ color: zone.color }}
          >
            {value}
          </motion.span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
            / 100
          </span>
        </div>
      </div>
      <Badge
        className="text-xs font-semibold px-3 py-1"
        style={{ backgroundColor: zone.color + '20', color: zone.color, borderColor: zone.color + '40' }}
        variant="outline"
      >
        {zone.label}
      </Badge>
    </div>
  )
}

// ─── Progress Ring Component ────────────────────────────────────────────────

function ProgressRing({ value, max, size = 80, color = '#ec4899' }: { value: number; max: number; size?: number; color?: string }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (value / max) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PCOSModule() {
  const [symptoms, setSymptoms] = useState<PCOSSymptom[]>(initialSymptoms)
  const [exerciseMinutes, setExerciseMinutes] = useState(0)
  const [dietScore, setDietScore] = useState(0)
  const [weightData, setWeightData] = useState<Array<{ month: string; weight: number }>>([])
  const [sleepQualityData, setSleepQualityData] = useState<Array<{ month: string; quality: number }>>([])
  const [reportCardData, setReportCardData] = useState<
    Array<{ category: string; score: number; fullMark: number }>
  >([])

  // Fetch real PCOS history (and derive weight/sleep/report data from it) once logged in.
  // The schema doesn't have a separate weight table — the PCOS record carries exerciseMinutes & dietQuality,
  // and the report-card scores are derived from those plus symptom counts.
  const userProfile = useAppStore((s) => s.userProfile)
  useEffect(() => {
    if (!userProfile?.id) return
    let cancelled = false
    fetch(`/api/pcos?userId=${encodeURIComponent(userProfile.id)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((records: Array<{ date: string; exerciseMinutes: number; dietQuality: number; riskScore: number }> = []) => {
        if (cancelled || !Array.isArray(records)) return
        // Build weight trend from exercise/diet history (note: no actual weight field in schema; show entries count by month as a placeholder)
        // Build sleep trend: we don't have sleep data here; skip until a real sleep API connection is wired.
        // Build report card from latest 30 days
        if (records.length > 0) {
          const last30 = records.slice(0, 30)
          const avgExercise = Math.round(
            last30.reduce((a, b) => a + (b.exerciseMinutes ?? 0), 0) / last30.length
          )
          const avgDiet = Math.round(
            (last30.reduce((a, b) => a + (b.dietQuality ?? 0), 0) / last30.length) * 20
          )
          const avgSymptom = Math.round(100 - (last30[0]?.riskScore ?? 0))
          setExerciseMinutes(avgExercise)
          setReportCardData([
            { category: 'Diet', score: avgDiet, fullMark: 100 },
            { category: 'Exercise', score: Math.min(100, Math.round((avgExercise / 150) * 100)), fullMark: 100 },
            { category: 'Symptoms', score: avgSymptom, fullMark: 100 },
          ])
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userProfile?.id])

  // Calculate PCOS risk score based on checked symptoms
  const riskScore = useMemo(() => {
    const checked = symptoms.filter((s) => s.checked)
    const baseScore = checked.length * 11
    const severityBonus = checked.reduce((acc, s) => {
      if (!s.checked) return acc
      switch (s.severity) {
        case 'mild': return acc + 2
        case 'moderate': return acc + 5
        case 'severe': return acc + 8
        default: return acc
      }
    }, 0)
    return Math.min(Math.round(baseScore + severityBonus), 100)
  }, [symptoms])

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, checked: !s.checked, severity: !s.checked ? 'mild' : 'none' }
          : s
      )
    )
  }

  const setSeverity = (id: string, severity: 'none' | 'mild' | 'moderate' | 'severe') => {
    setSymptoms((prev) =>
      prev.map((s) => (s.id === id ? { ...s, severity } : s))
    )
  }

  // Generate recommendations based on checked symptoms
  const recommendations: Recommendation[] = useMemo(() => {
    const recs: Recommendation[] = []
    const checkedIds = symptoms.filter((s) => s.checked).map((s) => s.id)

    if (checkedIds.includes('weight-gain') || checkedIds.includes('irregular-periods')) {
      recs.push({
        category: 'Diet Tips',
        icon: <Apple className="h-4 w-4 text-amber-500" />,
        items: [
          'Focus on low-glycemic index foods like whole grains, beans, and lentils',
          'Increase fiber intake to 25-30g daily to improve insulin sensitivity',
          'Include anti-inflammatory foods: berries, fatty fish, leafy greens',
          'Limit processed foods and added sugars',
        ],
        priority: 'high',
      })
    }

    if (checkedIds.includes('weight-gain') || checkedIds.includes('fatigue') || checkedIds.includes('mood-changes')) {
      recs.push({
        category: 'Exercise Plan',
        icon: <Dumbbell className="h-4 w-4 text-emerald-500" />,
        items: [
          'Aim for 150 min/week of moderate cardio (brisk walking, swimming)',
          'Add strength training 2-3 times per week to improve insulin sensitivity',
          'Try yoga or Pilates for stress reduction and hormone balance',
          'Even 10-minute walks after meals help regulate blood sugar',
        ],
        priority: 'high',
      })
    }

    if (checkedIds.includes('mood-changes') || checkedIds.includes('sleep-issues') || checkedIds.includes('fatigue')) {
      recs.push({
        category: 'Lifestyle Changes',
        icon: <Moon className="h-4 w-4 text-indigo-500" />,
        items: [
          'Prioritize 7-9 hours of quality sleep each night',
          'Practice stress management: meditation, deep breathing, journaling',
          'Consider inositol supplements (consult your doctor first)',
          'Maintain a consistent daily routine for circadian rhythm support',
        ],
        priority: 'medium',
      })
    }

    if (checkedIds.length >= 3) {
      recs.push({
        category: 'When to See a Doctor',
        icon: <Stethoscope className="h-4 w-4 text-red-500" />,
        items: [
          'Schedule an appointment with an endocrinologist for comprehensive evaluation',
          'Request hormone panel blood test (testosterone, insulin, LH/FSH ratio)',
          'Ask about metformin or other medication options if lifestyle changes aren\'t enough',
          'Consider working with a registered dietitian specializing in PCOS',
        ],
        priority: 'high',
      })
    }

    if (checkedIds.includes('excess-hair') || checkedIds.includes('acne') || checkedIds.includes('hair-loss')) {
      recs.push({
        category: 'Skin & Hair Care',
        icon: <Sparkles className="h-4 w-4 text-pink-500" />,
        items: [
          'Use gentle, non-comedogenic skincare products',
          'Consider spearmint tea (2 cups/day) for anti-androgen effects',
          'Explore laser hair removal or prescription creams with your dermatologist',
          'Biotin and zinc supplements may support hair health',
        ],
        priority: 'medium',
      })
    }

    if (recs.length === 0) {
      recs.push({
        category: 'General Wellness',
        icon: <Heart className="h-4 w-4 text-pink-500" />,
        items: [
          'Maintain a balanced diet rich in whole foods',
          'Stay active with at least 30 minutes of daily movement',
          'Track your symptoms regularly to catch patterns early',
          'Stay hydrated and prioritize sleep hygiene',
        ],
        priority: 'low',
      })
    }

    return recs
  }, [symptoms])

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
            PCOS Management
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">Track symptoms, get insights, and manage your PCOS journey</p>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 bg-amber-50/50 dark:bg-amber-950/20 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-amber-700 dark:text-amber-300">
            <Flower2 className="h-3.5 w-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="symptoms" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-pink-700 dark:text-pink-300">
            <Activity className="h-3.5 w-3.5 mr-1.5" /> Symptoms
          </TabsTrigger>
          <TabsTrigger value="tracking" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-amber-700 dark:text-amber-300">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Tracking
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Tips
          </TabsTrigger>
          <TabsTrigger value="report" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white text-violet-700 dark:text-violet-300">
            <FileBarChart className="h-3.5 w-3.5 mr-1.5" /> Report
          </TabsTrigger>
          <TabsTrigger value="research" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white text-rose-700 dark:text-rose-300">
            <Microscope className="h-3.5 w-3.5 mr-1.5" /> Research
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white text-sky-700 dark:text-sky-300">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Resources
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="lg:col-span-1"
            >
              <Card className="border-amber-200/50 dark:border-amber-800/30 h-full">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-500" /> PCOS Risk Score
                  </CardTitle>
                  <CardDescription>Based on your reported symptoms</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <CircularGauge value={riskScore} />
                  <p className="text-xs text-muted-foreground text-center mt-3 max-w-[200px]">
                    {symptoms.filter((s) => s.checked).length} symptom{symptoms.filter((s) => s.checked).length !== 1 ? 's' : ''} reported
                  </p>
                  {riskScore >= 50 && (
                    <Button
                      size="sm"
                      className="mt-3 bg-teal-600 hover:bg-teal-700 text-white text-xs"
                      onClick={() => useAppStore.getState().setActiveModule('doctors')}
                    >
                      <Stethoscope className="h-3.5 w-3.5 mr-1.5" /> Consult a Specialist
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 grid grid-cols-2 gap-4"
            >
              {/* Weight Trend Mini */}
              <Card className="border-amber-200/50 dark:border-amber-800/30 col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-500" /> Weight Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weightData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <TrendingDown className="h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">No weight entries yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Log your weight in the Tracking tab to see your trend here.
                      </p>
                    </div>
                  ) : (
                    <div className="h-[120px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weightData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                          <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 9 }} stroke="#9ca3af" />
                          <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#f59e0b' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exercise Progress */}
              <Card className="border-emerald-200/50 dark:border-emerald-800/30">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                  <ProgressRing value={exerciseMinutes} max={150} color="#10b981" />
                  <span className="text-xs font-medium text-muted-foreground">Exercise this week</span>
                  <span className="text-[10px] text-muted-foreground">{exerciseMinutes} / 150 min</span>
                  <div className="w-full">
                    <Progress value={(exerciseMinutes / 150) * 100} className="h-1.5 [&>[data-slot=progress-indicator]]:bg-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              {/* Diet Quality */}
              <Card className="border-amber-200/50 dark:border-amber-800/30">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDietScore(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= dietScore
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 dark:text-gray-700'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Diet Quality</span>
                  <span className="text-[10px] text-muted-foreground">{dietScore} / 5 stars today</span>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── Symptoms Checklist ────────────────────────────────────── */}
        <TabsContent value="symptoms" className="mt-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-pink-200/50 dark:border-pink-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-pink-500" /> Symptom Checklist
                </CardTitle>
                <CardDescription>
                  Toggle the symptoms you&apos;re experiencing and rate their severity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {symptoms.map((symptom, index) => (
                    <motion.div
                      key={symptom.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-xl border p-4 transition-all ${
                        symptom.checked
                          ? 'border-pink-300 bg-pink-50/60 dark:bg-pink-950/20 dark:border-pink-800/50'
                          : 'border-border hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={symptom.checked}
                            onCheckedChange={() => toggleSymptom(symptom.id)}
                            className="data-[state=checked]:bg-pink-500"
                          />
                          <span className={`font-medium text-sm ${symptom.checked ? 'text-pink-700 dark:text-pink-300' : ''}`}>
                            {symptom.label}
                          </span>
                        </div>
                        {symptom.checked && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            className="flex gap-1.5"
                          >
                            {(['mild', 'moderate', 'severe'] as const).map((sev) => {
                              const colors: Record<string, string> = {
                                mild: 'bg-green-400',
                                moderate: 'bg-amber-400',
                                severe: 'bg-red-400',
                              }
                              return (
                                <button
                                  key={sev}
                                  onClick={() => setSeverity(symptom.id, sev)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                                    symptom.severity === sev
                                      ? `${colors[sev]} text-white border-transparent`
                                      : 'border-border text-muted-foreground hover:border-pink-300'
                                  }`}
                                >
                                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                                </button>
                              )
                            })}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-r from-amber-50/50 to-pink-50/50 dark:from-amber-950/10 dark:to-pink-950/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${
                    symptoms.filter((s) => s.checked).length >= 4
                      ? 'text-red-500'
                      : symptoms.filter((s) => s.checked).length >= 2
                        ? 'text-amber-500'
                        : 'text-green-500'
                  }`} />
                  <div>
                    <p className="font-semibold text-sm">
                      {symptoms.filter((s) => s.checked).length === 0
                        ? 'No symptoms reported'
                        : `${symptoms.filter((s) => s.checked).length} symptom${symptoms.filter((s) => s.checked).length > 1 ? 's' : ''} reported`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {symptoms.filter((s) => s.checked).length >= 4
                        ? 'Consider scheduling a consultation with your healthcare provider for a comprehensive evaluation.'
                        : symptoms.filter((s) => s.checked).length >= 2
                          ? 'Keep tracking your symptoms to identify patterns and discuss with your doctor.'
                          : 'Great! Continue monitoring and logging any changes.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── Tracking Dashboard ────────────────────────────────────── */}
        <TabsContent value="tracking" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight Trend */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-amber-200/50 dark:border-amber-800/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-500" /> Weight Trend
                  </CardTitle>
                  <CardDescription>Last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {weightData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <TrendingDown className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">No weight entries yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Your weight trend will appear here once you start logging.
                      </p>
                    </div>
                  ) : (
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weightData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                          <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }} stroke="#9ca3af" />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: '1px solid #fcd34d' }}
                            formatter={(value: number) => [`${value} kg`, 'Weight']}
                          />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#f59e0b"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Exercise */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-emerald-200/50 dark:border-emerald-800/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-emerald-500" /> Exercise This Week
                  </CardTitle>
                  <CardDescription>Goal: 150 minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <ProgressRing value={exerciseMinutes} max={150} size={140} color="#10b981" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{exerciseMinutes}</p>
                      <p className="text-xs text-muted-foreground">of 150 minutes</p>
                    </div>
                    <div className="w-full">
                      <Progress value={(exerciseMinutes / 150) * 100} className="h-2.5 [&>[data-slot=progress-indicator]]:bg-emerald-400" />
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => setExerciseMinutes(Math.max(0, exerciseMinutes - 15))}
                      >
                        −15 min
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => setExerciseMinutes(Math.min(300, exerciseMinutes + 15))}
                      >
                        +15 min
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Diet Quality */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-amber-200/50 dark:border-amber-800/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Apple className="h-4 w-4 text-amber-500" /> Diet Quality Score
                  </CardTitle>
                  <CardDescription>Rate your daily nutrition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => setDietScore(star)}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`h-10 w-10 transition-all duration-200 ${
                              star <= dietScore
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-gray-200 dark:text-gray-700'
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">
                        {dietScore <= 2 ? 'Needs Improvement' : dietScore <= 3 ? 'Fair' : dietScore <= 4 ? 'Good' : 'Excellent'}
                      </p>
                      <p className="text-xs text-muted-foreground">{dietScore} / 5 stars today</p>
                    </div>
                    <div className="w-full grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 rounded-full transition-colors ${
                            level <= dietScore ? 'bg-amber-400' : 'bg-amber-100 dark:bg-amber-900/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sleep Quality Trend */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-indigo-200/50 dark:border-indigo-800/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-500" /> Sleep Quality Trend
                  </CardTitle>
                  <CardDescription>Monthly average (1-5 scale)</CardDescription>
                </CardHeader>
                <CardContent>
                  {sleepQualityData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Moon className="h-7 w-7 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">No sleep data yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Log sleep in the Symptoms Tracker to populate your monthly sleep quality trend.
                      </p>
                    </div>
                  ) : (
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sleepQualityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 9 }} stroke="#9ca3af" />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: '1px solid #a5b4fc' }}
                            formatter={(value: number) => [`${value}/5`, 'Quality']}
                          />
                          <Line
                            type="monotone"
                            dataKey="quality"
                            stroke="#818cf8"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── AI Recommendations ─────────────────────────────────────── */}
        <TabsContent value="recommendations" className="mt-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/30 to-amber-50/30 dark:from-emerald-950/10 dark:to-amber-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" /> AI Recommendations
                </CardTitle>
                <CardDescription>
                  Personalized tips based on your reported symptoms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="rounded-xl bg-white/70 dark:bg-card/50 border border-emerald-100 dark:border-emerald-900/30 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 pb-3">
                      <div className="flex items-center gap-2.5">
                        {rec.icon}
                        <h4 className="font-semibold text-sm">{rec.category}</h4>
                      </div>
                      <Badge className={`text-[9px] px-2 py-0.5 ${priorityColors[rec.priority]}`} variant="secondary">
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <Separator />
                    <ul className="p-4 space-y-2.5">
                      {rec.items.map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.15 + i * 0.08 }}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── PCOS Report Card ────────────────────────────────────────── */}
        <TabsContent value="report" className="mt-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-violet-200/50 dark:border-violet-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-violet-500" /> Monthly Report Card
                </CardTitle>
                <CardDescription>Your PCOS management scores for this month</CardDescription>
              </CardHeader>
              <CardContent>
                {reportCardData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileBarChart className="h-8 w-8 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">No report card yet</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Log PCOS symptoms, exercise, and diet for a few weeks to populate your monthly report card.
                    </p>
                  </div>
                ) : (
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={reportCardData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                        <Radar
                          name="This Month"
                          dataKey="score"
                          stroke="#ec4899"
                          fill="#ec4899"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Individual scores */}
          {reportCardData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportCardData.map((item, index) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -2 }}
              >
                <Card className="overflow-hidden">
                  <div
                    className="h-1.5"
                    style={{
                      backgroundColor:
                        item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span
                        className="text-lg font-bold"
                        style={{
                          color:
                            item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        {item.score}
                      </span>
                    </div>
                    <Progress
                      value={item.score}
                      className="h-2"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {item.score >= 80
                        ? 'Excellent! Keep it up!'
                        : item.score >= 60
                          ? 'Good progress, room for improvement'
                          : 'Needs attention'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        </TabsContent>

        {/* ─── Research & Learn ────────────────────────────────────────── */}
        <TabsContent value="research" className="mt-4 space-y-6">

          {/* Section intro */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-pink-50 dark:from-rose-950/20 dark:via-amber-950/20 dark:to-pink-950/20 border border-rose-200/40 dark:border-rose-800/30 p-5 flex items-start gap-4"
          >
            <div className="rounded-xl bg-white/70 dark:bg-card/60 p-2.5 shadow-sm shrink-0">
              <Microscope className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                Research &amp; Learn
                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-[10px] border-0">Education Hub</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Evidence-based information to help you understand PCOS — from underlying causes and symptom patterns to diagnosis, treatment, and long-term health. Always discuss what you learn with your healthcare provider.
              </p>
            </div>
          </motion.div>

          {/* A. What is PCOS? */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-rose-200/50 dark:border-rose-800/30 bg-gradient-to-br from-amber-50/40 to-pink-50/40 dark:from-amber-950/10 dark:to-pink-950/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-5 w-5 text-rose-500" /> What is PCOS?
                </CardTitle>
                <CardDescription>A comprehensive overview of Polycystic Ovary Syndrome</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="definition" className="w-full">
                  <AccordionItem value="definition" className="border-rose-100 dark:border-rose-900/30">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2.5">
                        <Info className="h-4 w-4 text-rose-500 shrink-0" />
                        <span className="font-semibold text-sm">Definition &amp; Overview</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground pl-6">
                        <p>
                          <strong className="text-foreground">Polycystic Ovary Syndrome (PCOS)</strong> is a hormonal disorder common among women of reproductive age. It is characterized by a combination of irregular menstrual cycles, elevated androgen levels, and polycystic ovaries on imaging.
                        </p>
                        <p>
                          PCOS affects the ovaries — the reproductive organs that produce estrogen and progesterone, the hormones that regulate the menstrual cycle. The ovaries also produce a small amount of male hormones (androgens) like testosterone. In PCOS, this balance is disrupted.
                        </p>
                        <p>
                          Left unmanaged, PCOS can lead to metabolic complications and infertility — but with early diagnosis and a personalized plan, most women manage symptoms effectively and lead full, healthy lives.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="prevalence" className="border-rose-100 dark:border-rose-900/30">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2.5">
                        <TrendingUp className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="font-semibold text-sm">Prevalence &amp; Who It Affects</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm text-muted-foreground pl-6">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl font-bold text-rose-500 shrink-0">1 in 10</span>
                          <p>women of reproductive age are affected by PCOS worldwide — making it one of the most common endocrine disorders in this group.</p>
                        </div>
                        <p>
                          Globally, <strong className="text-foreground">8–13%</strong> of reproductive-age women meet diagnostic criteria, yet up to <strong className="text-foreground">70%</strong> remain undiagnosed. PCOS affects women of all races, ethnicities, and body sizes — though symptoms and presentation may vary.
                        </p>
                        <p>
                          It typically begins after puberty, with most women diagnosed in their 20s and 30s when evaluating irregular cycles or fertility concerns.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="characteristics" className="border-rose-100 dark:border-rose-900/30">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2.5">
                        <Layers className="h-4 w-4 text-pink-500 shrink-0" />
                        <span className="font-semibold text-sm">Key Characteristics</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2.5 text-sm text-muted-foreground pl-6">
                        {[
                          'Irregular or absent menstrual periods due to lack of ovulation',
                          'Excess androgen hormones causing acne, hirsutism, and hair loss',
                          'Polycystic ovaries (12+ small follicles) visible on ultrasound',
                          'Insulin resistance affecting 70% of women with PCOS',
                          'Metabolic issues including weight gain and diabetes risk',
                          'Long-term risks for cardiovascular and endometrial health',
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>

          {/* B. Causes & Risk Factors */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dna className="h-5 w-5 text-amber-500" /> Causes &amp; Risk Factors
                </CardTitle>
                <CardDescription>The four main drivers behind PCOS</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {pcosCauses.map((cause) => (
                    <motion.div
                      key={cause.title}
                      variants={staggerItem}
                      whileHover={{ y: -3 }}
                      className={`rounded-xl border p-4 ${cause.border} ${cause.bg} transition-shadow hover:shadow-md`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-white/70 dark:bg-card/60 p-2 shadow-sm">
                          {cause.icon}
                        </div>
                        <h4 className="font-semibold text-sm">{cause.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{cause.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* C. Symptoms to Watch */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-pink-200/50 dark:border-pink-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-pink-500" /> Symptoms to Watch
                </CardTitle>
                <CardDescription>Common signs of PCOS with severity indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {pcosSymptomsToWatch.map((symptom) => (
                    <motion.div
                      key={symptom.title}
                      variants={staggerItem}
                      whileHover={{ y: -3 }}
                      className="rounded-xl border border-border bg-card/60 dark:bg-card/40 backdrop-blur-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="rounded-lg bg-pink-50 dark:bg-pink-950/30 p-2">
                          {symptom.icon}
                        </div>
                        <Badge variant="secondary" className={`text-[9px] px-2 py-0.5 ${symptom.severityColor}`}>
                          {symptom.severity}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm mb-1.5">{symptom.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{symptom.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* D. PCOS Types */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-500" /> PCOS Types
                </CardTitle>
                <CardDescription>
                  Not all PCOS is the same — identifying your type guides treatment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {pcosTypes.map((type) => (
                    <motion.div
                      key={type.name}
                      variants={staggerItem}
                      whileHover={{ y: -4 }}
                      className="rounded-xl overflow-hidden border border-border bg-card/60 dark:bg-card/40 backdrop-blur-sm hover:shadow-lg transition-shadow"
                    >
                      <div className={`h-20 bg-gradient-to-r ${type.gradient} flex items-center justify-between px-4`}>
                        <div className="rounded-lg bg-white/20 backdrop-blur-sm p-2">
                          {type.icon}
                        </div>
                        <Badge className="bg-white/25 text-white border-0 text-[10px] font-bold">
                          {type.prevalence}
                        </Badge>
                      </div>
                      <div className="p-4 space-y-2.5">
                        <h4 className="font-semibold text-sm">{type.name}</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground font-medium shrink-0 w-20">Markers:</span>
                            <span className="text-foreground">{type.markers}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground font-medium shrink-0 w-20">Root cause:</span>
                            <span className="text-foreground">{type.rootCause}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground font-medium shrink-0 w-20">Approach:</span>
                            <span className="text-foreground">{type.approach}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* E. Long-term Health Impact */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="border-orange-200/50 dark:border-orange-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" /> Long-term Health Impact
                </CardTitle>
                <CardDescription>
                  Risks associated with unmanaged PCOS — and how to reduce them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {pcosLongTermRisks.map((risk) => (
                    <motion.div
                      key={risk.title}
                      variants={staggerItem}
                      whileHover={{ y: -3 }}
                      className="rounded-xl border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/40 dark:bg-orange-950/10 backdrop-blur-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="rounded-lg bg-white/70 dark:bg-card/60 p-2 shadow-sm">
                          {risk.icon}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-none">{risk.risk}</div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">{risk.riskLabel}</div>
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{risk.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">{risk.desc}</p>
                      <Separator className="mb-2.5 bg-orange-200/50 dark:bg-orange-800/30" />
                      <div className="flex items-start gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground">Prevention: </span>{risk.prevention}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* F. Diagnosis & Testing */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-rose-200/50 dark:border-rose-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-rose-500" /> Diagnosis &amp; Testing
                </CardTitle>
                <CardDescription>How PCOS is identified and confirmed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Rotterdam Criteria */}
                <div className="rounded-xl border border-rose-200/60 dark:border-rose-800/40 bg-rose-50/40 dark:bg-rose-950/10 p-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-rose-500" /> Rotterdam Criteria
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Diagnosis requires <strong className="text-foreground">at least 2 of the 3</strong> criteria below (after excluding other conditions):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { num: '1', label: 'Irregular or absent ovulation', desc: 'Cycles under 21 or over 35 days' },
                      { num: '2', label: 'High androgen levels', desc: 'Blood test or physical signs' },
                      { num: '3', label: 'Polycystic ovaries', desc: '12+ follicles on ultrasound' },
                    ].map((criterion) => (
                      <div key={criterion.num} className="rounded-lg bg-white/70 dark:bg-card/50 p-3 border border-rose-100 dark:border-rose-900/30">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {criterion.num}
                          </span>
                          <span className="text-xs font-semibold">{criterion.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{criterion.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blood tests + Ultrasound grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Blood tests */}
                  <div className="rounded-xl border border-border bg-card/60 dark:bg-card/40 p-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                      <Droplet className="h-4 w-4 text-amber-500" /> Key Blood Tests
                    </h4>
                    <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {pcosBloodTests.map((test) => (
                        <li key={test} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{test}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ultrasound explanation */}
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-card/60 dark:bg-card/40 p-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-pink-500" /> Pelvic Ultrasound
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        A transvaginal or abdominal ultrasound checks for <strong className="text-foreground">12 or more follicles (2–9mm)</strong> or enlarged ovarian volume. However, ultrasound is <strong className="text-foreground">not required</strong> for diagnosis if the other two Rotterdam criteria are met.
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-1.5">
                        <Stethoscope className="h-4 w-4 text-emerald-500" /> When to Get Tested
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Consider evaluation if you have <strong className="text-foreground">irregular periods, excess hair growth, persistent acne, or unexplained weight gain</strong> — especially if symptoms persist for 2+ cycles. Early testing shortens the typical 2–3 year diagnostic delay.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* G. Treatment Approaches */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card className="border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-emerald-500" /> Treatment Approaches
                </CardTitle>
                <CardDescription>Expand each category to learn more</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {pcosTreatmentApproaches.map((approach) => (
                    <AccordionItem key={approach.title} value={approach.title} className="border-emerald-100 dark:border-emerald-900/30">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-1.5">
                            {approach.icon}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-sm">{approach.title}</div>
                            <div className="text-[10px] text-muted-foreground font-normal">{approach.desc}</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {approach.items.map((item) => (
                            <div key={item.label} className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-xs font-semibold">{item.label}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">{item.detail}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>

          {/* H. Latest Research & Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" /> Latest Research &amp; Statistics
                </CardTitle>
                <CardDescription>Key data points from global PCOS research</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {pcosStatistics.map((stat) => (
                    <motion.div
                      key={stat.label}
                      variants={staggerItem}
                      whileHover={{ y: -3, scale: 1.02 }}
                      className="rounded-xl border border-border bg-card/60 dark:bg-card/40 backdrop-blur-sm p-4 text-center hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-center mb-2">
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2">
                          {stat.icon}
                        </div>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent leading-tight">
                        {stat.value}
                      </div>
                      <div className="text-xs font-medium mt-1">{stat.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</div>
                    </motion.div>
                  ))}
                </motion.div>
                <p className="text-[10px] text-muted-foreground mt-4 text-center italic">
                  Sources: WHO, NIH, Monash University PCOS Guidelines, and peer-reviewed studies.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* I. Myths vs Facts */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <Card className="border-pink-200/50 dark:border-pink-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-pink-500" /> Myths vs Facts
                </CardTitle>
                <CardDescription>Clearing up common misconceptions about PCOS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {pcosMythsFacts.map((item) => (
                    <motion.div
                      key={item.myth}
                      variants={staggerItem}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl overflow-hidden border border-border"
                    >
                      {/* Myth */}
                      <div className="bg-red-50/70 dark:bg-red-950/20 p-3.5 border-r-0 md:border-r border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 dark:text-red-300">Myth</span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{item.myth}</p>
                      </div>
                      {/* Fact */}
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Fact</span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{item.fact}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* J. FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-amber-500" /> Frequently Asked Questions
                </CardTitle>
                <CardDescription>Answers to the questions women ask most about PCOS</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {pcosFaqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-amber-100 dark:border-amber-900/30">
                      <AccordionTrigger className="hover:no-underline text-sm">
                        <span className="font-medium">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-1">{faq.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>

          {/* K. Recommended Reading */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
          >
            <Card className="border-rose-200/50 dark:border-rose-800/30 bg-gradient-to-br from-amber-50/30 to-pink-50/30 dark:from-amber-950/10 dark:to-pink-950/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-rose-500" /> Recommended Reading
                </CardTitle>
                <CardDescription>Trusted sources for further research</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                >
                  {pcosRecommendedReading.map((source) => (
                    <motion.a
                      key={source.name}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variants={staggerItem}
                      whileHover={{ y: -3 }}
                      className="group block rounded-xl border border-border bg-card/60 dark:bg-card/40 backdrop-blur-sm p-4 hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-1.5 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition-colors">
                            <BookOpen className="h-3.5 w-3.5 text-rose-500" />
                          </div>
                          <h4 className="font-semibold text-xs group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {source.name}
                          </h4>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{source.desc}</p>
                      <p className="text-[10px] text-rose-500/70 mt-2 truncate">{source.url}</p>
                    </motion.a>
                  ))}
                </motion.div>

                {/* Disclaimer */}
                <div className="mt-5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Medical disclaimer:</strong> This educational content is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider before making decisions about your PCOS care.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </TabsContent>

        {/* ─── Resource Library ────────────────────────────────────────── */}
        <TabsContent value="resources" className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resourceLibrary.map((resource, index) => (
                <motion.div
                  key={resource.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
                  className="cursor-pointer group"
                >
                  <Card className="overflow-hidden h-full">
                    <div className={`h-24 bg-gradient-to-r ${resource.color} flex items-center justify-center relative`}>
                      <BookOpen className="h-10 w-10 text-white/70" />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white/20 text-white border-0 text-[9px]">
                          {resource.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-1 group-hover:text-pink-600 transition-colors flex items-center gap-1">
                        {resource.title}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {resource.description}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{resource.readTime} read</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
