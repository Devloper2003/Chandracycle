export { PRICING, isPremiumModule, canAccessModule, BASIC_MODULES, PREMIUM_MODULES } from '@/lib/store'
import type { ActiveModule } from '@/lib/store'
import { PREMIUM_MODULES } from '@/lib/store'

// ─── Pricing helpers (₹ + 18% GST) ───────────────────────────────────────────
export const MONTHLY = {
  base: 50,
  gstRate: 0.18,
  get gst() {
    return Math.round(this.base * this.gstRate)
  },
  get total() {
    return this.base + this.gst
  },
}

export const YEARLY = {
  base: 500,
  gstRate: 0.18,
  get gst() {
    return Math.round(this.base * this.gstRate)
  },
  get total() {
    return this.base + this.gst
  },
}

export const TRIAL_DAYS = 7

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

// What a user gets on each tier
export const BASIC_FEATURES = [
  'Period tracking & calendar',
  'Daily symptom logging',
  'Basic mood tracking',
  'Community access',
  '7-day health history',
  '1 reminder per day',
]

export const PREMIUM_FEATURES = [
  'Everything in Basic, plus:',
  'AI Health Coach (unlimited chats)',
  'AI Diet Advisor with meal plans',
  'Hormone Intelligence dashboard',
  'PCOS management & risk scoring',
  'Fertility planner & ovulation AI',
  'Pregnancy companion (week-by-week)',
  'Menopause assistant',
  'Mental wellness & meditation library',
  'Cycle-synced fitness workouts',
  'Skin & beauty tracker',
  'Wellness marketplace (member pricing)',
  'Advanced AI insights & predictions',
  'Doctor finder & telehealth booking',
  'Unlimited history & exports',
  'Priority support',
]

export function tierForModule(module: ActiveModule): 'basic' | 'premium' {
  return PREMIUM_MODULES.includes(module) ? 'premium' : 'basic'
}
