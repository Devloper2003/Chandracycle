'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import {
  Dumbbell,
  Heart,
  Flame,
  Clock,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Trophy,
  Activity,
  Zap,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Timer,
  Footprints,
  Wind,
  Bike,
  PersonStanding,
  Plus,
  X,
  Star,
  Timer as TimerIcon,
  Medal,
  Layers,
  Filter,
  ArrowRight,
  Flower2,
  Sun,
  Moon,
  RefreshCw,
  PartyPopper,
  HandHeart,
  Droplet,
  MoonStar,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PhaseId = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

type WorkoutCategory = 'strength' | 'cardio' | 'yoga' | 'pilates' | 'stretching'

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

interface Exercise {
  name: string
  duration: number // seconds for timed exercises
  reps?: string // for rep-based exercises
  description: string
  tips: string
  muscleGroup: string
}

interface Workout {
  id: string
  name: string
  category: WorkoutCategory
  duration: number // minutes
  difficulty: Difficulty
  calories: number
  intensity: 'Low' | 'Medium' | 'Medium-High' | 'High'
  muscleGroups: string[]
  description: string
  gradient: string
  icon: React.ElementType
  exercises: Exercise[]
  phases: PhaseId[] // phases where this workout is recommended
}

interface PhasePlan {
  id: PhaseId
  name: string
  subtitle: string
  days: string
  intensity: 'Low' | 'Medium' | 'Medium-High' | 'High'
  duration: string
  recommended: string[]
  avoid: string[]
  color: string
  gradient: string
  bgGradient: string
  borderColor: string
  textColor: string
  badgeColor: string
  icon: React.ElementType
  routines: { name: string; duration: string; focus: string; exercises: string[] }[]
  hormoneContext: string
}

interface ExerciseDBEntry {
  id: string
  name: string
  muscleGroup: string
  equipment: string
  difficulty: Difficulty
  instructions: string
  tips: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ElementType
  unlocked: boolean
  color: string
  progress?: number
}

// ─── Phase Plans ──────────────────────────────────────────────────────────────

const PHASE_PLANS: PhasePlan[] = [
  {
    id: 'menstrual',
    name: 'Menstrual Phase',
    subtitle: 'Rest & Restore',
    days: 'Days 1-5',
    intensity: 'Low',
    duration: '20-30 min',
    recommended: ['Gentle yoga', 'Walking', 'Stretching', 'Breathwork', 'Restorative pilates'],
    avoid: ['High-intensity intervals', 'Heavy lifting', 'Inversions', 'Long cardio sessions'],
    color: 'rose',
    gradient: 'from-rose-500 to-red-500',
    bgGradient: 'from-rose-500/10 to-red-500/5',
    borderColor: 'border-rose-200 dark:border-rose-900/50',
    textColor: 'text-rose-600 dark:text-rose-400',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    icon: Flower2,
    hormoneContext:
      'Estrogen and progesterone are at their lowest. Energy dips, and your body is calling for restoration. Inflammation is naturally higher, so favor low-impact movement that supports circulation without depleting reserves.',
    routines: [
      {
        name: 'Gentle Restore Flow',
        duration: '25 min',
        focus: 'Hip openers, lower back relief, breath-led movement',
        exercises: ['Cat-Cow Stretch', "Child's Pose", 'Supine Twist', 'Knees-to-Chest', 'Bridge Pose', 'Savasana'],
      },
      {
        name: 'Easy Walk + Mobility',
        duration: '30 min',
        focus: 'Light cardiovascular movement with joint mobility',
        exercises: ['Brisk Walk', 'Ankle Circles', 'Hip Circles', 'Shoulder Rolls', 'Standing Forward Fold'],
      },
      {
        name: 'Restorative Breathwork',
        duration: '20 min',
        focus: 'Nervous system regulation and cramp relief',
        exercises: ['Diaphragmatic Breathing', 'Alternate Nostril Breathing', 'Pelvic Floor Release', 'Guided Relaxation'],
      },
    ],
  },
  {
    id: 'follicular',
    name: 'Follicular Phase',
    subtitle: 'Energy Rising',
    days: 'Days 6-13',
    intensity: 'Medium-High',
    duration: '30-45 min',
    recommended: ['Strength training', 'HIIT', 'Steady-state cardio', 'Power yoga', 'Dance'],
    avoid: ['Overtraining without recovery', 'Skipping warm-ups'],
    color: 'pink',
    gradient: 'from-pink-500 to-fuchsia-500',
    bgGradient: 'from-pink-500/10 to-fuchsia-500/5',
    borderColor: 'border-pink-200 dark:border-pink-900/50',
    textColor: 'text-pink-600 dark:text-pink-400',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    icon: Sparkles,
    hormoneContext:
      'Estrogen rises steadily, boosting energy, mood, and pain tolerance. This is your window for new PRs, skill acquisition, and higher training volume. Your body recovers faster and builds muscle efficiently.',
    routines: [
      {
        name: 'Strength Building - Lower Body',
        duration: '40 min',
        focus: 'Compound lifts for legs and glutes',
        exercises: ['Back Squats', 'Romanian Deadlifts', 'Walking Lunges', 'Glute Bridges', 'Calf Raises'],
      },
      {
        name: 'HIIT Cardio Blast',
        duration: '30 min',
        focus: 'High-intensity intervals for conditioning',
        exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'Plank Jacks', 'High Knees', 'Rest'],
      },
      {
        name: 'Power Vinyasa Flow',
        duration: '45 min',
        focus: 'Dynamic flow with strength holds',
        exercises: ['Sun Salutation A', 'Warrior Series', 'Crow Pose', 'Side Plank', 'Wheel Pose'],
      },
    ],
  },
  {
    id: 'ovulation',
    name: 'Ovulation Phase',
    subtitle: 'Peak Power',
    days: 'Days 14-16',
    intensity: 'High',
    duration: '30-45 min',
    recommended: ['High-intensity intervals', 'Heavy strength training', 'Power workouts', 'Sprints', 'Team sports'],
    avoid: ['Excessive heat training', 'Long endurance without fueling'],
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-500/10 to-amber-500/5',
    borderColor: 'border-orange-200 dark:border-orange-900/50',
    textColor: 'text-orange-600 dark:text-orange-400',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    icon: Zap,
    hormoneContext:
      'Estrogen peaks and testosterone gets a slight boost. Energy, strength, and competitiveness are at their highest. This is the time to push for personal records, explosive power, and group challenges.',
    routines: [
      {
        name: 'Peak Power Intervals',
        duration: '35 min',
        focus: 'Explosive plyometrics and sprint intervals',
        exercises: ['Box Jumps', 'Sprint Intervals', 'Plyo Push-ups', 'Tuck Jumps', 'Broad Jumps', 'Core Finisher'],
      },
      {
        name: 'Heavy Strength Day',
        duration: '45 min',
        focus: 'Maximal strength with compound movements',
        exercises: ['Deadlifts', 'Bench Press', 'Weighted Pull-ups', 'Overhead Press', 'Barbell Rows'],
      },
      {
        name: 'Athletic Conditioning',
        duration: '40 min',
        focus: 'Agility, speed, and power development',
        exercises: ['Agility Ladder', 'Sled Push', 'Med Ball Throws', 'Plyo Bounds', 'Sprints'],
      },
    ],
  },
  {
    id: 'luteal',
    name: 'Luteal Phase',
    subtitle: 'Wind Down',
    days: 'Days 17-28',
    intensity: 'Medium',
    duration: '30-40 min',
    recommended: ['Moderate cardio', 'Pilates', 'Strength maintenance', 'Barre', 'Steady-state cycling'],
    avoid: ['Max-effort lifts', 'Long HIIT sessions late in phase', 'Skipping recovery days'],
    color: 'purple',
    gradient: 'from-purple-500 to-violet-500',
    bgGradient: 'from-purple-500/10 to-violet-500/5',
    borderColor: 'border-purple-200 dark:border-purple-900/50',
    textColor: 'text-purple-600 dark:text-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    icon: MoonStar,
    hormoneContext:
      'Progesterone rises, increasing body temperature and perceived effort. Energy gradually decreases as you approach menstruation. Focus on strength maintenance, moderate cardio, and stress-reducing movement.',
    routines: [
      {
        name: 'Pilates Core & Stability',
        duration: '35 min',
        focus: 'Deep core, pelvic floor, and posture',
        exercises: ['Hundred', 'Roll-ups', 'Leg Circles', 'Swan Dive', 'Side Kicks', 'Teaser'],
      },
      {
        name: 'Moderate Strength Maintenance',
        duration: '40 min',
        focus: 'Maintain muscle with submaximal loads',
        exercises: ['Goblet Squats', 'Dumbbell Rows', 'Hip Thrusts', 'Push Press', 'Plank Holds'],
      },
      {
        name: 'Steady-State Cardio + Stretch',
        duration: '35 min',
        focus: 'Heart health with relaxation finish',
        exercises: ['Cycling', 'Incline Walk', 'Hip Openers', 'Seated Twists', 'Forward Folds'],
      },
    ],
  },
]

// ─── Workout Library ──────────────────────────────────────────────────────────

const WORKOUT_LIBRARY: Workout[] = [
  // ── Strength (6) ──
  {
    id: 'str-upper',
    name: 'Upper Body Power',
    category: 'strength',
    duration: 40,
    difficulty: 'Intermediate',
    calories: 280,
    intensity: 'Medium-High',
    muscleGroups: ['Chest', 'Back', 'Shoulders', 'Arms'],
    description: 'Build a strong upper body with compound and isolation movements.',
    gradient: 'from-orange-500 to-rose-500',
    icon: Dumbbell,
    phases: ['follicular', 'ovulation'],
    exercises: [
      { name: 'Push-ups', duration: 45, reps: '12-15 reps', description: 'Lower your body with control, keeping elbows at 45 degrees.', tips: 'Engage your core and avoid letting hips sag.', muscleGroup: 'Chest' },
      { name: 'Dumbbell Rows', duration: 45, reps: '12 reps each side', description: 'Hinge at hips, pull dumbbell toward hip crease.', tips: 'Squeeze shoulder blade at the top.', muscleGroup: 'Back' },
      { name: 'Overhead Press', duration: 45, reps: '12 reps', description: 'Press dumbbells overhead from shoulder height.', tips: 'Avoid arching your lower back.', muscleGroup: 'Shoulders' },
      { name: 'Bicep Curls', duration: 40, reps: '15 reps', description: 'Curl dumbbells with palms facing up.', tips: 'Keep elbows pinned to your sides.', muscleGroup: 'Arms' },
      { name: 'Tricep Dips', duration: 40, reps: '12 reps', description: 'Lower body off bench using triceps.', tips: 'Keep shoulders away from ears.', muscleGroup: 'Arms' },
      { name: 'Plank Shoulder Taps', duration: 45, reps: '20 taps', description: 'Tap opposite shoulder in plank position.', tips: 'Minimize hip rotation.', muscleGroup: 'Core' },
    ],
  },
  {
    id: 'str-lower',
    name: 'Lower Body Strength',
    category: 'strength',
    duration: 45,
    difficulty: 'Intermediate',
    calories: 320,
    intensity: 'Medium-High',
    muscleGroups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    description: 'Sculpt and strengthen your legs and glutes with proven compound lifts.',
    gradient: 'from-rose-500 to-orange-400',
    icon: Dumbbell,
    phases: ['follicular', 'ovulation'],
    exercises: [
      { name: 'Goblet Squats', duration: 50, reps: '15 reps', description: 'Hold dumbbell at chest, squat deep with upright torso.', tips: 'Push knees out and drive through heels.', muscleGroup: 'Quads' },
      { name: 'Romanian Deadlifts', duration: 50, reps: '12 reps', description: 'Hinge at hips with soft knees, lower weight along legs.', tips: 'Feel stretch in hamstrings, keep neutral spine.', muscleGroup: 'Hamstrings' },
      { name: 'Walking Lunges', duration: 50, reps: '12 reps each leg', description: 'Step forward and lower back knee toward floor.', tips: 'Keep front knee over ankle.', muscleGroup: 'Quads' },
      { name: 'Glute Bridges', duration: 45, reps: '15 reps', description: 'Drive hips up from supine position.', tips: 'Squeeze glutes at the top.', muscleGroup: 'Glutes' },
      { name: 'Calf Raises', duration: 40, reps: '20 reps', description: 'Rise onto balls of feet, lower with control.', tips: 'Pause at top for full contraction.', muscleGroup: 'Calves' },
    ],
  },
  {
    id: 'str-full',
    name: 'Full Body conditioning',
    category: 'strength',
    duration: 50,
    difficulty: 'Advanced',
    calories: 380,
    intensity: 'High',
    muscleGroups: ['Full Body', 'Core', 'Cardio'],
    description: 'Total-body strength circuit that builds muscle and burns calories.',
    gradient: 'from-amber-500 to-orange-600',
    icon: Activity,
    phases: ['ovulation'],
    exercises: [
      { name: 'Thrusters', duration: 45, reps: '12 reps', description: 'Squat then press dumbbells overhead in one fluid motion.', tips: 'Use momentum from squat to drive the press.', muscleGroup: 'Full Body' },
      { name: 'Renegade Rows', duration: 45, reps: '10 reps each side', description: 'Row dumbbell from plank position.', tips: 'Keep hips square to floor.', muscleGroup: 'Back' },
      { name: 'Clean to Press', duration: 50, reps: '10 reps', description: 'Explosively lift dumbbells to shoulders, then press overhead.', tips: 'Drive through legs, snap hips.', muscleGroup: 'Full Body' },
      { name: 'Bulgarian Split Squats', duration: 50, reps: '10 reps each leg', description: 'Rear foot on bench, squat with front leg.', tips: 'Keep torso upright.', muscleGroup: 'Quads' },
      { name: 'Hollow Body Hold', duration: 40, reps: '30 sec hold', description: 'Lie on back, lift legs and shoulders off floor.', tips: 'Press lower back into floor.', muscleGroup: 'Core' },
    ],
  },
  {
    id: 'str-core',
    name: 'Core Crusher',
    category: 'strength',
    duration: 25,
    difficulty: 'Beginner',
    calories: 180,
    intensity: 'Medium',
    muscleGroups: ['Abs', 'Obliques', 'Lower Back'],
    description: 'Targeted core workout for stability, definition, and lower-back health.',
    gradient: 'from-orange-400 to-yellow-500',
    icon: Layers,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'Dead Bugs', duration: 40, reps: '12 reps each side', description: 'Lie on back, extend opposite arm and leg.', tips: 'Keep lower back pressed into floor.', muscleGroup: 'Abs' },
      { name: 'Russian Twists', duration: 45, reps: '20 twists', description: 'Sit, lean back, rotate torso side to side.', tips: 'Keep chest lifted.', muscleGroup: 'Obliques' },
      { name: 'Bicycle Crunches', duration: 45, reps: '20 reps', description: 'Crunch opposite elbow to knee in cycling motion.', tips: 'Slow and controlled, no rushing.', muscleGroup: 'Abs' },
      { name: 'Plank Hold', duration: 45, reps: '45 sec', description: 'Hold forearm plank position.', tips: 'Body in straight line, engage glutes.', muscleGroup: 'Core' },
      { name: 'Bird Dogs', duration: 40, reps: '10 reps each side', description: 'Extend opposite arm and leg from all-fours.', tips: 'Keep hips level and stable.', muscleGroup: 'Lower Back' },
    ],
  },
  {
    id: 'str-glutes',
    name: 'Glute Builder',
    category: 'strength',
    duration: 35,
    difficulty: 'Intermediate',
    calories: 240,
    intensity: 'Medium',
    muscleGroups: ['Glutes', 'Hamstrings', 'Hips'],
    description: 'Sculpt and strengthen your glutes with targeted activation and overload.',
    gradient: 'from-rose-400 to-pink-500',
    icon: Dumbbell,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'Hip Thrusts', duration: 50, reps: '15 reps', description: 'Drive hips up with shoulders on bench.', tips: 'Tuck chin, squeeze glutes hard at top.', muscleGroup: 'Glutes' },
      { name: 'Curtsy Lunges', duration: 45, reps: '12 reps each leg', description: 'Step behind into curtsy, lower back knee.', tips: 'Keep front knee tracking over toes.', muscleGroup: 'Glutes' },
      { name: 'Fire Hydrants', duration: 40, reps: '15 reps each side', description: 'From all-fours, lift leg out to side.', tips: 'Keep hips square, don\'t rotate.', muscleGroup: 'Glutes' },
      { name: 'Cable Kickbacks', duration: 45, reps: '12 reps each leg', description: 'Kick leg back with cable resistance.', tips: 'Squeeze glute at end range.', muscleGroup: 'Glutes' },
      { name: 'Sumo Squats', duration: 45, reps: '15 reps', description: 'Wide stance squat with toes pointed out.', tips: 'Drive knees outward.', muscleGroup: 'Glutes' },
    ],
  },
  {
    id: 'str-arms',
    name: 'Arm Definition',
    category: 'strength',
    duration: 20,
    difficulty: 'Beginner',
    calories: 140,
    intensity: 'Medium',
    muscleGroups: ['Biceps', 'Triceps', 'Forearms'],
    description: 'Tone and define your arms with focused isolation work.',
    gradient: 'from-amber-400 to-orange-500',
    icon: Dumbbell,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'Hammer Curls', duration: 40, reps: '12 reps', description: 'Curl dumbbells with palms facing each other.', tips: 'Control the negative.', muscleGroup: 'Biceps' },
      { name: 'Overhead Tricep Extension', duration: 40, reps: '12 reps', description: 'Lower dumbbell behind head, extend up.', tips: 'Keep elbows pointing forward.', muscleGroup: 'Triceps' },
      { name: 'Concentration Curls', duration: 40, reps: '10 reps each arm', description: 'Curl with elbow braced on inner thigh.', tips: 'Isolate the bicep.', muscleGroup: 'Biceps' },
      { name: 'Tricep Kickbacks', duration: 40, reps: '12 reps each arm', description: 'Hinge forward, extend dumbbell back.', tips: 'Squeeze tricep at extension.', muscleGroup: 'Triceps' },
      { name: 'Wrist Curls', duration: 35, reps: '15 reps', description: 'Curl dumbbell with forearms on bench.', tips: 'Light weight, high control.', muscleGroup: 'Forearms' },
    ],
  },

  // ── Cardio (5) ──
  {
    id: 'car-hiit',
    name: 'HIIT Inferno',
    category: 'cardio',
    duration: 25,
    difficulty: 'Advanced',
    calories: 320,
    intensity: 'High',
    muscleGroups: ['Full Body', 'Cardio'],
    description: 'High-intensity intervals that torch calories and boost metabolism for hours.',
    gradient: 'from-red-500 to-orange-500',
    icon: Flame,
    phases: ['follicular', 'ovulation'],
    exercises: [
      { name: 'Burpees', duration: 40, reps: 'Max reps', description: 'Squat, kick back to plank, push-up, jump in, jump up.', tips: 'Maintain pace, not max speed.', muscleGroup: 'Full Body' },
      { name: 'Mountain Climbers', duration: 40, reps: 'Fast pace', description: 'Drive knees to chest alternately from plank.', tips: 'Keep hips low and stable.', muscleGroup: 'Core' },
      { name: 'Jump Squats', duration: 40, reps: 'Max reps', description: 'Squat then explode into a jump.', tips: 'Land softly and absorb with muscles.', muscleGroup: 'Quads' },
      { name: 'Plank Jacks', duration: 40, reps: 'Max reps', description: 'Jump feet wide and together from plank.', tips: 'Keep upper body still.', muscleGroup: 'Core' },
      { name: 'High Knees', duration: 40, reps: 'Fast pace', description: 'Run in place bringing knees to hip height.', tips: 'Stay on balls of feet.', muscleGroup: 'Cardio' },
      { name: 'Rest', duration: 20, reps: 'Recovery', description: 'Walk in place, breathe deeply.', tips: 'Catch breath, hydrate.', muscleGroup: 'Rest' },
    ],
  },
  {
    id: 'car-run',
    name: 'Endurance Run',
    category: 'cardio',
    duration: 40,
    difficulty: 'Intermediate',
    calories: 380,
    intensity: 'Medium-High',
    muscleGroups: ['Legs', 'Cardio'],
    description: 'Steady-state outdoor or treadmill run to build aerobic endurance.',
    gradient: 'from-orange-500 to-amber-400',
    icon: Footprints,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'Warm-up Walk', duration: 300, reps: '5 min', description: 'Brisk walk to elevate heart rate.', tips: 'Loosen up shoulders, breathe easy.', muscleGroup: 'Cardio' },
      { name: 'Steady Run', duration: 1800, reps: '30 min', description: 'Maintain conversational pace run.', tips: 'You should be able to speak in short sentences.', muscleGroup: 'Cardio' },
      { name: 'Stride Outs', duration: 60, reps: '4 x 15 sec', description: 'Accelerate to near-sprint, decelerate.', tips: 'Focus on form, not speed.', muscleGroup: 'Legs' },
      { name: 'Cool-down Walk', duration: 300, reps: '5 min', description: 'Easy walk to bring heart rate down.', tips: 'Breathe deeply through nose.', muscleGroup: 'Cardio' },
    ],
  },
  {
    id: 'car-cycle',
    name: 'Cycling Session',
    category: 'cardio',
    duration: 35,
    difficulty: 'Intermediate',
    calories: 290,
    intensity: 'Medium',
    muscleGroups: ['Quads', 'Glutes', 'Cardio'],
    description: 'Indoor or outdoor cycling with intervals for leg power and cardio.',
    gradient: 'from-amber-500 to-yellow-400',
    icon: Bike,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'Easy Spin', duration: 300, reps: '5 min', description: 'Light resistance, easy pace.', tips: 'Cadence 80-90 rpm.', muscleGroup: 'Cardio' },
      { name: 'Standing Climb', duration: 120, reps: '2 min', description: 'Stand and pedal with higher resistance.', tips: 'Keep core engaged.', muscleGroup: 'Quads' },
      { name: 'Seated Sprint', duration: 60, reps: '1 min', description: 'High cadence sprint in saddle.', tips: 'Stay smooth, no bouncing.', muscleGroup: 'Cardio' },
      { name: 'Recovery Spin', duration: 120, reps: '2 min', description: 'Easy spin to recover.', tips: 'Breathe, reset.', muscleGroup: 'Cardio' },
      { name: 'Final Push', duration: 180, reps: '3 min', description: 'Moderate-to-hard effort finish.', tips: 'Leave it all out there.', muscleGroup: 'Cardio' },
    ],
  },
  {
    id: 'car-dance',
    name: 'Dance Cardio',
    category: 'cardio',
    duration: 30,
    difficulty: 'Beginner',
    calories: 240,
    intensity: 'Medium',
    muscleGroups: ['Full Body', 'Cardio'],
    description: 'Fun dance-based cardio that feels like a party, not a workout.',
    gradient: 'from-pink-500 to-orange-400',
    icon: Activity,
    phases: ['follicular', 'ovulation'],
    exercises: [
      { name: 'Warm-up Groove', duration: 240, reps: '4 min', description: 'Easy dance moves to warm up.', tips: 'Smile, have fun!', muscleGroup: 'Full Body' },
      { name: 'Latin Cardio', duration: 360, reps: '6 min', description: 'Salsa and merengue-inspired moves.', tips: 'Move hips, keep it loose.', muscleGroup: 'Full Body' },
      { name: 'Hip-Hop Section', duration: 360, reps: '6 min', description: 'Hip-hop dance moves with attitude.', tips: 'Get low, get funky.', muscleGroup: 'Full Body' },
      { name: 'Bollywood Burn', duration: 360, reps: '6 min', description: 'Bollywood-inspired high-energy moves.', tips: 'Use your arms big.', muscleGroup: 'Full Body' },
      { name: 'Cool-down Sway', duration: 240, reps: '4 min', description: 'Slow rhythmic movements to recover.', tips: 'Breathe and stretch.', muscleGroup: 'Full Body' },
    ],
  },
  {
    id: 'car-jump',
    name: 'Jump Rope Burn',
    category: 'cardio',
    duration: 20,
    difficulty: 'Intermediate',
    calories: 220,
    intensity: 'High',
    muscleGroups: ['Calves', 'Cardio', 'Shoulders'],
    description: 'Jump rope intervals for fast, effective conditioning and coordination.',
    gradient: 'from-orange-400 to-red-400',
    icon: Activity,
    phases: ['follicular', 'ovulation'],
    exercises: [
      { name: 'Basic Bounce', duration: 60, reps: '1 min', description: 'Two-foot bounce over rope.', tips: 'Stay light on balls of feet.', muscleGroup: 'Calves' },
      { name: 'Alternating Foot', duration: 60, reps: '1 min', description: 'Alternate feet like jogging.', tips: 'Keep rope rhythm steady.', muscleGroup: 'Calves' },
      { name: 'High Knees', duration: 60, reps: '1 min', description: 'Bring knees up while jumping.', tips: 'Drive knees to hip height.', muscleGroup: 'Cardio' },
      { name: 'Double Unders', duration: 60, reps: '1 min', description: 'Two rope passes per jump.', tips: 'Jump higher, spin wrists faster.', muscleGroup: 'Cardio' },
      { name: 'Rest', duration: 30, reps: '30 sec', description: 'March in place.', tips: 'Catch breath.', muscleGroup: 'Rest' },
    ],
  },

  // ── Yoga (5) ──
  {
    id: 'yog-vinyasa',
    name: 'Vinyasa Flow',
    category: 'yoga',
    duration: 45,
    difficulty: 'Intermediate',
    calories: 200,
    intensity: 'Medium',
    muscleGroups: ['Full Body', 'Core', 'Flexibility'],
    description: 'Dynamic flow linking breath to movement for strength and flexibility.',
    gradient: 'from-purple-500 to-pink-500',
    icon: Wind,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'Sun Salutation A', duration: 360, reps: '5 rounds', description: 'Classic flow: mountain, forward fold, plank, cobra, down dog.', tips: 'Move with breath, one breath per movement.', muscleGroup: 'Full Body' },
      { name: 'Warrior Sequence', duration: 360, reps: '6 min', description: 'Warrior I, II, III flows with breath.', tips: 'Sink into front knee, extend through back leg.', muscleGroup: 'Legs' },
      { name: 'Balance Poses', duration: 300, reps: '5 min', description: 'Tree pose, dancer, half moon.', tips: 'Drizishti: focus gaze for stability.', muscleGroup: 'Core' },
      { name: 'Backbends', duration: 300, reps: '5 min', description: 'Cobra, upward dog, bridge, wheel.', tips: 'Engage glutes to protect lower back.', muscleGroup: 'Back' },
      { name: 'Savasana', duration: 300, reps: '5 min', description: 'Final relaxation pose.', tips: 'Soften every muscle, breathe naturally.', muscleGroup: 'Full Body' },
    ],
  },
  {
    id: 'yog-hatha',
    name: 'Hatha Yoga',
    category: 'yoga',
    duration: 40,
    difficulty: 'Beginner',
    calories: 160,
    intensity: 'Low',
    muscleGroups: ['Full Body', 'Flexibility'],
    description: 'Classical yoga with longer holds to build alignment and awareness.',
    gradient: 'from-violet-500 to-purple-400',
    icon: Wind,
    phases: ['menstrual', 'luteal'],
    exercises: [
      { name: 'Centering & Breath', duration: 240, reps: '4 min', description: 'Sit comfortably, focus on breath.', tips: 'Long, smooth inhales and exhales.', muscleGroup: 'Mind' },
      { name: 'Standing Poses', duration: 720, reps: '12 min', description: 'Mountain, triangle, side angle, pyramid.', tips: 'Hold each pose 5-10 breaths.', muscleGroup: 'Legs' },
      { name: 'Seated Poses', duration: 600, reps: '10 min', description: 'Seated forward bend, head-to-knee, bound angle.', tips: 'Lengthen spine before folding.', muscleGroup: 'Back' },
      { name: 'Twists & Hip Openers', duration: 480, reps: '8 min', description: 'Supine twist, happy baby, figure four.', tips: 'Relax jaw and shoulders.', muscleGroup: 'Hips' },
      { name: 'Final Relaxation', duration: 360, reps: '6 min', description: 'Savasana with guided awareness.', tips: 'Let go completely.', muscleGroup: 'Full Body' },
    ],
  },
  {
    id: 'yog-yin',
    name: 'Yin Yoga',
    category: 'yoga',
    duration: 50,
    difficulty: 'Beginner',
    calories: 120,
    intensity: 'Low',
    muscleGroups: ['Connective Tissue', 'Joints', 'Flexibility'],
    description: 'Deep, slow stretches held for minutes to release connective tissue.',
    gradient: 'from-indigo-500 to-purple-500',
    icon: Moon,
    phases: ['menstrual', 'luteal'],
    exercises: [
      { name: 'Butterfly Fold', duration: 300, reps: '5 min', description: 'Seated, soles together, fold forward.', tips: 'Soften muscles, let gravity do the work.', muscleGroup: 'Hips' },
      { name: 'Dragon Pose', duration: 300, reps: '5 min each side', description: 'Low lunge with deep hip flexor stretch.', tips: 'Breathe into the stretch sensation.', muscleGroup: 'Hips' },
      { name: 'Sleeping Swan', duration: 360, reps: '6 min each side', description: 'Pigeon pose, fully relaxed on floor.', tips: 'Support with blanket if needed.', muscleGroup: 'Glutes' },
      { name: 'Caterpillar', duration: 300, reps: '5 min', description: 'Seated forward fold with rounded spine.', tips: 'Let spine curve naturally.', muscleGroup: 'Back' },
      { name: 'Savasana', duration: 360, reps: '6 min', description: 'Final rest.', tips: 'Notice the spaciousness created.', muscleGroup: 'Full Body' },
    ],
  },
  {
    id: 'yog-restorative',
    name: 'Restorative Yoga',
    category: 'yoga',
    duration: 35,
    difficulty: 'Beginner',
    calories: 90,
    intensity: 'Low',
    muscleGroups: ['Nervous System', 'Full Body'],
    description: 'Gentle supported poses to activate parasympathetic nervous system.',
    gradient: 'from-rose-400 to-purple-400',
    icon: HandHeart,
    phases: ['menstrual'],
    exercises: [
      { name: 'Supported Child\'s Pose', duration: 480, reps: '8 min', description: 'Bolster under torso, knees wide.', tips: 'Soften belly, breathe into back.', muscleGroup: 'Back' },
      { name: 'Legs Up the Wall', duration: 600, reps: '10 min', description: 'Lie on back, legs extended up wall.', tips: 'Let legs be completely passive.', muscleGroup: 'Legs' },
      { name: 'Supported Bridge', duration: 420, reps: '7 min', description: 'Block under sacrum in bridge.', tips: 'Fully supported, no effort.', muscleGroup: 'Back' },
      { name: 'Reclined Twist', duration: 300, reps: '5 min each side', description: 'Supported supine spinal twist.', tips: 'Use blankets for comfort.', muscleGroup: 'Spine' },
      { name: 'Savasana', duration: 300, reps: '5 min', description: 'Final relaxation.', tips: 'Settle into stillness.', muscleGroup: 'Full Body' },
    ],
  },
  {
    id: 'yog-prenatal',
    name: 'Prenatal Yoga',
    category: 'yoga',
    duration: 30,
    difficulty: 'Beginner',
    calories: 110,
    intensity: 'Low',
    muscleGroups: ['Full Body', 'Pelvic Floor'],
    description: 'Safe, gentle yoga for expecting mothers in any trimester.',
    gradient: 'from-pink-400 to-rose-400',
    icon: HandHeart,
    phases: ['menstrual', 'follicular', 'ovulation', 'luteal'],
    exercises: [
      { name: 'Cat-Cow Flow', duration: 240, reps: '4 min', description: 'Gentle spinal mobility on all fours.', tips: 'Move with breath, keep belly soft.', muscleGroup: 'Spine' },
      { name: 'Hip Circles', duration: 180, reps: '3 min', description: 'Circular hip movement standing or seated.', tips: 'Opens hips for labor prep.', muscleGroup: 'Hips' },
      { name: 'Garland Pose', duration: 240, reps: '4 min', description: 'Supported deep squat.', tips: 'Use blocks under heels if needed.', muscleGroup: 'Hips' },
      { name: 'Side Stretch', duration: 180, reps: '3 min each side', description: 'Seated side body stretch.', tips: 'Opens space for baby.', muscleGroup: 'Side Body' },
      { name: 'Pelvic Floor Breathing', duration: 300, reps: '5 min', description: 'Gentle kegel with breath coordination.', tips: 'Soft engagement, full release.', muscleGroup: 'Pelvic Floor' },
      { name: 'Savasana on Side', duration: 360, reps: '6 min', description: 'Rest on left side with bolster.', tips: 'Avoid lying flat on back.', muscleGroup: 'Full Body' },
    ],
  },

  // ── Pilates (4) ──
  {
    id: 'pil-mat',
    name: 'Mat Pilates',
    category: 'pilates',
    duration: 35,
    difficulty: 'Intermediate',
    calories: 180,
    intensity: 'Medium',
    muscleGroups: ['Core', 'Full Body', 'Posture'],
    description: 'Classical mat Pilates sequence for core strength and control.',
    gradient: 'from-orange-400 to-pink-400',
    icon: PersonStanding,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'The Hundred', duration: 100, reps: '100 counts', description: 'Pump arms while holding legs extended.', tips: 'Breathe in for 5, out for 5.', muscleGroup: 'Core' },
      { name: 'Roll-Up', duration: 60, reps: '6 reps', description: 'Articulate spine up and down from floor.', tips: 'Engage deep core, no momentum.', muscleGroup: 'Abs' },
      { name: 'Single Leg Circles', duration: 60, reps: '5 each way each leg', description: 'Circle extended leg from hip.', tips: 'Stabilize pelvis.', muscleGroup: 'Hips' },
      { name: 'Swan Dive', duration: 60, reps: '6 reps', description: 'Lift chest and legs in prone position.', tips: 'Lengthen spine, no compression.', muscleGroup: 'Back' },
      { name: 'Side Kick Series', duration: 90, reps: '8 kicks each side', description: 'Side-lying leg kicks front and back.', tips: 'Maintain stable torso.', muscleGroup: 'Legs' },
      { name: 'Teaser', duration: 60, reps: '6 reps', description: 'V-sit balance, arms and legs extended.', tips: 'Modify with bent knees if needed.', muscleGroup: 'Core' },
    ],
  },
  {
    id: 'pil-reformer',
    name: 'Reformer Workout',
    category: 'pilates',
    duration: 45,
    difficulty: 'Advanced',
    calories: 240,
    intensity: 'Medium-High',
    muscleGroups: ['Full Body', 'Core', 'Stability'],
    description: 'Spring-resisted reformer exercises for full-body conditioning.',
    gradient: 'from-amber-400 to-rose-400',
    icon: Layers,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'Footwork', duration: 240, reps: '4 min', description: 'Push carriage with feet in various positions.', tips: 'Press through full foot.', muscleGroup: 'Legs' },
      { name: 'Hundred on Reformer', duration: 100, reps: '100 counts', description: 'Hundred with straps for arm connection.', tips: 'Stabilize shoulders.', muscleGroup: 'Core' },
      { name: 'Frog & Leg Circles', duration: 180, reps: '3 min', description: 'In straps, bend and extend legs in frog.', tips: 'Pelvic neutral throughout.', muscleGroup: 'Legs' },
      { name: 'Short Box Series', duration: 300, reps: '5 min', description: 'Seated on box, flexion and rotation.', tips: 'Curve spine deeply.', muscleGroup: 'Core' },
      { name: 'Long Stretch', duration: 180, reps: '3 min', description: 'Plank-based work pushing carriage.', tips: 'Maintain plank line.', muscleGroup: 'Full Body' },
      { name: 'Knee Stretches', duration: 180, reps: '3 min', description: 'Kneeling, push carriage in/out with knees.', tips: 'Engage abs to control.', muscleGroup: 'Core' },
    ],
  },
  {
    id: 'pil-barre',
    name: 'Barre Class',
    category: 'pilates',
    duration: 40,
    difficulty: 'Intermediate',
    calories: 220,
    intensity: 'Medium',
    muscleGroups: ['Legs', 'Glutes', 'Core', 'Arms'],
    description: 'Ballet-inspired low-impact toning with small controlled movements.',
    gradient: 'from-pink-400 to-fuchsia-400',
    icon: PersonStanding,
    phases: ['follicular', 'luteal'],
    exercises: [
      { name: 'Warm-up Pliés', duration: 240, reps: '4 min', description: 'First and second position pliés.', tips: 'Knees over toes, tall spine.', muscleGroup: 'Legs' },
      { name: 'Arm Work with Light Weights', duration: 300, reps: '5 min', description: 'Small arm pulses with 1-2 lb weights.', tips: 'Small range, high reps.', muscleGroup: 'Arms' },
      { name: 'Thigh Set', duration: 360, reps: '6 min', description: 'Small lunges and holds at the barre.', tips: 'Shake means change is happening.', muscleGroup: 'Quads' },
      { name: 'Glute Series', duration: 360, reps: '6 min', description: 'Standing leg lifts and pulses.', tips: 'Keep standing leg strong.', muscleGroup: 'Glutes' },
      { name: 'Core with Ball', duration: 300, reps: '5 min', description: 'Ab work with small ball between thighs.', tips: 'Squeeze ball, engage deep abs.', muscleGroup: 'Core' },
      { name: 'Final Stretch', duration: 240, reps: '4 min', description: 'Full body stretch sequence.', tips: 'Breathe into each stretch.', muscleGroup: 'Full Body' },
    ],
  },
  {
    id: 'pil-core',
    name: 'Pilates Core',
    category: 'pilates',
    duration: 25,
    difficulty: 'Beginner',
    calories: 150,
    intensity: 'Medium',
    muscleGroups: ['Core', 'Back', 'Pelvic Floor'],
    description: 'Targeted core-focused Pilates for stability and postural strength.',
    gradient: 'from-orange-400 to-amber-400',
    icon: Layers,
    phases: ['menstrual', 'follicular', 'luteal'],
    exercises: [
      { name: 'Pelvic Curl', duration: 90, reps: '8 reps', description: 'Articulate spine up and down from bridge.', tips: 'One vertebra at a time.', muscleGroup: 'Glutes' },
      { name: 'Chest Lift', duration: 60, reps: '8 reps', description: 'Small abdominal crunch with hands behind head.', tips: 'Keep elbows wide, abs deep.', muscleGroup: 'Abs' },
      { name: 'Front Support', duration: 45, reps: '45 sec hold', description: 'Forearm plank hold.', tips: 'Body in one line.', muscleGroup: 'Core' },
      { name: 'Criss-Cross', duration: 60, reps: '10 each side', description: 'Bicycle-style oblique crunches.', tips: 'Rotate from waist, not neck.', muscleGroup: 'Obliques' },
      { name: 'Swan Extension', duration: 60, reps: '6 reps', description: 'Gentle prone back extension.', tips: 'Lengthen neck, engage glutes.', muscleGroup: 'Back' },
      { name: 'Side Plank', duration: 45, reps: '30 sec each side', description: 'Side-lying forearm plank.', tips: 'Stack hips, lift waist.', muscleGroup: 'Obliques' },
    ],
  },

  // ── Stretching (4) ──
  {
    id: 'str-full-stretch',
    name: 'Full Body Stretch',
    category: 'stretching',
    duration: 20,
    difficulty: 'Beginner',
    calories: 60,
    intensity: 'Low',
    muscleGroups: ['Full Body', 'Flexibility'],
    description: 'Complete body stretch routine for flexibility and recovery.',
    gradient: 'from-purple-400 to-violet-400',
    icon: Wind,
    phases: ['menstrual', 'luteal'],
    exercises: [
      { name: 'Neck Rolls', duration: 60, reps: '1 min', description: 'Gentle half-circles with the head.', tips: 'No full backward circles.', muscleGroup: 'Neck' },
      { name: 'Shoulder & Chest Opener', duration: 90, reps: '1.5 min', description: 'Doorway stretch and shoulder rolls.', tips: 'Breathe into chest.', muscleGroup: 'Shoulders' },
      { name: 'Standing Forward Fold', duration: 90, reps: '1.5 min', description: 'Hinge at hips, let head hang.', tips: 'Bend knees if needed.', muscleGroup: 'Hamstrings' },
      { name: 'Lunge Hip Stretch', duration: 90, reps: '45 sec each side', description: 'Kneeling lunge for hip flexors.', tips: 'Tuck tailbone under.', muscleGroup: 'Hips' },
      { name: 'Seated Twist', duration: 90, reps: '45 sec each side', description: 'Seated spinal twist.', tips: 'Lengthen spine first.', muscleGroup: 'Spine' },
      { name: 'Figure Four Stretch', duration: 120, reps: '1 min each side', description: 'Supine hip rotator stretch.', tips: 'Relax shoulders and jaw.', muscleGroup: 'Glutes' },
    ],
  },
  {
    id: 'str-morning',
    name: 'Morning Mobility',
    category: 'stretching',
    duration: 15,
    difficulty: 'Beginner',
    calories: 40,
    intensity: 'Low',
    muscleGroups: ['Full Body', 'Joints'],
    description: 'Wake up your body with gentle morning mobility and energy flow.',
    gradient: 'from-amber-300 to-orange-400',
    icon: Sun,
    phases: ['menstrual', 'follicular', 'ovulation', 'luteal'],
    exercises: [
      { name: 'Deep Breathing', duration: 60, reps: '1 min', description: 'Three-part breath sitting up in bed.', tips: 'Fill belly, ribs, chest.', muscleGroup: 'Lungs' },
      { name: 'Full Body Stretch', duration: 60, reps: '1 min', description: 'Reach arms and legs long, like star pose.', tips: 'Tense then release.', muscleGroup: 'Full Body' },
      { name: 'Knees-to-Chest', duration: 90, reps: '1.5 min', description: 'Hug knees into chest, rock side to side.', tips: 'Massage lower back.', muscleGroup: 'Back' },
      { name: 'Spinal Twist in Bed', duration: 90, reps: '45 sec each side', description: 'Drop knees side to side.', tips: 'Look opposite direction.', muscleGroup: 'Spine' },
      { name: 'Cat-Cow', duration: 120, reps: '2 min', description: 'All-fours spinal mobility.', tips: 'Move with breath.', muscleGroup: 'Spine' },
      { name: 'Standing Side Bend', duration: 90, reps: '45 sec each side', description: 'Reach one arm overhead, side-bend.', tips: 'Lengthen before bending.', muscleGroup: 'Side Body' },
    ],
  },
  {
    id: 'str-evening',
    name: 'Evening Wind Down',
    category: 'stretching',
    duration: 18,
    difficulty: 'Beginner',
    calories: 50,
    intensity: 'Low',
    muscleGroups: ['Full Body', 'Nervous System'],
    description: 'Calming stretches to release the day and prepare for restful sleep.',
    gradient: 'from-indigo-400 to-purple-400',
    icon: Moon,
    phases: ['menstrual', 'luteal'],
    exercises: [
      { name: 'Child\'s Pose', duration: 180, reps: '3 min', description: 'Knees wide, fold forward, arms extended.', tips: 'Soften jaw and shoulders.', muscleGroup: 'Back' },
      { name: 'Legs Up the Wall', duration: 300, reps: '5 min', description: 'Lie down, legs extended up wall.', tips: 'Slow, deep belly breaths.', muscleGroup: 'Legs' },
      { name: 'Reclined Butterfly', duration: 180, reps: '3 min', description: 'Soles together, knees fall wide.', tips: 'Support knees with pillows.', muscleGroup: 'Hips' },
      { name: 'Supine Spinal Twist', duration: 180, reps: '1.5 min each side', description: 'Knees drop to one side.', tips: 'Breathe into release.', muscleGroup: 'Spine' },
      { name: 'Corpse Pose', duration: 240, reps: '4 min', description: 'Final relaxation, body scan.', tips: 'Let go of the day.', muscleGroup: 'Full Body' },
    ],
  },
  {
    id: 'str-post',
    name: 'Post-Workout Stretch',
    category: 'stretching',
    duration: 12,
    difficulty: 'Beginner',
    calories: 35,
    intensity: 'Low',
    muscleGroups: ['Full Body', 'Recovery'],
    description: 'Quick recovery stretches to prevent soreness and improve flexibility.',
    gradient: 'from-emerald-400 to-teal-400',
    icon: Wind,
    phases: ['follicular', 'ovulation', 'luteal'],
    exercises: [
      { name: 'Standing Quad Stretch', duration: 60, reps: '30 sec each leg', description: 'Pull heel to glute, hold.', tips: 'Keep knees aligned.', muscleGroup: 'Quads' },
      { name: 'Hamstring Stretch', duration: 60, reps: '30 sec each leg', description: 'Forward fold with one leg extended.', tips: 'Hinge from hips.', muscleGroup: 'Hamstrings' },
      { name: 'Calf Stretch', duration: 60, reps: '30 sec each leg', description: 'Wall stretch for calves.', tips: 'Press heel down.', muscleGroup: 'Calves' },
      { name: 'Chest & Shoulder Stretch', duration: 60, reps: '30 sec each side', description: 'Doorway chest opener.', tips: 'Gently lean forward.', muscleGroup: 'Chest' },
      { name: 'Tricep Stretch', duration: 60, reps: '30 sec each arm', description: 'Pull elbow behind head.', tips: 'Reach hand down spine.', muscleGroup: 'Arms' },
      { name: 'Downward Dog', duration: 90, reps: '1.5 min', description: 'Full-body stretch in inverted V.', tips: 'Pedal feet to stretch calves.', muscleGroup: 'Full Body' },
      { name: "Child's Pose", duration: 120, reps: '2 min', description: 'Rest and breathe.', tips: 'Soften completely.', muscleGroup: 'Back' },
    ],
  },
]

// ─── Exercise Database (20+ exercises) ────────────────────────────────────────

const EXERCISE_DATABASE: ExerciseDBEntry[] = [
  { id: 'ex1', name: 'Push-up', muscleGroup: 'Chest', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Start in plank with hands wider than shoulders. Lower body until chest nearly touches floor, keeping elbows at 45°. Push back up to start.', tips: 'Keep core tight and body in straight line. Modify on knees if needed.' },
  { id: 'ex2', name: 'Bodyweight Squat', muscleGroup: 'Quads', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Stand with feet shoulder-width apart. Lower hips back and down as if sitting into a chair. Drive through heels to stand.', tips: 'Keep chest up, knees tracking over toes.' },
  { id: 'ex3', name: 'Glute Bridge', muscleGroup: 'Glutes', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Lie on back with knees bent, feet flat. Squeeze glutes and lift hips until body forms a line from knees to shoulders.', tips: 'Pause and squeeze at the top. Avoid arching lower back.' },
  { id: 'ex4', name: 'Plank Hold', muscleGroup: 'Core', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Rest on forearms and toes, body in straight line from head to heels. Hold position while breathing steadily.', tips: 'Engage abs and glutes. Don\'t let hips sag or pike up.' },
  { id: 'ex5', name: 'Walking Lunge', muscleGroup: 'Quads', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Step forward into lunge, lower back knee toward floor. Push off front leg, bring back leg forward into next lunge.', tips: 'Keep front knee over ankle, torso upright.' },
  { id: 'ex6', name: 'Burpee', muscleGroup: 'Full Body', equipment: 'Bodyweight', difficulty: 'Advanced', instructions: 'From standing, drop into squat with hands on floor. Kick feet back to plank, do push-up. Jump feet in, explode up into jump.', tips: 'Maintain plank form during push-up. Modify by stepping instead of jumping.' },
  { id: 'ex7', name: 'Mountain Climber', muscleGroup: 'Core', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'From plank position, drive right knee toward chest, then switch legs rapidly as if running in place.', tips: 'Keep hips low and shoulders over wrists.' },
  { id: 'ex8', name: 'Jump Squat', muscleGroup: 'Quads', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Perform a bodyweight squat, then explosively jump upward. Land softly back into squat position.', tips: 'Land with soft knees, immediately descend into next rep.' },
  { id: 'ex9', name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbells', difficulty: 'Intermediate', instructions: 'Hinge at hips with flat back, hold dumbbell in one hand. Pull dumbbell toward hip crease, squeezing shoulder blade.', tips: 'Keep elbow close to body. Don\'t rotate torso.' },
  { id: 'ex10', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', difficulty: 'Intermediate', instructions: 'Sit or stand with dumbbells at shoulder height, palms forward. Press dumbbells overhead until arms are extended.', tips: 'Engage core to avoid arching back. Lower with control.' },
  { id: 'ex11', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Dumbbells', difficulty: 'Intermediate', instructions: 'Hold dumbbells in front of thighs. Hinge at hips with soft knees, lower weights along legs until stretch in hamstrings. Drive hips forward to stand.', tips: 'Keep spine neutral, movement comes from hips.' },
  { id: 'ex12', name: 'Hip Thrust', muscleGroup: 'Glutes', equipment: 'Bench', difficulty: 'Intermediate', instructions: 'Upper back on bench, feet flat on floor. Drive through heels to lift hips, squeeze glutes at top. Lower with control.', tips: 'Tuck chin to chest. Squeeze glutes, not lower back.' },
  { id: 'ex13', name: 'Russian Twist', muscleGroup: 'Obliques', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Sit with knees bent, lean back slightly. Rotate torso side to side, tapping floor near hips.', tips: 'Keep chest lifted. Add weight to increase difficulty.' },
  { id: 'ex14', name: 'Dead Bug', muscleGroup: 'Abs', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Lie on back, arms up, knees bent at 90°. Lower opposite arm and leg toward floor. Return and switch sides.', tips: 'Keep lower back pressed into floor throughout.' },
  { id: 'ex15', name: 'Bicycle Crunch', muscleGroup: 'Abs', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Lie on back, hands behind head. Bring opposite elbow to opposite knee in cycling motion.', tips: 'Rotate from waist, not from pulling on neck.' },
  { id: 'ex16', name: 'Bird Dog', muscleGroup: 'Lower Back', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'On all fours, extend opposite arm and leg. Hold, then switch sides. Keep spine neutral.', tips: 'Move slowly. Don\'t let hips rotate.' },
  { id: 'ex17', name: 'Side Plank', muscleGroup: 'Obliques', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Lie on side, prop up on forearm. Lift hips so body forms straight line. Hold for time.', tips: 'Stack hips. Don\'t let bottom hip drop.' },
  { id: 'ex18', name: 'Downward Dog', muscleGroup: 'Full Body', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'From all fours, tuck toes and lift hips up and back into inverted V. Press palms and heels toward floor.', tips: 'Lengthen spine. Bend knees if hamstrings tight.' },
  { id: 'ex19', name: 'Warrior II', muscleGroup: 'Legs', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Step feet wide apart, front knee bent at 90°, arms extended parallel to floor. Gaze over front hand.', tips: 'Front knee tracks over ankle. Press into outer edge of back foot.' },
  { id: 'ex20', name: "Child's Pose", muscleGroup: 'Back', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Kneel with knees wide, sit back on heels, fold torso forward, arms extended or relaxed.', tips: 'Soften shoulders. Use bolster under torso if needed.' },
  { id: 'ex21', name: 'Bridge Pose', muscleGroup: 'Glutes', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Lie on back, knees bent, feet flat. Press into feet to lift hips and lower back off floor.', tips: 'Roll up one vertebra at a time.' },
  { id: 'ex22', name: 'Cat-Cow Stretch', muscleGroup: 'Spine', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'On all fours, alternate between arching back (cat) and dropping belly (cow) with breath.', tips: 'Move with breath: inhale for cow, exhale for cat.' },
  { id: 'ex23', name: 'Cobra Pose', muscleGroup: 'Back', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Lie prone, hands under shoulders. Press chest up while keeping hips on floor.', tips: 'Lengthen spine, soft bend in elbows.' },
  { id: 'ex24', name: 'Kettlebell Swing', muscleGroup: 'Full Body', equipment: 'Kettlebell', difficulty: 'Advanced', instructions: 'Stand with feet wide, hold kettlebell with both hands. Hinge at hips to swing bell between legs, then snap hips to swing up to chest height.', tips: 'Power comes from hips, not arms. Squeeze glutes at top.' },
  { id: 'ex25', name: 'Resistance Band Row', muscleGroup: 'Back', equipment: 'Resistance Band', difficulty: 'Beginner', instructions: 'Anchor band at chest height. Hold ends, pull toward torso, squeezing shoulder blades together.', tips: 'Keep shoulders down, away from ears.' },
]

// ─── Activity Data (last 7 days) — empty by default, populated from logs ──

const ACTIVITY_DATA = [
  { day: 'Mon', minutes: 0, workout: null, completed: false },
  { day: 'Tue', minutes: 0, workout: null, completed: false },
  { day: 'Wed', minutes: 0, workout: null, completed: false },
  { day: 'Thu', minutes: 0, workout: null, completed: false },
  { day: 'Fri', minutes: 0, workout: null, completed: false },
  { day: 'Sat', minutes: 0, workout: null, completed: false },
  { day: 'Sun', minutes: 0, workout: null, completed: false },
]

// ─── Monthly Summary — empty until user logs workouts ─────────────────────────

const MONTHLY_SUMMARY = [
  { week: 'Week 1', workouts: 0, minutes: 0 },
  { week: 'Week 2', workouts: 0, minutes: 0 },
  { week: 'Week 3', workouts: 0, minutes: 0 },
  { week: 'Week 4', workouts: 0, minutes: 0 },
]

// ─── Goals — start at 0 progress ─────────────────────────────────────────────

const INITIAL_GOALS = {
  weeklyWorkouts: { current: 0, target: 6 },
  weeklyMinutes: { current: 0, target: 240 },
  weeklyCalories: { current: 0, target: 1800 },
}

// ─── Achievements — all locked initially (config kept) ───────────────────────

const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', name: 'First Workout', description: 'Completed your first workout', icon: Star, unlocked: false, color: 'from-amber-400 to-orange-500', progress: 0 },
  { id: 'a2', name: '7-Day Streak', description: 'Active 7 days in a row', icon: Flame, unlocked: false, color: 'from-orange-500 to-red-500', progress: 0 },
  { id: 'a3', name: '30-Day Streak', description: 'Active 30 days in a row', icon: Trophy, unlocked: false, color: 'from-purple-500 to-violet-500', progress: 0 },
  { id: 'a4', name: '100 Workouts', description: 'Complete 100 total workouts', icon: Medal, unlocked: false, color: 'from-pink-500 to-rose-500', progress: 0 },
  { id: 'a5', name: 'Early Riser', description: 'Workout before 7 AM', icon: Sun, unlocked: false, color: 'from-yellow-400 to-amber-500', progress: 0 },
  { id: 'a6', name: 'Strength Master', description: 'Complete 20 strength workouts', icon: Dumbbell, unlocked: false, color: 'from-rose-500 to-orange-500', progress: 0 },
  { id: 'a7', name: 'Zen Seeker', description: 'Complete 15 yoga sessions', icon: Wind, unlocked: false, color: 'from-purple-400 to-pink-400', progress: 0 },
  { id: 'a8', name: 'Calorie Crusher', description: 'Burn 10,000 calories total', icon: Flame, unlocked: false, color: 'from-red-500 to-orange-500', progress: 0 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<WorkoutCategory, { label: string; icon: React.ElementType; gradient: string }> = {
  strength: { label: 'Strength', icon: Dumbbell, gradient: 'from-orange-500 to-rose-500' },
  cardio: { label: 'Cardio', icon: Heart, gradient: 'from-red-500 to-orange-500' },
  yoga: { label: 'Yoga', icon: Wind, gradient: 'from-purple-500 to-pink-500' },
  pilates: { label: 'Pilates', icon: PersonStanding, gradient: 'from-amber-500 to-rose-500' },
  stretching: { label: 'Stretching', icon: Activity, gradient: 'from-emerald-500 to-teal-500' },
}

const INTENSITY_COLORS: Record<string, string> = {
  Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Medium-High': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  High: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Advanced: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ─── Workout Player ───────────────────────────────────────────────────────────

interface PlayerState {
  workout: Workout
  exerciseIndex: number
  remaining: number
  isPlaying: boolean
  isComplete: boolean
  startedAt: number | null
  completedExercises: number
}

function WorkoutPlayer({
  workout,
  onClose,
}: {
  workout: Workout
  onClose: (completed: boolean, durationSec: number, calories: number) => void
}) {
  const [state, setState] = useState<PlayerState>({
    workout,
    exerciseIndex: 0,
    remaining: workout.exercises[0]?.duration ?? 30,
    isPlaying: true,
    isComplete: false,
    startedAt: Date.now(),
    completedExercises: 0,
  })

  const totalExercises = workout.exercises.length
  const currentExercise = workout.exercises[state.exerciseIndex]
  const totalDuration = workout.exercises.reduce((sum, ex) => sum + ex.duration, 0)
  const elapsedBeforeCurrent = workout.exercises
    .slice(0, state.exerciseIndex)
    .reduce((sum, ex) => sum + ex.duration, 0)
  const overallProgress = ((elapsedBeforeCurrent + (currentExercise.duration - state.remaining)) / totalDuration) * 100
  const exerciseProgress = ((currentExercise.duration - state.remaining) / currentExercise.duration) * 100

  // Working timer using useEffect + setInterval as required
  useEffect(() => {
    if (!state.isPlaying || state.isComplete) return
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.remaining > 1) {
          return { ...prev, remaining: prev.remaining - 1 }
        }
        // Exercise complete, advance
        const nextIndex = prev.exerciseIndex + 1
        if (nextIndex >= totalExercises) {
          return {
            ...prev,
            remaining: 0,
            isPlaying: false,
            isComplete: true,
            completedExercises: prev.completedExercises + 1,
          }
        }
        return {
          ...prev,
          exerciseIndex: nextIndex,
          remaining: prev.workout.exercises[nextIndex].duration,
          completedExercises: prev.completedExercises + 1,
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state.isPlaying, state.isComplete, state.exerciseIndex, totalExercises])

  const togglePlay = () => setState((p) => ({ ...p, isPlaying: !p.isPlaying }))

  const goNext = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.exerciseIndex + 1
      if (nextIndex >= totalExercises) {
        return { ...prev, isComplete: true, isPlaying: false, remaining: 0 }
      }
      return {
        ...prev,
        exerciseIndex: nextIndex,
        remaining: prev.workout.exercises[nextIndex].duration,
        isPlaying: true,
      }
    })
  }, [totalExercises])

  const goPrev = () => {
    setState((prev) => {
      if (prev.exerciseIndex === 0) return prev
      const prevIndex = prev.exerciseIndex - 1
      return {
        ...prev,
        exerciseIndex: prevIndex,
        remaining: prev.workout.exercises[prevIndex].duration,
        isPlaying: true,
      }
    })
  }

  const elapsedSec = Math.floor((Date.now() - (state.startedAt ?? Date.now())) / 1000)

  // Completion celebration screen
  if (state.isComplete) {
    const minutes = Math.floor(elapsedSec / 60)
    const seconds = elapsedSec % 60
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl p-8 text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg"
          >
            <PartyPopper className="h-12 w-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Workout Complete!</h2>
          <p className="text-gray-600 mb-6">Amazing work! You crushed {workout.name}.</p>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-2xl bg-orange-50 p-4">
              <Flame className="h-6 w-6 mx-auto text-orange-500 mb-1" />
              <div className="text-2xl font-bold text-gray-900">{workout.calories}</div>
              <div className="text-xs text-gray-500">Calories</div>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4">
              <Clock className="h-6 w-6 mx-auto text-rose-500 mb-1" />
              <div className="text-2xl font-bold text-gray-900">{minutes}:{seconds.toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500">Minutes</div>
            </div>
            <div className="rounded-2xl bg-purple-50 p-4">
              <CheckCircle2 className="h-6 w-6 mx-auto text-purple-500 mb-1" />
              <div className="text-2xl font-bold text-gray-900">{totalExercises}</div>
              <div className="text-xs text-gray-500">Exercises</div>
            </div>
          </div>
          <Button
            onClick={() => onClose(true, elapsedSec, workout.calories)}
            className="w-full h-12 text-base bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg"
          >
            Done
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-br from-slate-900 via-orange-950 to-rose-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-wider text-orange-300/80">Now Playing</p>
          <h2 className="text-lg font-semibold">{workout.name}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onClose(false, elapsedSec, 0)}
          className="text-white hover:bg-white/10 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Overall progress */}
      <div className="px-6 pt-3">
        <div className="flex justify-between text-xs text-white/60 mb-1.5">
          <span>Exercise {state.exerciseIndex + 1} of {totalExercises}</span>
          <span>{Math.round(overallProgress)}% complete</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-400 to-rose-400"
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        <motion.div
          key={state.exerciseIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center w-full max-w-lg"
        >
          <p className="text-sm uppercase tracking-wider text-orange-300/80 mb-2">
            {currentExercise.muscleGroup}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{currentExercise.name}</h1>

          {/* Timer ring */}
          <div className="relative mx-auto mb-8 h-56 w-56">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="url(#timerGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 * (1 - exerciseProgress / 100)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tabular-nums">{formatTime(state.remaining)}</span>
              <span className="text-sm text-white/60 mt-1">
                {currentExercise.reps ? currentExercise.reps : 'seconds'}
              </span>
            </div>
          </div>

          {/* Description + tips */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 text-left mb-3">
            <p className="text-sm text-white/80">{currentExercise.description}</p>
          </div>
          <div className="rounded-2xl bg-orange-500/10 backdrop-blur-sm border border-orange-400/20 p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-orange-300 mb-1">Form Tip</p>
            <p className="text-sm text-white/90">{currentExercise.tips}</p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="px-6 py-6 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            disabled={state.exerciseIndex === 0}
            className="h-14 w-14 rounded-full text-white hover:bg-white/10 disabled:opacity-30"
          >
            <SkipBack className="h-6 w-6" />
          </Button>
          <Button
            onClick={togglePlay}
            className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white shadow-lg shadow-orange-500/30"
          >
            {state.isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="h-14 w-14 rounded-full text-white hover:bg-white/10"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FitnessModule() {
  const [currentPhase, setCurrentPhase] = useState<PhaseId>('follicular')
  const [activePlayer, setActivePlayer] = useState<Workout | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<PhaseId | null>('follicular')
  const [libraryTab, setLibraryTab] = useState<WorkoutCategory>('strength')
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState<string>('all')
  const [filterEquipment, setFilterEquipment] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [goals, setGoals] = useState(INITIAL_GOALS)
  const [toast, setToast] = useState<string | null>(null)
  const [completedToday, setCompletedToday] = useState(false)

  const phasePlan = useMemo(() => PHASE_PLANS.find((p) => p.id === currentPhase)!, [currentPhase])

  // Today's recommended workout: pick based on phase
  const todaysWorkout = useMemo(() => {
    const candidates = WORKOUT_LIBRARY.filter((w) => w.phases.includes(currentPhase))
    if (candidates.length === 0) return WORKOUT_LIBRARY[0]
    // Pick a different one for variety based on day of week
    const dayIdx = new Date().getDay()
    return candidates[dayIdx % candidates.length]
  }, [currentPhase])

  const alternativeWorkout = useMemo(() => {
    const candidates = WORKOUT_LIBRARY.filter(
      (w) => w.phases.includes(currentPhase) && w.id !== todaysWorkout.id
    )
    if (candidates.length === 0) return WORKOUT_LIBRARY[1] ?? WORKOUT_LIBRARY[0]
    const dayIdx = new Date().getDay()
    return candidates[(dayIdx + 1) % candidates.length]
  }, [currentPhase, todaysWorkout])

  // Filtered exercise DB
  const filteredExercises = useMemo(() => {
    return EXERCISE_DATABASE.filter((ex) => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterMuscle !== 'all' && ex.muscleGroup !== filterMuscle) return false
      if (filterEquipment !== 'all' && ex.equipment !== filterEquipment) return false
      if (filterDifficulty !== 'all' && ex.difficulty !== filterDifficulty) return false
      return true
    })
  }, [search, filterMuscle, filterEquipment, filterDifficulty])

  const muscleGroups = useMemo(
    () => Array.from(new Set(EXERCISE_DATABASE.map((e) => e.muscleGroup))).sort(),
    []
  )
  const equipmentTypes = useMemo(
    () => Array.from(new Set(EXERCISE_DATABASE.map((e) => e.equipment))).sort(),
    []
  )

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const handlePlayerClose = (completed: boolean, _durationSec: number, _calories: number) => {
    setActivePlayer(null)
    if (completed) {
      setCompletedToday(true)
      // Increment goals
      setGoals((prev) => ({
        weeklyWorkouts: { ...prev.weeklyWorkouts, current: prev.weeklyWorkouts.current + 1 },
        weeklyMinutes: { ...prev.weeklyMinutes, current: prev.weeklyMinutes.current + Math.round(_durationSec / 60) },
        weeklyCalories: { ...prev.weeklyCalories, current: prev.weeklyCalories.current + _calories },
      }))
      showToast('Workout complete! Goals updated.')
    }
  }

  const weeklyMinutesTotal = ACTIVITY_DATA.reduce((sum, d) => sum + d.minutes, 0)
  const workoutsThisWeek = ACTIVITY_DATA.filter((d) => d.completed).length
  const caloriesThisWeek = ACTIVITY_DATA.filter((d) => d.completed).length * 240
  // Streak is 0 for a brand-new user — no fake history.
  const activeDaysStreak = 0

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  }

  const goalPct = (cur: number, tgt: number) => Math.min(100, Math.round((cur / tgt) * 100))

  return (
    <div className="space-y-6">
      {/* ─── 1. Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 p-6 md:p-8 text-white shadow-xl"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-yellow-300 blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Cycle-Synced Training
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
              Move &amp; Flow
            </h1>
            <p className="text-white/90 max-w-xl">
              Cycle-synced workouts for your body&apos;s natural rhythm. Train smarter by aligning
              your movement with your hormones.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <Badge className={cn('text-sm px-4 py-2 border-0', phasePlan.badgeColor)}>
              <phasePlan.icon className="h-4 w-4 mr-1.5" />
              {phasePlan.name} · {phasePlan.days}
            </Badge>
            <div className="text-sm text-white/80">
              Recommended intensity:{' '}
              <span className="font-semibold text-white">{phasePlan.intensity}</span>
            </div>
            <div className="text-sm text-white/80">
              Target duration: <span className="font-semibold text-white">{phasePlan.duration}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 2. Today's Workout ─── */}
      <motion.section variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Today&apos;s Workout
          </h2>
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main workout card */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className={cn(
              'relative overflow-hidden border-0 bg-gradient-to-br text-white shadow-lg',
              todaysWorkout.gradient
            )}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="relative p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur mb-2">
                      <phasePlan.icon className="h-3 w-3 mr-1" />
                      {phasePlan.name} Phase
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold">{todaysWorkout.name}</h3>
                    <p className="text-white/80 text-sm mt-1 max-w-md">{todaysWorkout.description}</p>
                  </div>
                  <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur shrink-0">
                    <todaysWorkout.icon className="h-8 w-8" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                    <Clock className="h-4 w-4 mb-1 opacity-80" />
                    <div className="text-xl font-bold">{todaysWorkout.duration}</div>
                    <div className="text-xs opacity-80">minutes</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                    <Flame className="h-4 w-4 mb-1 opacity-80" />
                    <div className="text-xl font-bold">{todaysWorkout.calories}</div>
                    <div className="text-xs opacity-80">calories</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                    <Zap className="h-4 w-4 mb-1 opacity-80" />
                    <div className="text-xl font-bold">{todaysWorkout.intensity}</div>
                    <div className="text-xs opacity-80">intensity</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur p-4 mb-5">
                  <p className="text-xs uppercase tracking-wider opacity-70 mb-2">Exercise Preview</p>
                  <div className="space-y-1.5">
                    {todaysWorkout.exercises.slice(0, 4).map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                          {i + 1}
                        </span>
                        <span className="flex-1">{ex.name}</span>
                        <span className="opacity-70 text-xs">{ex.reps ?? `${ex.duration}s`}</span>
                      </div>
                    ))}
                    {todaysWorkout.exercises.length > 4 && (
                      <p className="text-xs opacity-70 pl-7">
                        + {todaysWorkout.exercises.length - 4} more exercises
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => setActivePlayer(todaysWorkout)}
                    disabled={completedToday}
                    className="bg-white text-gray-900 hover:bg-white/90 font-semibold"
                  >
                    {completedToday ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Completed Today
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" /> Start Workout
                      </>
                    )}
                  </Button>
                  <div className="flex flex-wrap gap-1.5">
                    {todaysWorkout.muscleGroups.map((m) => (
                      <Badge key={m} className="bg-white/15 text-white border-0 text-xs backdrop-blur">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Alternative workout card */}
          <motion.div variants={itemVariants}>
            <Card className="h-full border-orange-200/50 dark:border-orange-900/30 bg-white/60 dark:bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-muted-foreground">Alternative Option</CardTitle>
                  <Badge variant="outline" className="text-xs">Swap</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={cn('rounded-2xl bg-gradient-to-br p-4 text-white', alternativeWorkout.gradient)}>
                  <alternativeWorkout.icon className="h-7 w-7 mb-2" />
                  <h4 className="font-semibold text-lg leading-tight">{alternativeWorkout.name}</h4>
                  <p className="text-sm text-white/80 mt-1 line-clamp-2">{alternativeWorkout.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="font-bold text-sm">{alternativeWorkout.duration}</div>
                    <div className="text-muted-foreground">min</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="font-bold text-sm">{alternativeWorkout.calories}</div>
                    <div className="text-muted-foreground">kcal</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="font-bold text-sm">{alternativeWorkout.intensity.split('-')[0]}</div>
                    <div className="text-muted-foreground">level</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                  onClick={() => setActivePlayer(alternativeWorkout)}
                >
                  Start Alternative
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── 3. Cycle-Synced Workout Plan ─── */}
      <motion.section variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Cycle-Synced Workout Plan
          </h2>
          <span className="text-xs text-muted-foreground">Tap a phase to expand routines</span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PHASE_PLANS.map((plan) => {
            const isActive = currentPhase === plan.id
            const isExpanded = expandedPhase === plan.id
            const Icon = plan.icon
            return (
              <motion.div key={plan.id} variants={itemVariants}>
                <Card
                  className={cn(
                    'overflow-hidden border-2 transition-all cursor-pointer backdrop-blur-sm bg-white/60 dark:bg-card/60',
                    isActive ? plan.borderColor : 'border-transparent',
                    isExpanded && 'ring-2 ring-offset-2 ring-offset-background'
                  )}
                  onClick={() => {
                    setExpandedPhase(isExpanded ? null : plan.id)
                    setCurrentPhase(plan.id)
                  }}
                >
                  <div className={cn('bg-gradient-to-r p-5 text-white', plan.gradient)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-5 w-5" />
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                        </div>
                        <p className="text-white/90 text-sm">{plan.subtitle} · {plan.days}</p>
                      </div>
                      {isActive && (
                        <Badge className="bg-white/25 text-white border-0 backdrop-blur">Current</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-white/20 text-white border-0 backdrop-blur text-xs">
                        <Clock className="h-3 w-3 mr-1" /> {plan.duration}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-0 backdrop-blur text-xs">
                        <Zap className="h-3 w-3 mr-1" /> {plan.intensity}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-3">
                    <p className="text-sm text-muted-foreground">{plan.hormoneContext}</p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Recommended
                        </p>
                        <ul className="space-y-1">
                          {plan.recommended.map((r) => (
                            <li key={r} className="text-muted-foreground text-xs flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5">•</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">
                          <X className="h-3 w-3" /> Avoid
                        </p>
                        <ul className="space-y-1">
                          {plan.avoid.map((a) => (
                            <li key={a} className="text-muted-foreground text-xs flex items-start gap-1">
                              <span className="text-red-500 mt-0.5">•</span> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <Separator className="my-2" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Sample Routines
                          </p>
                          <div className="space-y-2">
                            {plan.routines.map((r, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'rounded-xl p-3 border bg-gradient-to-br',
                                  plan.bgGradient,
                                  plan.borderColor
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">{r.name}</p>
                                  <Badge variant="outline" className="text-xs">{r.duration}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{r.focus}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {r.exercises.map((e) => (
                                    <span
                                      key={e}
                                      className={cn(
                                        'text-[10px] px-1.5 py-0.5 rounded-md',
                                        plan.badgeColor
                                      )}
                                    >
                                      {e}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedPhase(isExpanded ? null : plan.id)
                      }}
                    >
                      {isExpanded ? 'Hide routines' : 'Show routines'}
                      <ChevronDown className={cn('h-3 w-3 ml-1 transition-transform', isExpanded && 'rotate-180')} />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ─── 4. Workout Library ─── */}
      <motion.section variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-orange-500" />
            Workout Library
          </h2>
          <span className="text-xs text-muted-foreground">{WORKOUT_LIBRARY.length} workouts available</span>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs value={libraryTab} onValueChange={(v) => setLibraryTab(v as WorkoutCategory)}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
              {(Object.keys(CATEGORY_META) as WorkoutCategory[]).map((cat) => {
                const meta = CATEGORY_META[cat]
                const Icon = meta.icon
                const count = WORKOUT_LIBRARY.filter((w) => w.category === cat).length
                return (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="flex flex-col items-center gap-1 py-2 data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{meta.label}</span>
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {(Object.keys(CATEGORY_META) as WorkoutCategory[]).map((cat) => {
              const workouts = WORKOUT_LIBRARY.filter((w) => w.category === cat)
              return (
                <TabsContent key={cat} value={cat} className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workouts.map((w, i) => {
                      const Icon = w.icon
                      return (
                        <motion.div
                          key={w.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: -3 }}
                        >
                          <Card className="overflow-hidden border-orange-200/40 dark:border-orange-900/30 bg-white/60 dark:bg-card/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <div className={cn('h-28 bg-gradient-to-br p-4 text-white relative', w.gradient)}>
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-white/25 text-white border-0 backdrop-blur text-xs">
                                  {w.difficulty}
                                </Badge>
                              </div>
                              <Icon className="h-10 w-10 mb-1" />
                              <p className="text-xs opacity-80 uppercase tracking-wider">
                                {CATEGORY_META[cat].label}
                              </p>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-base leading-tight">{w.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{w.description}</p>
                              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {w.duration} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <Flame className="h-3 w-3" /> {w.calories} kcal
                                </span>
                                <Badge className={cn('text-[10px] border-0 px-1.5 py-0', INTENSITY_COLORS[w.intensity])}>
                                  {w.intensity}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {w.muscleGroups.slice(0, 3).map((m) => (
                                  <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                                    {m}
                                  </span>
                                ))}
                              </div>
                              <Button
                                size="sm"
                                className="w-full mt-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white border-0"
                                onClick={() => setActivePlayer(w)}
                              >
                                <Play className="h-3 w-3 mr-1" /> Start
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </motion.div>
      </motion.section>

      {/* ─── 6. Activity Tracking ─── (placed before Goals for visual flow) ─── */}
      <motion.section variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Activity Tracking
          </h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => showToast('No workouts to sync yet — start one today!')}>
            <RefreshCw className="h-3 w-3 mr-1" /> Sync
          </Button>
        </motion.div>

        {/* Weekly calendar */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-orange-200/40 dark:border-orange-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>This Week</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {workoutsThisWeek}/7 active days · {activeDaysStreak} day streak
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {ACTIVITY_DATA.map((d, i) => (
                  <motion.div
                    key={d.day}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'rounded-xl p-3 text-center border transition-all',
                      d.completed
                        ? 'bg-gradient-to-br from-orange-500/15 to-rose-500/10 border-orange-300/50 dark:border-orange-800/50'
                        : 'bg-muted/30 border-transparent'
                    )}
                  >
                    <div className="text-xs font-medium text-muted-foreground mb-1">{d.day}</div>
                    <div className={cn(
                      'mx-auto flex h-8 w-8 items-center justify-center rounded-full mb-1',
                      d.completed ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white' : 'bg-muted-foreground/15 text-muted-foreground'
                    )}>
                      {d.completed ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">—</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {d.completed ? `${d.minutes}m` : 'Rest'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Card className="bg-gradient-to-br from-orange-500/10 to-rose-500/5 border-orange-200/40 dark:border-orange-900/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Workouts</span>
                <Dumbbell className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{workoutsThisWeek}</div>
              <div className="text-xs text-muted-foreground">this week</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/5 border-rose-200/40 dark:border-rose-900/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Total Minutes</span>
                <Clock className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold">{weeklyMinutesTotal}</div>
              <div className="text-xs text-muted-foreground">min this week</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-200/40 dark:border-amber-900/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Calories</span>
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold">{caloriesThisWeek}</div>
              <div className="text-xs text-muted-foreground">kcal burned</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-200/40 dark:border-purple-900/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Active Streak</span>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{activeDaysStreak}</div>
              <div className="text-xs text-muted-foreground">days in a row</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity chart + monthly summary */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <Card className="lg:col-span-2 bg-white/60 dark:bg-card/60 backdrop-blur-sm border-orange-200/40 dark:border-orange-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity (Last 7 Days)</CardTitle>
              <CardDescription className="text-xs">Minutes of activity per day</CardDescription>
            </CardHeader>
            <CardContent>
              {workoutsThisWeek === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center h-56">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Start your first workout to see your weekly activity chart fill in here.
                  </p>
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        cursor={{ fill: 'rgba(251,146,60,0.08)' }}
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          border: '1px solid rgba(251,146,60,0.3)',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`${value} min`, 'Activity']}
                      />
                      <Bar dataKey="minutes" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {ACTIVITY_DATA.map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={entry.completed ? '#fb923c' : 'rgba(120,120,120,0.2)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-orange-200/40 dark:border-orange-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Summary</CardTitle>
              <CardDescription className="text-xs">Last 4 weeks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MONTHLY_SUMMARY.map((w) => {
                const max = Math.max(...MONTHLY_SUMMARY.map((x) => x.minutes))
                return (
                  <div key={w.week}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{w.week}</span>
                      <span className="text-muted-foreground">{w.workouts} workouts · {w.minutes}m</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-rose-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(w.minutes / max) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                )
              })}
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly total</span>
                <span className="font-bold">
                  {MONTHLY_SUMMARY.reduce((s, w) => s + w.workouts, 0)} workouts ·{' '}
                  {MONTHLY_SUMMARY.reduce((s, w) => s + w.minutes, 0)} min
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* ─── 7. Fitness Goals ─── */}
      <motion.section variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Fitness Goals
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Goals progress */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-orange-200/40 dark:border-orange-900/30 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Weekly Targets</CardTitle>
                <CardDescription className="text-xs">Set and track your weekly goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Workouts per week */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                        <Dumbbell className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Workouts / week</p>
                        <p className="text-xs text-muted-foreground">{goals.weeklyWorkouts.current} of {goals.weeklyWorkouts.target} completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => setGoals((g) => ({ ...g, weeklyWorkouts: { ...g.weeklyWorkouts, target: Math.max(1, g.weeklyWorkouts.target - 1) } }))}
                      >
                        <span className="text-xs">−</span>
                      </Button>
                      <span className="font-semibold text-sm w-6 text-center">{goals.weeklyWorkouts.target}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => setGoals((g) => ({ ...g, weeklyWorkouts: { ...g.weeklyWorkouts, target: Math.min(14, g.weeklyWorkouts.target + 1) } }))}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={goalPct(goals.weeklyWorkouts.current, goals.weeklyWorkouts.target)} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-rose-500" />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{goalPct(goals.weeklyWorkouts.current, goals.weeklyWorkouts.target)}%</p>
                </div>

                {/* Minutes per week */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Active minutes / week</p>
                        <p className="text-xs text-muted-foreground">{goals.weeklyMinutes.current} of {goals.weeklyMinutes.target} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setGoals((g) => ({ ...g, weeklyMinutes: { ...g.weeklyMinutes, target: Math.max(30, g.weeklyMinutes.target - 15) } }))}>
                        <span className="text-xs">−</span>
                      </Button>
                      <span className="font-semibold text-sm w-10 text-center">{goals.weeklyMinutes.target}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setGoals((g) => ({ ...g, weeklyMinutes: { ...g.weeklyMinutes, target: Math.min(600, g.weeklyMinutes.target + 15) } }))}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={goalPct(goals.weeklyMinutes.current, goals.weeklyMinutes.target)} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:to-pink-500" />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{goalPct(goals.weeklyMinutes.current, goals.weeklyMinutes.target)}%</p>
                </div>

                {/* Calories to burn */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <Flame className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Calories to burn / week</p>
                        <p className="text-xs text-muted-foreground">{goals.weeklyCalories.current} of {goals.weeklyCalories.target} kcal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setGoals((g) => ({ ...g, weeklyCalories: { ...g.weeklyCalories, target: Math.max(500, g.weeklyCalories.target - 100) } }))}>
                        <span className="text-xs">−</span>
                      </Button>
                      <span className="font-semibold text-sm w-12 text-center">{goals.weeklyCalories.target}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setGoals((g) => ({ ...g, weeklyCalories: { ...g.weeklyCalories, target: Math.min(5000, g.weeklyCalories.target + 100) } }))}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={goalPct(goals.weeklyCalories.current, goals.weeklyCalories.target)} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{goalPct(goals.weeklyCalories.current, goals.weeklyCalories.target)}%</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-orange-200/40 dark:border-orange-900/30 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Achievement Badges
                </CardTitle>
                <CardDescription className="text-xs">
                  {ACHIEVEMENTS.filter((a) => a.unlocked).length} of {ACHIEVEMENTS.length} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-72 pr-3">
                  <div className="grid grid-cols-2 gap-3">
                    {ACHIEVEMENTS.map((a, i) => {
                      const Icon = a.icon
                      return (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className={cn(
                            'rounded-2xl p-3 border transition-all',
                            a.unlocked
                              ? 'bg-white dark:bg-card border-orange-200/60 dark:border-orange-900/40 shadow-sm'
                              : 'bg-muted/30 border-transparent opacity-60'
                          )}
                        >
                          <div className={cn(
                            'mx-auto h-10 w-10 rounded-full flex items-center justify-center mb-2',
                            a.unlocked ? cn('bg-gradient-to-br text-white', a.color) : 'bg-muted'
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-semibold text-center leading-tight">{a.name}</p>
                          <p className="text-[10px] text-muted-foreground text-center mt-0.5 line-clamp-2">{a.description}</p>
                          {!a.unlocked && a.progress !== undefined && (
                            <div className="mt-1.5">
                              <Progress value={a.progress} className="h-1 [&>div]:bg-orange-500" />
                              <p className="text-[9px] text-muted-foreground text-center mt-0.5">{a.progress}%</p>
                            </div>
                          )}
                          {a.unlocked && (
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Unlocked</span>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── 8. Exercise Database ─── */}
      <motion.section variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-orange-500" />
            Exercise Database
          </h2>
          <span className="text-xs text-muted-foreground">{filteredExercises.length} of {EXERCISE_DATABASE.length} exercises</span>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-orange-200/40 dark:border-orange-900/30">
            <CardContent className="p-4 space-y-3">
              {/* Search + filters */}
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-background"
                  />
                </div>
                <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                  <SelectTrigger className="w-full md:w-44 bg-background">
                    <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Muscle group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All muscles</SelectItem>
                    {muscleGroups.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterEquipment} onValueChange={setFilterEquipment}>
                  <SelectTrigger className="w-full md:w-40 bg-background">
                    <SelectValue placeholder="Equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All equipment</SelectItem>
                    {equipmentTypes.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-full md:w-40 bg-background">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || filterMuscle !== 'all' || filterEquipment !== 'all' || filterDifficulty !== 'all') && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-muted-foreground">Active filters:</span>
                  {search && (
                    <Badge variant="secondary" className="gap-1">
                      &quot;{search}&quot;
                      <button onClick={() => setSearch('')}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {filterMuscle !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filterMuscle}
                      <button onClick={() => setFilterMuscle('all')}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {filterEquipment !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filterEquipment}
                      <button onClick={() => setFilterEquipment('all')}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {filterDifficulty !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      {filterDifficulty}
                      <button onClick={() => setFilterDifficulty('all')}><X className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => { setSearch(''); setFilterMuscle('all'); setFilterEquipment('all'); setFilterDifficulty('all') }}
                  >
                    Clear all
                  </Button>
                </div>
              )}

              {/* Exercise list */}
              <ScrollArea className="max-h-[600px] pr-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {filteredExercises.map((ex, i) => (
                      <motion.div
                        key={ex.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className="rounded-xl border border-orange-200/40 dark:border-orange-900/30 bg-white/70 dark:bg-card/60 p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-sm leading-tight">{ex.name}</h4>
                          <Badge className={cn('text-[10px] border-0 px-1.5 py-0', DIFFICULTY_COLORS[ex.difficulty])}>
                            {ex.difficulty}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <Dumbbell className="h-2.5 w-2.5 mr-1" /> {ex.muscleGroup}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {ex.equipment}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{ex.instructions}</p>
                        <div className="mt-2 rounded-lg bg-orange-500/5 dark:bg-orange-500/10 border border-orange-200/40 dark:border-orange-800/30 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-orange-600 dark:text-orange-400 font-semibold mb-0.5 flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" /> Tip
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{ex.tips}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {filteredExercises.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No exercises match your filters.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => { setSearch(''); setFilterMuscle('all'); setFilterEquipment('all'); setFilterDifficulty('all') }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* ─── Workout Player Modal ─── */}
      <AnimatePresence>
        {activePlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WorkoutPlayer
              workout={activePlayer}
              onClose={handlePlayerClose}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Toast ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-[200] flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-white shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
