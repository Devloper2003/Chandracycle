'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Apple,
  Utensils,
  Droplets,
  Flame,
  Salad,
  Wheat,
  Beef,
  Send,
  Sparkles,
  RotateCcw,
  User,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Leaf,
  Heart,
  Brain,
  Baby,
  Flower2,
  SunDim,
  Scale,
  Activity,
  Zap,
  Timer,
  Plus,
  GlassWater,
  Cookie,
  Trash2,
  Sparkle,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

type ConditionId =
  | 'pcos'
  | 'fertility'
  | 'pregnancy'
  | 'pms'
  | 'menopause'
  | 'hormone'
  | 'weight'
  | 'wellness'

interface FoodItem {
  name: string
  benefit: string
  emoji: string
}

interface MealItem {
  meal: string
  time: string
  foods: string[]
  calories: number
  emoji: string
}

interface NutritionTip {
  title: string
  description: string
  icon: 'leaf' | 'flame' | 'droplet' | 'apple' | 'heart' | 'brain' | 'zap'
}

interface MacroBreakdown {
  carbs: { pct: number; grams: number }
  protein: { pct: number; grams: number }
  fat: { pct: number; grams: number }
}

interface DietPlan {
  condition: ConditionId
  title: string
  description: string
  dailyCalories: number
  macros: MacroBreakdown
  foodsToEat: FoodItem[]
  foodsToAvoid: string[]
  mealPlan: MealItem[]
  tips: NutritionTip[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConditionMeta {
  id: ConditionId
  label: string
  short: string
  icon: React.ElementType
  // tailwind classes
  text: string
  bg: string
  border: string
  ring: string
  gradient: string
  emoji: string
}

// ─── Condition Metadata ─────────────────────────────────────────────────────

const conditions: ConditionMeta[] = [
  {
    id: 'pcos',
    label: 'PCOS Diet',
    short: 'PCOS',
    icon: Flower2,
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    ring: 'ring-amber-400 dark:ring-amber-500',
    gradient: 'from-amber-400 to-orange-500',
    emoji: '🌼',
  },
  {
    id: 'fertility',
    label: 'Fertility Diet',
    short: 'Fertility',
    icon: Baby,
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    ring: 'ring-rose-400 dark:ring-rose-500',
    gradient: 'from-rose-400 to-pink-500',
    emoji: '🌸',
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy Nutrition',
    short: 'Pregnancy',
    icon: Heart,
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    ring: 'ring-purple-400 dark:ring-purple-500',
    gradient: 'from-purple-400 to-violet-500',
    emoji: '🤰',
  },
  {
    id: 'pms',
    label: 'PMS & Period Diet',
    short: 'PMS',
    icon: Droplets,
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    ring: 'ring-red-400 dark:ring-red-500',
    gradient: 'from-red-400 to-rose-500',
    emoji: '🩸',
  },
  {
    id: 'menopause',
    label: 'Menopause Diet',
    short: 'Menopause',
    icon: SunDim,
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    ring: 'ring-orange-400 dark:ring-orange-500',
    gradient: 'from-orange-400 to-amber-500',
    emoji: '🌅',
  },
  {
    id: 'hormone',
    label: 'Hormone Balance',
    short: 'Hormones',
    icon: Activity,
    text: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
    ring: 'ring-teal-400 dark:ring-teal-500',
    gradient: 'from-teal-400 to-cyan-500',
    emoji: '⚖️',
  },
  {
    id: 'weight',
    label: 'Weight Management',
    short: 'Weight',
    icon: Scale,
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/40',
    border: 'border-green-200 dark:border-green-800',
    ring: 'ring-green-400 dark:ring-green-500',
    gradient: 'from-green-400 to-emerald-500',
    emoji: '⚖️',
  },
  {
    id: 'wellness',
    label: 'General Wellness',
    short: 'Wellness',
    icon: Sparkle,
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    ring: 'ring-sky-400 dark:ring-sky-500',
    gradient: 'from-sky-400 to-blue-500',
    emoji: '✨',
  },
]

// ─── Diet Plan Data ─────────────────────────────────────────────────────────

const dietPlans: Record<ConditionId, DietPlan> = {
  pcos: {
    condition: 'pcos',
    title: 'PCOS Nutrition Plan',
    description:
      'A low-glycemic, anti-inflammatory diet focused on improving insulin sensitivity, balancing hormones, and supporting sustainable weight management.',
    dailyCalories: 1800,
    macros: {
      carbs: { pct: 40, grams: 180 },
      protein: { pct: 30, grams: 135 },
      fat: { pct: 30, grams: 60 },
    },
    foodsToEat: [
      { name: 'Leafy Greens', benefit: 'High fiber & iron, low GI', emoji: '🥬' },
      { name: 'Berries', benefit: 'Antioxidants, low glycemic', emoji: '🫐' },
      { name: 'Cinnamon', benefit: 'Improves insulin sensitivity', emoji: '🟤' },
      { name: 'Quinoa', benefit: 'Complex carb, complete protein', emoji: '🌾' },
      { name: 'Lentils', benefit: 'Plant protein & fiber', emoji: '🫘' },
      { name: 'Salmon', benefit: 'Omega-3, anti-inflammatory', emoji: '🐟' },
      { name: 'Avocado', benefit: 'Monounsaturated fats', emoji: '🥑' },
      { name: 'Almonds', benefit: 'Magnesium & healthy fats', emoji: '🌰' },
      { name: 'Chia Seeds', benefit: 'Omega-3 & fiber', emoji: '⚫' },
      { name: 'Broccoli', benefit: 'Cruciferous, fiber-rich', emoji: '🥦' },
      { name: 'Eggs', benefit: 'High-quality protein', emoji: '🥚' },
      { name: 'Greek Yogurt', benefit: 'Probiotics & protein', emoji: '🥛' },
    ],
    foodsToAvoid: [
      'Refined sugars & sweets',
      'White bread & white rice',
      'Sugary drinks & sodas',
      'Processed snacks & chips',
      'Fried foods',
      'Excess full-fat sweetened dairy',
    ],
    mealPlan: [
      {
        meal: 'Breakfast',
        time: '8:00 AM',
        foods: ['Veggie omelet with spinach', '½ avocado', 'Green tea'],
        calories: 380,
        emoji: '🍳',
      },
      {
        meal: 'Lunch',
        time: '1:00 PM',
        foods: ['Quinoa salad with grilled chicken', 'Mixed greens', 'Olive oil dressing'],
        calories: 520,
        emoji: '🥗',
      },
      {
        meal: 'Snack',
        time: '4:00 PM',
        foods: ['Greek yogurt', 'Chia seeds', 'Mixed berries'],
        calories: 200,
        emoji: '🫐',
      },
      {
        meal: 'Dinner',
        time: '7:00 PM',
        foods: ['Baked salmon', 'Roasted broccoli', 'Sweet potato'],
        calories: 540,
        emoji: '🐟',
      },
    ],
    tips: [
      {
        title: 'Choose Low-GI Carbs',
        description: 'Prioritize complex carbs like quinoa, lentils, and sweet potato to keep blood sugar stable and reduce insulin spikes.',
        icon: 'leaf',
      },
      {
        title: 'Pair Protein Every Meal',
        description: 'Combining protein with carbs slows glucose absorption. Aim for 20–30g protein per meal from eggs, fish, legumes, or Greek yogurt.',
        icon: 'apple',
      },
      {
        title: 'Add Anti-Inflammatory Fats',
        description: 'Omega-3s from salmon, chia seeds, and walnuts help reduce the chronic inflammation often seen with PCOS.',
        icon: 'flame',
      },
      {
        title: 'Limit Added Sugars',
        description: 'Sugar drives insulin resistance. Read labels and choose whole fruit over sweets, and unsweetened drinks over soda.',
        icon: 'zap',
      },
    ],
  },

  fertility: {
    condition: 'fertility',
    title: 'Fertility Boosting Plan',
    description:
      'A nutrient-dense plan rich in folate, omega-3, antioxidants, and whole foods to support ovulation, egg quality, and hormonal balance.',
    dailyCalories: 2000,
    macros: {
      carbs: { pct: 45, grams: 225 },
      protein: { pct: 25, grams: 125 },
      fat: { pct: 30, grams: 67 },
    },
    foodsToEat: [
      { name: 'Leafy Greens', benefit: 'Folate & iron for ovulation', emoji: '🥬' },
      { name: 'Beans & Lentils', benefit: 'Plant protein & folate', emoji: '🫘' },
      { name: 'Whole Grains', benefit: 'B vitamins & fiber', emoji: '🌾' },
      { name: 'Salmon', benefit: 'Omega-3 & vitamin D', emoji: '🐟' },
      { name: 'Walnuts', benefit: 'Omega-3 for egg quality', emoji: '🌰' },
      { name: 'Avocado', benefit: 'Healthy fats for hormones', emoji: '🥑' },
      { name: 'Berries', benefit: 'Antioxidants protect eggs', emoji: '🍓' },
      { name: 'Pumpkin Seeds', benefit: 'Zinc supports fertility', emoji: '🎃' },
      { name: 'Full-Fat Dairy', benefit: 'Linked to healthy ovulation', emoji: '🥛' },
      { name: 'Olive Oil', benefit: 'Anti-inflammatory fats', emoji: '🫒' },
      { name: 'Sweet Potatoes', benefit: 'Beta-carotene & fiber', emoji: '🍠' },
      { name: 'Eggs', benefit: 'Choline & protein', emoji: '🥚' },
    ],
    foodsToAvoid: [
      'Trans fats (margarine, processed foods)',
      'High-mercury fish (swordfish, king mackerel)',
      'Excess soy protein isolates',
      'Refined carbs & added sugars',
      'More than 200mg caffeine per day',
      'Alcohol',
    ],
    mealPlan: [
      {
        meal: 'Breakfast',
        time: '8:00 AM',
        foods: ['Oatmeal with walnuts', 'Berries', 'Ground flaxseeds'],
        calories: 420,
        emoji: '🥣',
      },
      {
        meal: 'Lunch',
        time: '1:00 PM',
        foods: ['Lentil soup', 'Mixed greens salad', 'Olive oil dressing'],
        calories: 480,
        emoji: '🍲',
      },
      {
        meal: 'Snack',
        time: '4:00 PM',
        foods: ['Greek yogurt', 'Pumpkin seeds', 'Drizzle of honey'],
        calories: 220,
        emoji: '🥄',
      },
      {
        meal: 'Dinner',
        time: '7:00 PM',
        foods: ['Baked salmon', 'Quinoa', 'Roasted sweet potatoes'],
        calories: 580,
        emoji: '🐟',
      },
    ],
    tips: [
      {
        title: 'Boost Folate Intake',
        description: 'Folate is critical for early pregnancy. Load up on leafy greens, lentils, beans, and citrus fruits daily.',
        icon: 'leaf',
      },
      {
        title: 'Omega-3 for Egg Quality',
        description: 'Aim for 2 servings of low-mercury fish per week (salmon, sardines) plus plant omega-3s from walnuts, chia, and flax.',
        icon: 'heart',
      },
      {
        title: 'Limit Caffeine & Alcohol',
        description: 'Keep caffeine under 200mg/day (about 1 coffee) and avoid alcohol while trying to conceive for best outcomes.',
        icon: 'zap',
      },
      {
        title: 'Antioxidant-Rich Foods',
        description: 'Colorful berries, vegetables, and nuts protect reproductive cells from oxidative stress and support egg quality.',
        icon: 'apple',
      },
    ],
  },

  pregnancy: {
    condition: 'pregnancy',
    title: 'Pregnancy Nutrition Plan',
    description:
      'A balanced, food-safe plan rich in folate, iron, DHA, calcium, and protein to support baby\'s growth and maternal health.',
    dailyCalories: 2200,
    macros: {
      carbs: { pct: 45, grams: 248 },
      protein: { pct: 25, grams: 138 },
      fat: { pct: 30, grams: 73 },
    },
    foodsToEat: [
      { name: 'Spinach', benefit: 'Folate & iron', emoji: '🥬' },
      { name: 'Lentils', benefit: 'Protein, folate, fiber', emoji: '🫘' },
      { name: 'Salmon', benefit: 'DHA for baby\'s brain', emoji: '🐟' },
      { name: 'Eggs', benefit: 'Choline & protein', emoji: '🥚' },
      { name: 'Greek Yogurt', benefit: 'Calcium & protein', emoji: '🥛' },
      { name: 'Avocado', benefit: 'Folate & healthy fats', emoji: '🥑' },
      { name: 'Sweet Potatoes', benefit: 'Vitamin A & fiber', emoji: '🍠' },
      { name: 'Walnuts', benefit: 'Plant omega-3', emoji: '🌰' },
      { name: 'Oats', benefit: 'Fiber & B vitamins', emoji: '🥣' },
      { name: 'Berries', benefit: 'Vitamin C & antioxidants', emoji: '🍓' },
      { name: 'Broccoli', benefit: 'Calcium & folate', emoji: '🥦' },
      { name: 'Lean Beef', benefit: 'Iron & protein', emoji: '🥩' },
    ],
    foodsToAvoid: [
      'Raw or undercooked meat & fish',
      'High-mercury fish (swordfish, shark, tilefish)',
      'Unpasteurized dairy & soft cheeses',
      'Raw eggs & raw batter',
      'Deli meats (unless reheated to steaming)',
      'Alcohol (no known safe amount)',
    ],
    mealPlan: [
      {
        meal: 'Breakfast',
        time: '8:00 AM',
        foods: ['Oatmeal with berries & walnuts', 'Hard-boiled egg'],
        calories: 420,
        emoji: '🥣',
      },
      {
        meal: 'Lunch',
        time: '1:00 PM',
        foods: ['Spinach salad with grilled chicken', 'Chickpeas', 'Olive oil'],
        calories: 540,
        emoji: '🥗',
      },
      {
        meal: 'Snack',
        time: '4:00 PM',
        foods: ['Greek yogurt', 'Sliced banana', 'Almonds'],
        calories: 240,
        emoji: '🍌',
      },
      {
        meal: 'Dinner',
        time: '7:00 PM',
        foods: ['Baked salmon', 'Quinoa', 'Steamed broccoli'],
        calories: 580,
        emoji: '🐟',
      },
    ],
    tips: [
      {
        title: 'Prioritize Folate & Iron',
        description: 'Folate prevents neural tube defects and iron supports increased blood volume. Choose spinach, lentils, fortified grains, and lean meats.',
        icon: 'leaf',
      },
      {
        title: 'Stay Hydrated',
        description: 'Aim for 8–12 glasses of water daily. Hydration supports amniotic fluid, digestion, and helps prevent constipation.',
        icon: 'droplet',
      },
      {
        title: 'Small Frequent Meals',
        description: 'Eating every 2–3 hours can ease nausea, stabilize energy, and reduce heartburn — especially in the first and third trimesters.',
        icon: 'apple',
      },
      {
        title: 'Food Safety First',
        description: 'Avoid raw, undercooked, and unpasteurized foods. Reheat deli meats until steaming. Wash produce thoroughly to protect against listeria and toxoplasmosis.',
        icon: 'zap',
      },
    ],
  },

  pms: {
    condition: 'pms',
    title: 'PMS & Period Nutrition',
    description:
      'An anti-inflammatory, magnesium-rich plan to ease cramps, reduce bloating, stabilize mood, and replenish iron during your period.',
    dailyCalories: 1900,
    macros: {
      carbs: { pct: 45, grams: 214 },
      protein: { pct: 25, grams: 119 },
      fat: { pct: 30, grams: 63 },
    },
    foodsToEat: [
      { name: 'Dark Chocolate', benefit: 'Magnesium & mood boost', emoji: '🍫' },
      { name: 'Bananas', benefit: 'Potassium & vitamin B6', emoji: '🍌' },
      { name: 'Salmon', benefit: 'Omega-3 reduces inflammation', emoji: '🐟' },
      { name: 'Leafy Greens', benefit: 'Iron replenishes losses', emoji: '🥬' },
      { name: 'Pumpkin Seeds', benefit: 'Magnesium & zinc', emoji: '🎃' },
      { name: 'Ginger', benefit: 'Eases nausea & cramps', emoji: '🫚' },
      { name: 'Turmeric', benefit: 'Anti-inflammatory', emoji: '🟡' },
      { name: 'Oats', benefit: 'Mood-boosting complex carbs', emoji: '🥣' },
      { name: 'Berries', benefit: 'Antioxidants', emoji: '🍓' },
      { name: 'Lentils', benefit: 'Iron & fiber', emoji: '🫘' },
      { name: 'Yogurt', benefit: 'Calcium reduces PMS', emoji: '🥛' },
      { name: 'Chamomile Tea', benefit: 'Relaxes muscles', emoji: '🍵' },
    ],
    foodsToAvoid: [
      'Excess salt (causes bloating)',
      'Caffeine (worsens anxiety & breast tenderness)',
      'Refined sugars (mood swings)',
      'Alcohol (worsens PMS symptoms)',
      'Fried & processed foods',
      'Carbonated drinks',
    ],
    mealPlan: [
      {
        meal: 'Breakfast',
        time: '8:00 AM',
        foods: ['Oatmeal with banana', 'Dark chocolate chips', 'Chia seeds'],
        calories: 400,
        emoji: '🥣',
      },
      {
        meal: 'Lunch',
        time: '1:00 PM',
        foods: ['Lentil soup', 'Side salad', 'Pumpkin seeds'],
        calories: 500,
        emoji: '🍲',
      },
      {
        meal: 'Snack',
        time: '4:00 PM',
        foods: ['Greek yogurt', 'Berries', 'Ginger tea'],
        calories: 220,
        emoji: '🫐',
      },
      {
        meal: 'Dinner',
        time: '7:00 PM',
        foods: ['Baked salmon', 'Quinoa', 'Sautéed spinach'],
        calories: 540,
        emoji: '🐟',
      },
    ],
    tips: [
      {
        title: 'Boost Magnesium & Iron',
        description: 'Magnesium eases cramps and migraines (dark chocolate, pumpkin seeds, leafy greens). Iron-rich foods replace menstrual losses.',
        icon: 'leaf',
      },
      {
        title: 'Limit Salt & Caffeine',
        description: 'Reduce salt to ease bloating and breast tenderness. Swap coffee for chamomile or ginger tea to calm the nervous system.',
        icon: 'droplet',
      },
      {
        title: 'Anti-Inflammatory Foods',
        description: 'Omega-3s from salmon, turmeric, and ginger reduce prostaglandins — the compounds that drive period cramps.',
        icon: 'flame',
      },
      {
        title: 'Stay Hydrated',
        description: 'Drinking plenty of water may sound counterintuitive, but it actually reduces water retention and bloating.',
        icon: 'droplet',
      },
    ],
  },

  menopause: {
    condition: 'menopause',
    title: 'Menopause Nutrition Plan',
    description:
      'A phytoestrogen-rich, calcium-boosting plan to ease hot flashes, protect bones, and support heart health during menopause.',
    dailyCalories: 1700,
    macros: {
      carbs: { pct: 40, grams: 170 },
      protein: { pct: 30, grams: 128 },
      fat: { pct: 30, grams: 57 },
    },
    foodsToEat: [
      { name: 'Tofu & Edamame', benefit: 'Phytoestrogens ease hot flashes', emoji: '🥢' },
      { name: 'Flaxseeds', benefit: 'Lignans & omega-3', emoji: '🟤' },
      { name: 'Leafy Greens', benefit: 'Calcium for bones', emoji: '🥬' },
      { name: 'Salmon', benefit: 'Omega-3 & vitamin D', emoji: '🐟' },
      { name: 'Greek Yogurt', benefit: 'Calcium & protein', emoji: '🥛' },
      { name: 'Berries', benefit: 'Antioxidants for heart', emoji: '🍓' },
      { name: 'Almonds', benefit: 'Vitamin E & healthy fats', emoji: '🌰' },
      { name: 'Whole Grains', benefit: 'Fiber & B vitamins', emoji: '🌾' },
      { name: 'Avocado', benefit: 'Healthy monounsaturated fats', emoji: '🥑' },
      { name: 'Broccoli', benefit: 'Calcium, cruciferous', emoji: '🥦' },
      { name: 'Lentils', benefit: 'Fiber & plant protein', emoji: '🫘' },
      { name: 'Sweet Potatoes', benefit: 'Vitamin A & fiber', emoji: '🍠' },
    ],
    foodsToAvoid: [
      'Excess sugar (worsens hot flashes)',
      'Spicy foods (trigger hot flashes)',
      'Caffeine (triggers hot flashes)',
      'Alcohol (worsens symptoms)',
      'Highly processed foods',
      'Excess sodium',
    ],
    mealPlan: [
      {
        meal: 'Breakfast',
        time: '8:00 AM',
        foods: ['Greek yogurt', 'Berries', 'Flaxseeds & almonds'],
        calories: 380,
        emoji: '🥛',
      },
      {
        meal: 'Lunch',
        time: '1:00 PM',
        foods: ['Tofu stir-fry', 'Broccoli', 'Brown rice'],
        calories: 480,
        emoji: '🥡',
      },
      {
        meal: 'Snack',
        time: '4:00 PM',
        foods: ['Apple slices', 'Almond butter'],
        calories: 200,
        emoji: '🍎',
      },
      {
        meal: 'Dinner',
        time: '7:00 PM',
        foods: ['Baked salmon', 'Quinoa', 'Roasted vegetables'],
        calories: 520,
        emoji: '🐟',
      },
    ],
    tips: [
      {
        title: 'Phytoestrogen-Rich Foods',
        description: 'Soy foods (tofu, tempeh, edamame) and flaxseeds contain plant estrogens that can help ease hot flashes and night sweats.',
        icon: 'leaf',
      },
      {
        title: 'Calcium & Vitamin D',
        description: 'Bone loss accelerates after menopause. Aim for 1200mg calcium and 600–800 IU vitamin D daily from dairy, fish, and fortified foods.',
        icon: 'apple',
      },
      {
        title: 'Limit Hot Flash Triggers',
        description: 'Caffeine, alcohol, spicy foods, and sugar are common triggers. Track your symptoms to identify personal culprits.',
        icon: 'flame',
      },
      {
        title: 'Heart-Healthy Fats',
        description: 'Estrogen protects the heart, so post-menopause risk rises. Prioritize omega-3s, olive oil, nuts, and avocados.',
        icon: 'heart',
      },
    ],
  },

  hormone: {
    condition: 'hormone',
    title: 'Hormone Balance Plan',
    description:
      'A balanced whole-food plan with healthy fats, fiber, and cruciferous vegetables to support natural hormone production and clearance.',
    dailyCalories: 1900,
    macros: {
      carbs: { pct: 40, grams: 190 },
      protein: { pct: 30, grams: 143 },
      fat: { pct: 30, grams: 63 },
    },
    foodsToEat: [
      { name: 'Broccoli', benefit: 'Cruciferous, supports estrogen metabolism', emoji: '🥦' },
      { name: 'Avocado', benefit: 'Healthy fats for hormone production', emoji: '🥑' },
      { name: 'Salmon', benefit: 'Omega-3 anti-inflammatory', emoji: '🐟' },
      { name: 'Flaxseeds', benefit: 'Lignans balance estrogen', emoji: '🟤' },
      { name: 'Sweet Potatoes', benefit: 'Vitamin A & complex carbs', emoji: '🍠' },
      { name: 'Walnuts', benefit: 'Plant omega-3s', emoji: '🌰' },
      { name: 'Berries', benefit: 'Antioxidants', emoji: '🍓' },
      { name: 'Lentils', benefit: 'Fiber supports clearance', emoji: '🫘' },
      { name: 'Eggs', benefit: 'Choline & protein', emoji: '🥚' },
      { name: 'Olive Oil', benefit: 'Anti-inflammatory fats', emoji: '🫒' },
      { name: 'Pumpkin Seeds', benefit: 'Zinc supports hormones', emoji: '🎃' },
      { name: 'Leafy Greens', benefit: 'Magnesium & B vitamins', emoji: '🥬' },
    ],
    foodsToAvoid: [
      'Refined sugars & high-fructose corn syrup',
      'Trans fats & hydrogenated oils',
      'Processed vegetable oils (in excess)',
      'Excess caffeine',
      'Alcohol',
      'Highly processed packaged foods',
    ],
    mealPlan: [
      {
        meal: 'Breakfast',
        time: '8:00 AM',
        foods: ['Veggie scrambled eggs', 'Avocado', 'Sprouted toast'],
        calories: 400,
        emoji: '🍳',
      },
      {
        meal: 'Lunch',
        time: '1:00 PM',
        foods: ['Mixed bean salad', 'Broccoli', 'Olive oil dressing'],
        calories: 480,
        emoji: '🥗',
      },
      {
        meal: 'Snack',
        time: '4:00 PM',
        foods: ['Apple', 'Walnuts', 'Pumpkin seeds'],
        calories: 220,
        emoji: '🍎',
      },
      {
        meal: 'Dinner',
        time: '7:00 PM',
        foods: ['Baked salmon', 'Quinoa', 'Roasted Brussels sprouts'],
        calories: 540,
        emoji: '🐟',
      },
    ],
    tips: [
      {
        title: 'Healthy Fats for Hormones',
        description: 'Cholesterol is the building block of estrogen, progesterone, and testosterone. Don\'t fear healthy fats from avocado, olive oil, nuts, and fish.',
        icon: 'heart',
      },
      {
        title: 'Fiber for Estrogen Clearance',
        description: 'Cruciferous vegetables (broccoli, cabbage, Brussels sprouts) and fiber-rich foods help the body metabolize and clear excess estrogen.',
        icon: 'leaf',
      },
      {
        title: 'Limit Endocrine Disruptors',
        description: 'Reduce ultra-processed foods, plastics, and excess sugar — these can disrupt hormone signaling and worsen imbalance symptoms.',
        icon: 'zap',
      },
      {
        title: 'Support with Adaptogens',
        description: 'Foods like ashwagandha, maca, and holy basil may help the body adapt to stress, which is closely tied to cortisol and hormone balance.',
        icon: 'brain',
      },
    ],
  },

  weight: {
    condition: 'weight',
    title: 'Weight Management Plan',
    description:
      'A high-protein, fiber-rich, calorie-conscious plan designed to support healthy, sustainable weight loss without deprivation.',
    dailyCalories: 1600,
    macros: {
      carbs: { pct: 40, grams: 160 },
      protein: { pct: 35, grams: 140 },
      fat: { pct: 25, grams: 44 },
    },
    foodsToEat: [
      { name: 'Chicken Breast', benefit: 'Lean protein, satiating', emoji: '🍗' },
      { name: 'Eggs', benefit: 'Protein & healthy fats', emoji: '🥚' },
      { name: 'Greek Yogurt', benefit: 'High protein, low calorie', emoji: '🥛' },
      { name: 'Leafy Greens', benefit: 'Volume, fiber, nutrients', emoji: '🥬' },
      { name: 'Berries', benefit: 'Low-calorie antioxidants', emoji: '🍓' },
      { name: 'Quinoa', benefit: 'Protein-rich whole grain', emoji: '🌾' },
      { name: 'Lentils', benefit: 'Plant protein & fiber', emoji: '🫘' },
      { name: 'Broccoli', benefit: 'High volume, low calorie', emoji: '🥦' },
      { name: 'Apples', benefit: 'Fiber & satiety', emoji: '🍎' },
      { name: 'Almonds', benefit: 'Healthy fats, portion-controlled', emoji: '🌰' },
      { name: 'Cucumber', benefit: 'Hydrating, very low calorie', emoji: '🥒' },
      { name: 'Cottage Cheese', benefit: 'Slow-digesting protein', emoji: '🧀' },
    ],
    foodsToAvoid: [
      'Sugary drinks & sodas',
      'Fast food & fried foods',
      'Refined carbs (white bread, pastries)',
      'Processed snack foods',
      'Alcohol (empty calories)',
      'High-calorie coffee drinks',
    ],
    mealPlan: [
      {
        meal: 'Breakfast',
        time: '8:00 AM',
        foods: ['Greek yogurt', 'Berries', 'Chia seeds'],
        calories: 320,
        emoji: '🥛',
      },
      {
        meal: 'Lunch',
        time: '1:00 PM',
        foods: ['Grilled chicken salad', 'Quinoa', 'Olive oil dressing'],
        calories: 450,
        emoji: '🥗',
      },
      {
        meal: 'Snack',
        time: '4:00 PM',
        foods: ['Apple', 'Small handful of almonds'],
        calories: 180,
        emoji: '🍎',
      },
      {
        meal: 'Dinner',
        time: '7:00 PM',
        foods: ['Baked cod', 'Steamed broccoli', 'Sweet potato'],
        calories: 460,
        emoji: '🐟',
      },
    ],
    tips: [
      {
        title: 'Prioritize Protein',
        description: 'Aim for 25–35% of calories from protein. It\'s the most satiating macronutrient and helps preserve muscle during weight loss.',
        icon: 'apple',
      },
      {
        title: 'Eat High-Volume, Low-Calorie',
        description: 'Fill half your plate with non-starchy vegetables. They add bulk, fiber, and nutrients for very few calories.',
        icon: 'leaf',
      },
      {
        title: 'Hydrate Before You Eat',
        description: 'Drink a glass of water 20 minutes before meals. Thirst is often mistaken for hunger, and water adds zero calories.',
        icon: 'droplet',
      },
      {
        title: 'Mind Your Beverages',
        description: 'Liquid calories (soda, juice, sweetened coffee, alcohol) add up fast. Switch to water, sparkling water, or unsweetened tea.',
        icon: 'zap',
      },
    ],
  },

  wellness: {
    condition: 'wellness',
    title: 'General Wellness Plan',
    description:
      'A balanced, whole-food foundation built on colorful vegetables, lean proteins, healthy fats, and complex carbs for everyday vitality.',
    dailyCalories: 2000,
    macros: {
      carbs: { pct: 45, grams: 225 },
      protein: { pct: 25, grams: 125 },
      fat: { pct: 30, grams: 67 },
    },
    foodsToEat: [
      { name: 'Leafy Greens', benefit: 'Vitamins, minerals, fiber', emoji: '🥬' },
      { name: 'Berries', benefit: 'Antioxidants & fiber', emoji: '🍓' },
      { name: 'Salmon', benefit: 'Omega-3 & protein', emoji: '🐟' },
      { name: 'Quinoa', benefit: 'Complete plant protein', emoji: '🌾' },
      { name: 'Olive Oil', benefit: 'Heart-healthy fats', emoji: '🫒' },
      { name: 'Eggs', benefit: 'Protein & choline', emoji: '🥚' },
      { name: 'Avocado', benefit: 'Healthy fats & potassium', emoji: '🥑' },
      { name: 'Almonds', benefit: 'Vitamin E & healthy fats', emoji: '🌰' },
      { name: 'Sweet Potatoes', benefit: 'Vitamin A & fiber', emoji: '🍠' },
      { name: 'Greek Yogurt', benefit: 'Probiotics & protein', emoji: '🥛' },
      { name: 'Broccoli', benefit: 'Vitamin C & fiber', emoji: '🥦' },
      { name: 'Lentils', benefit: 'Plant protein & fiber', emoji: '🫘' },
    ],
    foodsToAvoid: [
      'Highly processed packaged foods',
      'Sugary drinks & sodas',
      'Refined grains (in excess)',
      'Trans fats & hydrogenated oils',
      'Excess added sugars',
      'Excess sodium',
    ],
    mealPlan: [
      {
        meal: 'Breakfast',
        time: '8:00 AM',
        foods: ['Oatmeal with berries', 'Walnuts', 'Drizzle of honey'],
        calories: 420,
        emoji: '🥣',
      },
      {
        meal: 'Lunch',
        time: '1:00 PM',
        foods: ['Quinoa bowl', 'Roasted vegetables', 'Grilled chicken'],
        calories: 540,
        emoji: '🥗',
      },
      {
        meal: 'Snack',
        time: '4:00 PM',
        foods: ['Apple', 'Almond butter'],
        calories: 220,
        emoji: '🍎',
      },
      {
        meal: 'Dinner',
        time: '7:00 PM',
        foods: ['Baked salmon', 'Brown rice', 'Steamed greens'],
        calories: 580,
        emoji: '🐟',
      },
    ],
    tips: [
      {
        title: 'Eat the Rainbow',
        description: 'Aim for 5+ servings of colorful fruits and vegetables daily. Different colors provide different phytonutrients and antioxidants.',
        icon: 'leaf',
      },
      {
        title: 'Balance Your Plate',
        description: 'Build meals with ½ vegetables, ¼ lean protein, ¼ complex carbs, plus a thumb of healthy fat for sustained energy.',
        icon: 'apple',
      },
      {
        title: 'Stay Hydrated',
        description: 'Aim for 8 glasses of water a day. Mild dehydration shows up as fatigue, headaches, and cravings before thirst kicks in.',
        icon: 'droplet',
      },
      {
        title: 'Limit Ultra-Processed Foods',
        description: 'Choose whole foods in their natural state as often as possible. The fewer ingredients on a label, the better.',
        icon: 'zap',
      },
    ],
  },
}

// ─── Quick Prompts ──────────────────────────────────────────────────────────

const quickPrompts = [
  { icon: Droplets, label: 'Period foods', prompt: 'What should I eat during my period?' },
  { icon: Flower2, label: 'PCOS weight loss', prompt: 'Best foods for PCOS weight loss' },
  { icon: Baby, label: 'Fertility foods', prompt: 'Fertility-boosting foods' },
  { icon: Apple, label: 'PCOS avoid', prompt: 'Foods to avoid with PCOS' },
  { icon: Cookie, label: 'Snack ideas', prompt: 'Healthy snack ideas' },
  { icon: GlassWater, label: 'Water intake', prompt: 'How much water should I drink?' },
]

// ─── Initial Chat Messages ──────────────────────────────────────────────────

// Chat starts empty — a friendly greeting + suggested prompts are shown in the
// empty-state UI. No fake previous messages from "user" or "assistant".
const initialMessages: ChatMessage[] = []

// ─── Fallback Chat Engine ───────────────────────────────────────────────────

const SAFETY_NOTE =
  '\n\n⚕️ For personalized medical nutrition advice, consult a registered dietitian.'

function buildFallbackResponse(message: string, condition: ConditionId): string {
  const msg = message.toLowerCase()
  const plan = dietPlans[condition]
  const conditionLabel =
    conditions.find((c) => c.id === condition)?.label ?? 'General Wellness'

  // Order matters — most specific first.
  const matchers: { keys: string[]; reply: string }[] = [
    {
      keys: ['period', 'menstrual', 'cramp', 'menstruation'],
      reply:
        'For your period, focus on foods that fight inflammation and replenish iron 🩸:\n\n• Iron-rich foods: lentils, spinach, lean beef, pumpkin seeds — to replace menstrual losses\n• Magnesium foods: dark chocolate (70%+), bananas, leafy greens — to ease cramps\n• Omega-3s: salmon, walnuts, chia seeds — reduce inflammation and cramp-causing prostaglandins\n• Ginger & turmeric tea — natural anti-inflammatories that soothe cramps and nausea\n\nLimit salt (bloating), caffeine (worsens anxiety & breast tenderness), and refined sugar (mood swings). Sip chamomile or ginger tea and stay well-hydrated.',
    },
    {
      keys: ['pcos'],
      reply:
        'For PCOS, the goal is improving insulin sensitivity and reducing inflammation 🌼:\n\n• Eat low-glycemic carbs: quinoa, lentils, sweet potatoes, beans — instead of white rice or bread\n• Pair every carb with protein (eggs, fish, Greek yogurt, tofu) to blunt blood sugar spikes\n• Add omega-3 fats: salmon, chia seeds, walnuts, flaxseeds — to fight inflammation\n• Include cinnamon — studies suggest it improves insulin sensitivity\n• Load up on cruciferous vegetables (broccoli, cauliflower) for hormone balance\n\nAvoid: sugary drinks, refined carbs, fried foods, and excess processed snacks. Even a 5–10% weight loss can significantly improve PCOS symptoms.',
    },
    {
      keys: ['fertility', 'conceiv', 'ovulat', 'trying to get pregnant', 'egg quality'],
      reply:
        'Fertility-boosting foods focus on folate, omega-3, and antioxidants 🌸:\n\n• Folate-rich foods: leafy greens, lentils, beans, fortified grains, citrus — essential for early pregnancy\n• Omega-3s: salmon (low-mercury), sardines, walnuts, chia & flax seeds — support egg quality\n• Antioxidant foods: berries, colorful vegetables, dark leafy greens, green tea\n• Zinc: pumpkin seeds, oysters, lean beef — supports ovulation\n• Full-fat dairy (in moderation) has been linked to healthier ovulation in some studies\n\nLimit caffeine to <200mg/day (about 1 coffee), avoid alcohol, skip high-mercury fish (swordfish, shark), and start a prenatal vitamin with folate if you\'re trying to conceive.',
    },
    {
      keys: ['pregnan', 'expecting', 'baby', 'trimester', 'nausea', 'morning sickness'],
      reply:
        'Pregnancy nutrition is about supporting baby\'s growth and your health 🤰:\n\n• Folate: spinach, lentils, fortified cereals, citrus — prevents neural tube defects\n• Iron: lean beef, lentils, spinach, fortified grains — supports increased blood volume (pair with vitamin C for absorption)\n• DHA: salmon (low-mercury, 2x/week), walnuts, chia — for baby\'s brain development\n• Calcium: Greek yogurt, milk, fortified plant milks, broccoli, leafy greens\n• Protein: eggs, chicken, fish, beans, Greek yogurt\n\nFood safety: avoid raw/undercooked meat & fish, high-mercury fish, unpasteurized dairy, soft cheeses, raw eggs, and deli meats (unless reheated to steaming). No alcohol. For nausea, try small frequent meals, ginger, and bland carbs like crackers.',
    },
    {
      keys: ['menopause', 'hot flash', 'night sweat', 'perimenopause'],
      reply:
        'Menopause nutrition focuses on phytoestrogens, bone health, and heart health 🌅:\n\n• Phytoestrogens: soy foods (tofu, tempeh, edamame), flaxseeds — may ease hot flashes\n• Calcium & vitamin D: Greek yogurt, fortified milks, leafy greens, salmon — protect bones (aim for 1200mg calcium/day)\n• Omega-3s: salmon, walnuts, chia — support heart health as estrogen drops\n• Fiber: whole grains, legumes, vegetables — supports heart and digestion\n\nLimit triggers: caffeine, alcohol, spicy foods, and excess sugar can worsen hot flashes. Eat smaller, more frequent meals if digestion slows.',
    },
    {
      keys: ['hormone', 'hormonal', 'balance hormone', 'estrogen'],
      reply:
        'To balance hormones naturally, focus on the building blocks and clearance pathways ⚖️:\n\n• Healthy fats: avocado, olive oil, nuts, salmon — cholesterol is the precursor to estrogen, progesterone, and testosterone\n• Cruciferous vegetables: broccoli, Brussels sprouts, cabbage — support healthy estrogen metabolism\n• Fiber: 25–30g/day from legumes, whole grains, vegetables — helps the body clear excess estrogen\n• Omega-3s: reduce inflammation that disrupts hormone signaling\n• Magnesium & zinc: leafy greens, pumpkin seeds, almonds — cofactors for hormone production\n\nAvoid: trans fats, excess sugar, ultra-processed foods, and excess caffeine — these can disrupt endocrine function.',
    },
    {
      keys: ['weight loss', 'lose weight', 'weight management', 'fat loss', 'losing weight'],
      reply:
        'For sustainable weight loss, prioritize protein, fiber, and whole foods ⚖️:\n\n• Protein at every meal: eggs, chicken, fish, Greek yogurt, lentils — most satiating macro, preserves muscle\n• High-volume, low-calorie foods: leafy greens, broccoli, cucumbers, berries — fill up for fewer calories\n• Complex carbs: quinoa, oats, sweet potatoes — keep energy stable\n• Healthy fats in moderation: avocado, olive oil, nuts — portion-controlled (fats are calorie-dense)\n\nAvoid: sugary drinks, fast food, refined carbs, alcohol. Try eating slowly, drinking water before meals, and filling half your plate with vegetables. Aim for a modest 300–500 calorie deficit for sustainable loss of ½–1 lb/week.',
    },
    {
      keys: ['water', 'hydrat', 'drink', 'how much water'],
      reply:
        'Hydration is essential for digestion, energy, skin, and hormone balance 💧:\n\n• General guideline: about 8 glasses (2 liters) of water per day for most women\n• If pregnant or breastfeeding: aim for 10–12 glasses daily\n• During your period: extra water helps reduce bloating and replaces fluids lost\n• In hot weather or when exercising: drink more to replace sweat losses\n\nTips:\n• Carry a reusable bottle\n• Drink a glass of water 20 minutes before meals (helps with portion control)\n• Flavor with lemon, cucumber, or mint if plain water is boring\n• Herbal teas (chamomile, ginger, peppermint) count toward hydration\n\nSkip sugary drinks and limit caffeine — both can dehydrate you.',
    },
    {
      keys: ['snack', 'snacks'],
      reply:
        'Healthy snack ideas that balance blood sugar and satisfy cravings 🍪:\n\n• Apple slices + almond butter (fiber + healthy fat)\n• Greek yogurt + berries + chia seeds (protein + antioxidants)\n• Handful of almonds + a piece of dark chocolate (magnesium + antioxidants)\n• Carrot & cucumber sticks + hummus (fiber + protein)\n• Hard-boiled egg + cherry tomatoes (protein + vitamins)\n• Edamame (plant protein + fiber)\n• Cottage cheese + pineapple (slow-digesting protein)\n• Trail mix with nuts & seeds (healthy fats + minerals)\n\nAim for snacks that combine protein + fiber or protein + healthy fat — these keep you full longer than carb-only snacks.',
    },
    {
      keys: ['protein', 'high protein'],
      reply:
        'Protein is essential for hormones, muscle, skin, and satiety 💪:\n\n• Animal sources: eggs, chicken, turkey, salmon, Greek yogurt, cottage cheese, lean beef\n• Plant sources: lentils, chickpeas, tofu, tempeh, edamame, quinoa, chia seeds, hemp seeds\n\nAim for 20–30g protein per meal (about a palm-sized portion). Most women need 0.8–1.2g of protein per kg of body weight daily — more if you\'re active, pregnant, or trying to lose weight. Spreading protein across the day (rather than one big dinner) supports muscle protein synthesis and stable energy.',
    },
    {
      keys: ['iron', 'anemia', 'low iron'],
      reply:
        'Iron is crucial for women — especially during periods and pregnancy 🩸:\n\n• Heme iron (most absorbable): lean beef, chicken, fish, eggs\n• Non-heme iron: lentils, spinach, tofu, pumpkin seeds, fortified cereals, quinoa\n\nBoost absorption: pair iron-rich foods with vitamin C (citrus, bell peppers, strawberries, tomatoes). For example, squeeze lemon on spinach or pair lentils with tomatoes.\n\nAvoid: drinking tea or coffee with iron-rich meals — tannins block absorption. Wait 1 hour before/after meals for caffeine. If you suspect anemia (fatigue, pale skin, dizziness), ask your doctor for a ferritin test.',
    },
    {
      keys: ['calcium', 'bone'],
      reply:
        'Calcium supports bones, teeth, muscle function, and even PMS reduction 🦴:\n\n• Dairy: Greek yogurt, milk, cheese, cottage cheese\n• Plant sources: fortified plant milks, tofu (calcium-set), leafy greens (collards, kale), broccoli, almonds, sesame seeds\n\nWomen need 1000mg/day (1200mg after menopause). Vitamin D is essential for calcium absorption — get it from salmon, fortified milks, egg yolks, or 10–15 minutes of sunlight. Weight-bearing exercise (walking, strength training) also strengthens bones.',
    },
    {
      keys: ['magnesium'],
      reply:
        'Magnesium eases cramps, supports sleep, and helps with mood 🟤:\n\n• Best food sources: pumpkin seeds, almonds, dark chocolate (70%+), spinach, black beans, avocado, cashews, quinoa\n\nWomen need 310–320mg/day. Magnesium is depleted by stress, caffeine, and alcohol — so many women run low.Boosting magnesium-rich foods (or considering a supplement after talking to your doctor) can help with PMS cramps, sleep quality, and anxiety.',
    },
    {
      keys: ['fiber'],
      reply:
        'Fiber supports digestion, blood sugar control, and hormone clearance 🌾:\n\n• Soluble fiber: oats, beans, lentils, apples, chia seeds, flaxseeds\n• Insoluble fiber: whole grains, wheat bran, vegetables, leafy greens\n\nWomen need 25g/day, but most get only 12–15g. Build up slowly and drink plenty of water to avoid bloating. Fiber binds to excess estrogen and helps the body clear it — important for PCOS, PMS, and hormone balance.',
    },
    {
      keys: ['sugar', 'sweet', 'dessert', 'craving'],
      reply:
        'Managing sugar cravings starts with stable blood sugar 🍭:\n\n• Swap refined sweets for whole fruit (berries, apples, pears) — fiber slows the sugar hit\n• Pair a sweet with protein or fat (apple + almond butter, dark chocolate + nuts)\n• Choose 70%+ dark chocolate — lower sugar, rich in magnesium\n• Stay hydrated — thirst often masquerades as cravings\n• Get enough sleep — sleep deprivation spikes sugar cravings\n\nIf cravings are intense before your period, that\'s normal — hormones drive it. Satisfy with small portions of quality treats rather than fighting them entirely.',
    },
    {
      keys: ['breakfast'],
      reply:
        'Great breakfast options that balance blood sugar and energy 🌅:\n\n• Oatmeal with walnuts, berries & flaxseeds\n• Veggie omelet with spinach and avocado\n• Greek yogurt with chia seeds and berries\n• Sprouted toast with mashed avocado and a poached egg\n• Smoothie with spinach, berries, Greek yogurt, and a tablespoon of nut butter\n\nAim for protein + fiber + healthy fat — this trio keeps you full and prevents the mid-morning crash that comes from cereal or pastries alone.',
    },
    {
      keys: ['lunch', 'dinner', 'meal'],
      reply:
        'Build a balanced plate for any meal 🍽️:\n\n• ½ plate vegetables: leafy greens, roasted veggies, colorful salads\n• ¼ plate lean protein: salmon, chicken, tofu, lentils, eggs\n• ¼ plate complex carbs: quinoa, sweet potato, brown rice, beans\n• + a thumb of healthy fat: olive oil, avocado, nuts, seeds\n\nThis formula works for PCOS, fertility, pregnancy, weight management, and general wellness. Add herbs and spices (turmeric, ginger, cinnamon, garlic) for flavor and anti-inflammatory benefits.',
    },
    {
      keys: ['caffeine', 'coffee'],
      reply:
        'Caffeine affects women differently across life stages ☕:\n\n• Fertility: limit to <200mg/day (about 1 coffee) — high caffeine may reduce fertility\n• Pregnancy: keep under 200mg/day — excess linked to miscarriage risk\n• PMS & periods: caffeine can worsen anxiety, breast tenderness, and cramps\n• Menopause: caffeine can trigger hot flashes in some women\n\nIf you\'re sensitive, swap coffee for green tea (lower caffeine, high antioxidants), herbal teas (chamomile, ginger, peppermint), or warm lemon water. Avoid caffeine after 2pm to protect sleep.',
    },
    {
      keys: ['supplement', 'vitamin', 'prenatal', 'omega-3', 'fish oil'],
      reply:
        'Key supplements many women benefit from (always check with a doctor first) 💊:\n\n• Prenatal vitamin with folate — if trying to conceive or pregnant (400–800mcg folate)\n• Vitamin D — most women are low; aim for 600–1000 IU/day (or more if deficient)\n• Omega-3 (DHA/EPA) — if you don\'t eat fish 2x/week; especially important in pregnancy for baby\'s brain\n• Iron — only if bloodwork shows deficiency; supplement with vitamin C\n• Magnesium — for PMS, sleep, and stress (200–400mg glycinate)\n• B12 — if you\'re vegetarian or vegan\n\nFood first, supplements second. Always confirm dosages with a healthcare provider based on your bloodwork.',
    },
    {
      keys: ['omega', 'fish oil', 'dha', 'epa'],
      reply:
        'Omega-3 fatty acids are powerful for women\'s health 🐟:\n\n• Best food sources: salmon, sardines, mackerel (low-mercury), walnuts, chia seeds, flaxseeds, hemp seeds\n• Benefits: reduce inflammation, support brain & heart health, balance hormones, ease period cramps, and support baby\'s brain development in pregnancy\n\nAim for 2 servings of low-mercury fish per week. If you don\'t eat fish, consider an algae-based DHA/EPA supplement (especially in pregnancy).',
    },
  ]

  // Find first matching topic
  for (const m of matchers) {
    if (m.keys.some((k) => msg.includes(k))) {
      return m.reply + SAFETY_NOTE
    }
  }

  // Default — use the selected condition's plan as context
  return (
    `Great question! Based on the "${conditionLabel}" plan you're viewing, here are some key takeaways:\n\n` +
    `• Daily target: ~${plan.dailyCalories} calories with ${plan.macros.carbs.pct}% carbs, ${plan.macros.protein.pct}% protein, ${plan.macros.fat.pct}% fat\n` +
    `• Focus foods: ${plan.foodsToEat
      .slice(0, 5)
      .map((f) => f.name)
      .join(', ')}\n` +
    `• Avoid: ${plan.foodsToAvoid.slice(0, 3).join(', ')}\n\n` +
    `Top tip for this plan: ${plan.tips[0].description}\n\n` +
    `Try asking about specific topics like "period foods", "PCOS weight loss", "fertility foods", "water intake", "snack ideas", "iron-rich foods", or "protein" for more targeted guidance. 🌱`
  ) + SAFETY_NOTE
}

// ─── Tip Icon Map ───────────────────────────────────────────────────────────

const tipIconMap: Record<NutritionTip['icon'], React.ElementType> = {
  leaf: Leaf,
  flame: Flame,
  droplet: Droplets,
  apple: Apple,
  heart: Heart,
  brain: Brain,
  zap: Zap,
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DietAdvisorModule() {
  const [selectedCondition, setSelectedCondition] = useState<ConditionId>('pcos')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Daily tracker state (starts empty — user logs their own meals & water)
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [loggedMeals, setLoggedMeals] = useState<
    { id: string; name: string; calories: number; type: string }[]
  >([])
  const [newMeal, setNewMeal] = useState('')
  const [newMealCalories, setNewMealCalories] = useState('')
  const [newMealType, setNewMealType] = useState('Snack')

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const plan = dietPlans[selectedCondition]
  const conditionMeta = useMemo(
    () => conditions.find((c) => c.id === selectedCondition)!,
    [selectedCondition]
  )

  const loggedCalories = loggedMeals.reduce((s, m) => s + m.calories, 0)
  const calorieProgress = Math.min(
    100,
    Math.round((loggedCalories / plan.dailyCalories) * 100)
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSelectCondition = (id: ConditionId) => {
    setSelectedCondition(id)
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/diet-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          condition: selectedCondition,
          history,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.response) {
        // Ensure safety note is included
        const content = data.response.includes(
          'consult a registered dietitian'
        )
          ? data.response
          : data.response + SAFETY_NOTE
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
          },
        ])
      } else {
        // Smart local fallback
        const fallback = buildFallbackResponse(text.trim(), selectedCondition)
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fallback,
            timestamp: new Date(),
          },
        ])
      }
    } catch {
      // Network or other error — use smart local fallback
      const fallback = buildFallbackResponse(text.trim(), selectedCondition)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallback,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const resetConversation = () => {
    setMessages(initialMessages)
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const addMeal = () => {
    if (!newMeal.trim() || !newMealCalories) return
    setLoggedMeals((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newMeal.trim(),
        calories: parseInt(newMealCalories) || 0,
        type: newMealType,
      },
    ])
    setNewMeal('')
    setNewMealCalories('')
  }

  const removeMeal = (id: string) => {
    setLoggedMeals((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-6 pb-6">
      {/* ─── 1. Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                AI Diet Advisor
              </h2>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 hover:bg-emerald-100">
                <Sparkles className="h-3 w-3 mr-1" /> AI-Powered
              </Badge>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Expert nutrition guidance for every phase of your health journey
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── 2. Health Condition Selector ─────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Salad className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Choose Your Health Goal
          </h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
          {conditions.map((c) => {
            const isSelected = selectedCondition === c.id
            const Icon = c.icon
            return (
              <motion.button
                key={c.id}
                onClick={() => handleSelectCondition(c.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'shrink-0 snap-start w-36 md:w-40 text-left rounded-2xl p-4 border-2 transition-all duration-200',
                  isSelected
                    ? cn(c.bg, c.border, 'shadow-md ring-2', c.ring)
                    : 'glass border-transparent hover:border-border'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                      c.gradient
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-lg">{c.emoji}</span>
                </div>
                <p
                  className={cn(
                    'text-sm font-semibold leading-tight',
                    isSelected ? c.text : 'text-foreground'
                  )}
                >
                  {c.label}
                </p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ─── 3. Diet Plan Display ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCondition}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Plan header card */}
          <Card
            className={cn(
              'border-0 shadow-lg overflow-hidden',
              conditionMeta.bg
            )}
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex items-start gap-3 mb-2">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow',
                    conditionMeta.gradient
                  )}
                >
                  <conditionMeta.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={cn('text-xl font-bold', conditionMeta.text)}>
                    {plan.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {plan.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calorie target + Macros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Daily Calorie Target */}
            <Card className="glass border-0 shadow-sm">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-2">
                  <Flame className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Daily Calories
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {plan.dailyCalories}
                </p>
                <p className="text-[11px] text-muted-foreground">kcal / day</p>
              </CardContent>
            </Card>

            {/* Carb card */}
            <MacroCard
              label="Carbs"
              pct={plan.macros.carbs.pct}
              grams={plan.macros.carbs.grams}
              gradient="from-amber-400 to-orange-500"
              bgIcon="bg-amber-100 dark:bg-amber-900/40"
              textIcon="text-amber-600 dark:text-amber-400"
              icon={Wheat}
            />
            {/* Protein card */}
            <MacroCard
              label="Protein"
              pct={plan.macros.protein.pct}
              grams={plan.macros.protein.grams}
              gradient="from-rose-400 to-pink-500"
              bgIcon="bg-rose-100 dark:bg-rose-900/40"
              textIcon="text-rose-600 dark:text-rose-400"
              icon={Beef}
            />
            {/* Fat card */}
            <MacroCard
              label="Fat"
              pct={plan.macros.fat.pct}
              grams={plan.macros.fat.grams}
              gradient="from-teal-400 to-cyan-500"
              bgIcon="bg-teal-100 dark:bg-teal-900/40"
              textIcon="text-teal-600 dark:text-teal-400"
              icon={Droplets}
            />
          </div>

          {/* Foods to Eat + Foods to Avoid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="glass border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-base">Foods to Eat</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {plan.foodsToEat.length} foods
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {plan.foodsToEat.map((food, i) => (
                    <motion.div
                      key={food.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="group rounded-xl border border-border/60 bg-card/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all p-3 cursor-default"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl shrink-0 leading-none mt-0.5">
                          {food.emoji}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {food.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            {food.benefit}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Foods to Avoid */}
            <Card className="glass border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-base">Avoid or Limit</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {plan.foodsToAvoid.map((food, i) => (
                    <motion.li
                      key={food}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 mt-0.5">
                        <XCircle className="h-3 w-3 text-red-500" />
                      </span>
                      <span className="text-foreground/90 leading-snug">
                        {food}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sample Meal Plan */}
          <Card className="glass border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Utensils className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-base">Sample Daily Meal Plan</CardTitle>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                >
                  {plan.mealPlan.reduce((s, m) => s + m.calories, 0)} kcal
                </Badge>
              </div>
              <CardDescription className="text-xs">
                A balanced day of eating tailored to {plan.title.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {plan.mealPlan.map((meal, i) => (
                  <motion.div
                    key={meal.meal}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.06 }}
                    className="rounded-2xl border border-border/60 bg-card/50 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{meal.emoji}</span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5"
                      >
                        {meal.calories} kcal
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm">{meal.meal}</p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                      <Timer className="h-3 w-3" />
                      {meal.time}
                    </div>
                    <Separator className="mb-2" />
                    <ul className="space-y-1">
                      {meal.foods.map((food) => (
                        <li
                          key={food}
                          className="text-[11px] text-foreground/80 leading-snug flex items-start gap-1"
                        >
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{food}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Tips */}
          <Card className="glass border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-base">Nutrition Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.tips.map((tip, i) => {
                  const TipIcon = tipIconMap[tip.icon]
                  return (
                    <motion.div
                      key={tip.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.06 }}
                      className="flex gap-3 rounded-xl border border-border/60 bg-card/50 p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                        <TipIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{tip.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          {tip.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* ─── 4. AI Diet Coach Chat ────────────────────────────────── */}
      <Card className="border-0 glass shadow-lg overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow">
                <Apple className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  AI Diet Coach
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Context: {conditionMeta.label}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              className="text-muted-foreground h-8"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="h-[440px] overflow-y-auto px-4 diet-scroll"
          >
            <div className="space-y-4 py-2">
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 mb-3">
                    <Apple className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Your AI Diet Advisor is ready 🥑
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Ask about foods, meal ideas, or nutrition for any life phase. Tap a suggested prompt below to begin.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      message.role === 'assistant'
                        ? 'bg-emerald-100 dark:bg-emerald-900/50'
                        : 'bg-primary/10'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <Apple className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.role === 'assistant'
                        ? 'bg-muted/60 rounded-tl-sm'
                        : 'bg-primary text-primary-foreground rounded-tr-sm'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        'text-[10px] mt-1.5',
                        message.role === 'assistant'
                          ? 'text-muted-foreground'
                          : 'text-primary-foreground/60'
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                      <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                    </div>
                    <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Separator />

          {/* Quick Prompts */}
          <div className="px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickPrompts.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs h-8 gap-1.5 rounded-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  onClick={() => sendMessage(p.prompt)}
                  disabled={isLoading}
                >
                  <p.icon className="h-3 w-3" />
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about nutrition, foods, meal ideas..."
              className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-emerald-400"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Safety note */}
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          AI Diet Advisor provides general nutrition guidance, not medical
          nutrition therapy. For personalized medical nutrition advice, consult
          a registered dietitian.
        </p>
      </div>

      {/* ─── 5. Daily Nutrition Tracker ───────────────────────────── */}
      <Card className="glass border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-base">Today&apos;s Nutrition Tracker</CardTitle>
            <Badge variant="secondary" className="text-[10px]">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Track your daily water, meals, and calorie progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Water intake */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-500" />
                <p className="text-sm font-medium">Water Intake</p>
              </div>
              <Badge
                variant="secondary"
                className="text-[11px] bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
              >
                {waterGlasses} / 8 glasses
              </Badge>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 8 }).map((_, i) => {
                const filled = i < waterGlasses
                return (
                  <motion.button
                    key={i}
                    onClick={() => setWaterGlasses(i + 1 === waterGlasses ? i : i + 1)}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ y: -2 }}
                    className={cn(
                      'flex h-11 w-9 items-end justify-center rounded-md border-2 transition-all overflow-hidden',
                      filled
                        ? 'bg-gradient-to-t from-sky-400 to-sky-300 border-sky-300 dark:border-sky-700'
                        : 'bg-transparent border-border hover:border-sky-300'
                    )}
                    aria-label={`Glass ${i + 1} of 8`}
                  >
                    {filled && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
              >
                −1 glass
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setWaterGlasses(Math.min(8, waterGlasses + 1))}
              >
                +1 glass
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setWaterGlasses(0)}
              >
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          {/* Calorie progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-medium">Daily Calorie Progress</p>
              </div>
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {loggedCalories}
                </span>{' '}
                / {plan.dailyCalories} kcal
              </span>
            </div>
            <Progress
              value={calorieProgress}
              className="h-2.5 bg-muted"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {calorieProgress >= 100
                ? '🎯 You\'ve reached your daily target!'
                : `${plan.dailyCalories - loggedCalories} kcal remaining for your ${conditionMeta.short} plan`}
            </p>
          </div>

          <Separator />

          {/* Today's meals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-emerald-500" />
                <p className="text-sm font-medium">Today&apos;s Meals</p>
              </div>
              <Badge variant="secondary" className="text-[11px]">
                {loggedMeals.length} logged
              </Badge>
            </div>

            {/* Add meal form */}
            <div className="grid grid-cols-12 gap-2 mb-3">
              <Input
                value={newMeal}
                onChange={(e) => setNewMeal(e.target.value)}
                placeholder="Meal name..."
                className="col-span-12 sm:col-span-5 h-9 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addMeal()
                  }
                }}
              />
              <Input
                value={newMealCalories}
                onChange={(e) =>
                  setNewMealCalories(e.target.value.replace(/[^0-9]/g, ''))
                }
                placeholder="kcal"
                inputMode="numeric"
                className="col-span-6 sm:col-span-3 h-9 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addMeal()
                  }
                }}
              />
              <select
                value={newMealType}
                onChange={(e) => setNewMealType(e.target.value)}
                className="col-span-6 sm:col-span-2 h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </select>
              <Button
                onClick={addMeal}
                size="sm"
                className="col-span-12 sm:col-span-2 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!newMeal.trim() || !newMealCalories}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {/* Logged meals list */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence>
                {loggedMeals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No meals logged yet. Add your first meal above! 🍽️
                  </p>
                ) : (
                  loggedMeals.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/40">
                        <Utensils className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.type} • {m.calories} kcal
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => removeMeal(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MacroCard({
  label,
  pct,
  grams,
  gradient,
  bgIcon,
  textIcon,
  icon: Icon,
}: {
  label: string
  pct: number
  grams: number
  gradient: string
  bgIcon: string
  textIcon: string
  icon: React.ElementType
}) {
  return (
    <Card className="glass border-0 shadow-sm">
      <CardContent className="p-5 flex flex-col items-center text-center">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full mb-2',
            bgIcon
          )}
        >
          <Icon className={cn('h-5 w-5', textIcon)} />
        </div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={cn('text-2xl font-bold mt-1', textIcon)}>{pct}%</p>
        <p className="text-[11px] text-muted-foreground">{grams}g / day</p>
        <div className="w-full mt-2.5 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn('h-full rounded-full bg-gradient-to-r', gradient)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
