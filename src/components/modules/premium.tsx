'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown,
  Sparkles,
  Check,
  X,
  Star,
  Shield,
  Lock,
  Brain,
  TrendingUp,
  Salad,
  Dumbbell,
  Moon,
  Sparkle,
  Stethoscope,
  FileBarChart,
  Ban,
  Headphones,
  Heart,
  Quote,
  ChevronDown,
  Award,
  Users,
  Zap,
  Gem,
  ArrowRight,
  Gift,
  CreditCard,
  RefreshCcw,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import PaypalCheckoutModal from '@/components/premium/paypal-checkout-modal'

// ─── Types ──────────────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'yearly'

interface Plan {
  id: 'free' | 'premium' | 'plus'
  name: string
  tagline: string
  monthlyPrice: number
  yearlyPrice: number
  icon: React.ElementType
  gradient: string
  borderColor: string
  badgeText?: string
  isPopular?: boolean
  features: { text: string; included: boolean }[]
  cta: string
}

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ElementType
  gradient: string
}

interface FAQItem {
  id: string
  question: string
  answer: string
}

// ─── Data ───────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Start your wellness journey',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Heart,
    gradient: 'from-slate-400 to-slate-600',
    borderColor: 'border-slate-200 dark:border-slate-800',
    cta: 'Current Plan',
    features: [
      { text: 'Basic period tracking', included: true },
      { text: 'Mood & symptom logging', included: true },
      { text: 'Community access', included: true },
      { text: '7-day history', included: true },
      { text: 'AI Health Coach (3 msgs/day)', included: false },
      { text: 'Hormone Intelligence', included: false },
      { text: 'Advanced predictions', included: false },
      { text: 'Unlimited reports', included: false },
      { text: 'Ad-free experience', included: false },
      { text: 'Doctor consultations', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Unlock AI-powered insights',
    monthlyPrice: 299,
    yearlyPrice: 2499,
    icon: Crown,
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    borderColor: 'border-amber-400 dark:border-amber-600',
    badgeText: 'Most Popular',
    isPopular: true,
    cta: 'Choose Premium',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'AI Health Coach (unlimited)', included: true },
      { text: 'Hormone Intelligence', included: true },
      { text: 'Advanced cycle & fertility predictions', included: true },
      { text: 'Unlimited reports & exports', included: true },
      { text: 'Skin & Beauty tracker', included: true },
      { text: 'Ad-free experience', included: true },
      { text: 'Meditation library', included: true },
      { text: 'Specialist consultations', included: false },
      { text: 'Personalized diet & workout plans', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Premium Plus',
    tagline: 'Complete health ecosystem',
    monthlyPrice: 599,
    yearlyPrice: 4999,
    icon: Gem,
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    borderColor: 'border-fuchsia-300 dark:border-fuchsia-700',
    cta: 'Choose Premium Plus',
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Telehealth & video consults', included: true },
      { text: 'Specialist consultations (4/month)', included: true },
      { text: 'Personalized diet plans', included: true },
      { text: 'Custom workout programs', included: true },
      { text: 'Priority 24/7 support', included: true },
      { text: 'Lab report analysis', included: true },
      { text: 'Family sharing (up to 3)', included: true },
      { text: 'Wearable device integration', included: true },
      { text: 'Quarterly health reviews', included: true },
    ],
  },
]

const FEATURES: Feature[] = [
  { id: 'f1', title: 'AI Health Coach', description: 'Unlimited 24/7 personalized guidance from your AI companion', icon: Brain, gradient: 'from-rose-400 to-pink-500' },
  { id: 'f2', title: 'Advanced Hormone Predictions', description: 'Forecast your cycle, mood, and symptoms with 95% accuracy', icon: TrendingUp, gradient: 'from-amber-400 to-orange-500' },
  { id: 'f3', title: 'Personalized Diet Plans', description: 'Custom nutrition plans synced to your cycle & conditions', icon: Salad, gradient: 'from-emerald-400 to-teal-500' },
  { id: 'f4', title: 'Cycle-Synced Workouts', description: 'Exercise routines that adapt to your hormone phases', icon: Dumbbell, gradient: 'from-purple-400 to-violet-500' },
  { id: 'f5', title: 'Meditation Library', description: '200+ guided sessions for stress, sleep, and hormonal balance', icon: Moon, gradient: 'from-indigo-400 to-blue-500' },
  { id: 'f6', title: 'Skin & Beauty Tracking', description: 'AI-powered acne tracking with cycle correlation insights', icon: Sparkle, gradient: 'from-fuchsia-400 to-pink-500' },
  { id: 'f7', title: 'Doctor Consultations', description: 'Video consults with verified gynecologists & specialists', icon: Stethoscope, gradient: 'from-teal-400 to-cyan-500' },
  { id: 'f8', title: 'Advanced Reports', description: 'Comprehensive health reports you can share with your doctor', icon: FileBarChart, gradient: 'from-sky-400 to-blue-500' },
  { id: 'f9', title: 'Ad-Free Experience', description: 'Enjoy an uninterrupted, distraction-free wellness journey', icon: Ban, gradient: 'from-slate-400 to-gray-500' },
  { id: 'f10', title: 'Priority Support', description: '24/7 dedicated support with average 2-minute response', icon: Headphones, gradient: 'from-rose-400 to-red-500' },
]

// NOTE: Demo / placeholder testimonials were removed so the marketing page no
// longer shows fabricated member names, ages, locations, or quotes. When real
// customer testimonials are collected (with consent), populate this array from
// the API and the Testimonials section below will render them.
const TESTIMONIALS: {
  id: string
  name: string
  age: number
  location: string
  avatar: string
  initials: string
  rating: number
  quote: string
  condition: string
  plan: string
}[] = []

const FAQS: FAQItem[] = [
  {
    id: 'faq1',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Absolutely. You can cancel anytime from Settings → Subscription. You\'ll keep access to premium features until the end of your billing period, and your account automatically reverts to the Free plan after that — no questions asked, no cancellation fees.',
  },
  {
    id: 'faq2',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, RuPay, American Express), UPI (Google Pay, PhonePe, Paytm), net banking from 50+ Indian banks, and Apple Pay / Google Pay. Annual plans can also be paid via EMI on select cards.',
  },
  {
    id: 'faq3',
    question: 'Is my health data secure and private?',
    answer: 'Your privacy is our top priority. All data is encrypted end-to-end (AES-256) in transit and at rest. We are HIPAA-compliant, GDPR-compliant, and ISO 27001 certified. We never sell your data to third parties, and you can export or delete all your data anytime.',
  },
  {
    id: 'faq4',
    question: 'Can I share my subscription with family?',
    answer: 'Premium Plus subscribers can share their plan with up to 2 additional family members (total 3 users). Each member gets their own private account with separate data — only the subscription is shared. Premium and Free plans are per-user only.',
  },
  {
    id: 'faq5',
    question: 'What\'s the difference between Premium and Premium Plus?',
    answer: 'Premium gives you full access to AI features, predictions, reports, and ad-free experience. Premium Plus adds telehealth (video consults with verified doctors), 4 specialist consultations per month, personalized diet & workout plans, lab report analysis, family sharing, and priority support — essentially a complete health ecosystem with human experts.',
  },
  {
    id: 'faq6',
    question: 'What is your refund policy?',
    answer: 'We offer a 7-day money-back guarantee on all annual plans. If you\'re not satisfied within the first 7 days, contact support for a full refund — no questions asked. Monthly plans are non-refundable once the billing cycle starts, but you can cancel anytime to prevent renewal.',
  },
]

const TRUST_BADGES = [
  { id: 'b1', label: 'HIPAA Compliant', icon: Shield, description: 'US health privacy standards' },
  { id: 'b2', label: 'GDPR Certified', icon: Lock, description: 'EU data protection' },
  { id: 'b3', label: 'End-to-End Encrypted', icon: Lock, description: 'AES-256 encryption' },
  { id: 'b4', label: 'ISO 27001', icon: Award, description: 'Info security certified' },
  { id: 'b5', label: 'DPDP Act 2023', icon: Shield, description: 'India data protection' },
  { id: 'b6', label: 'SOC 2 Type II', icon: Check, description: 'Audited security' },
]

// ─── Plan Card Component ────────────────────────────────────────────────────

function PlanCard({ plan, billingCycle, onChoosePlan }: { plan: Plan; billingCycle: BillingCycle; onChoosePlan: (plan: Plan) => void }) {
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  const isFree = plan.id === 'free'
  const isCurrentPlan = plan.id === 'free' // Assume user is on free for now
  const yearlyPerMonth = plan.yearlyPrice / 12
  const savings = plan.monthlyPrice > 0 && plan.yearlyPrice > 0
    ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className={cn('relative', plan.isPopular && 'lg:-mt-4 lg:mb-0')}
    >
      <Card className={cn(
        'relative h-full overflow-hidden transition-all',
        plan.isPopular
          ? 'border-amber-400 dark:border-amber-600 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/50'
          : plan.borderColor
      )}>
        {/* Popular badge */}
        {plan.isPopular && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
              <Sparkles className="h-3 w-3" />
              {plan.badgeText}
            </div>
          </div>
        )}

        {/* Gradient top */}
        <div className={cn('h-2 bg-gradient-to-r', plan.gradient)} />

        <CardHeader className="pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md', plan.gradient)}>
              <plan.icon className="h-5 w-5" />
            </div>
            {savings > 0 && billingCycle === 'yearly' && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1">
                <Gift className="h-3 w-3" /> Save {savings}%
              </Badge>
            )}
          </div>
          <div className="mt-2">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>{plan.tagline}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Price */}
          <div className="mb-4">
            {isFree ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-sm text-muted-foreground">forever</span>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹{price.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Just ₹{yearlyPerMonth.toFixed(0)}/month · billed annually
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator className="mb-4" />

          {/* Features */}
          <ul className="space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2.5">
                <div className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full shrink-0 mt-0.5',
                  feature.included
                    ? plan.isPopular ? 'bg-amber-100 dark:bg-amber-950/50' : 'bg-emerald-100 dark:bg-emerald-950/40'
                    : 'bg-muted/50'
                )}>
                  {feature.included ? (
                    <Check className={cn('h-3 w-3', plan.isPopular ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')} />
                  ) : (
                    <X className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
                <span className={cn(
                  'text-sm leading-snug',
                  feature.included ? 'text-foreground' : 'text-muted-foreground/60 line-through'
                )}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            className={cn(
              'w-full',
              isCurrentPlan
                ? 'bg-muted text-muted-foreground'
                : plan.isPopular
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:opacity-90 text-white shadow-md shadow-amber-500/30'
                : plan.id === 'plus'
                ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:opacity-90 text-white shadow-md shadow-fuchsia-500/30'
                : 'bg-foreground text-background hover:bg-foreground/90'
            )}
            disabled={isCurrentPlan}
            onClick={() => {
              if (isCurrentPlan) return
              onChoosePlan(plan)
            }}
          >
            {isCurrentPlan ? (
              <>
                <Check className="h-4 w-4 mr-1.5" /> Current Plan
              </>
            ) : (
              <>
                {plan.cta}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// ─── Main Module ────────────────────────────────────────────────────────────

export default function PremiumModule({ onSubscribe }: { onSubscribe: () => void }) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)
  const premiumPlan = PLANS.find(p => p.id === 'premium')

  return (
    <div className="min-h-screen">
      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-3xl mb-8"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/40 via-fuchsia-500/30 to-pink-500/40" />

        {/* Decorative blurs */}
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-yellow-300/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-purple-400/40 blur-3xl" />

        <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center text-white">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-sm font-semibold mb-5 border border-white/30"
          >
            <Crown className="h-4 w-4" />
            ChandraCycle Premium
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 drop-shadow-lg"
          >
            Unlock Your Full<br />Health Potential
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Transform your wellbeing with AI-powered cycle intelligence, hormone predictions, and 24/7 expert care.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/90"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              AI-powered cycle intelligence
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              Built for every phase of your journey
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              HIPAA secured
            </span>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Plan Comparison ───────────────────────────────────────── */}
      <section className="mb-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-muted-foreground text-sm">Cancel anytime · 7-day money-back guarantee on annual plans</p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted/60 border border-border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all',
                billingCycle === 'monthly' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                billingCycle === 'yearly' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              Yearly
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] h-4 px-1.5">
                Save 30%
              </Badge>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl mx-auto pt-6">
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} billingCycle={billingCycle} onChoosePlan={setCheckoutPlan} />
          ))}
        </div>
      </section>

      {/* ─── Feature Showcase ──────────────────────────────────────── */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-2 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Zap className="h-3 w-3 mr-1" /> Premium Features
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Everything You Need to Thrive</h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            A complete women's health ecosystem powered by AI, doctors, and evidence-based science.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm mb-3', feature.gradient)}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────── */}
      {/* Section intentionally hidden when TESTIMONIALS is empty (no fabricated
          member names / quotes / ages / locations). Restores automatically once
          real, consented testimonials are loaded from the API. */}
      {TESTIMONIALS.length > 0 && (
      <section className="mb-12">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-2 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <Heart className="h-3 w-3 mr-1" /> Loved by Thousands
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Stories From Our Community</h2>
          <p className="text-muted-foreground text-sm">Real women, real transformations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col h-full">
                  <Quote className="h-7 w-7 text-amber-400/60 mb-2" />
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={cn('h-3.5 w-3.5', i <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1 italic">"{t.quote}"</p>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-amber-200 dark:border-amber-800">
                      <AvatarFallback className={cn('text-xs font-semibold bg-gradient-to-br text-white', t.plan === 'Premium Plus' ? 'from-purple-500 to-fuchsia-500' : 'from-amber-400 to-orange-500')}>
                        {t.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{t.name}</span>
                        <Badge variant="secondary" className={cn('text-[9px] h-4 px-1.5 gap-0.5', t.plan === 'Premium Plus' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300')}>
                          <Crown className="h-2.5 w-2.5" /> {t.plan}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.age} · {t.location} · {t.condition}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
      )}

      {/* ─── FAQ ───────────────────────────────────────────────────── */}
      <section className="mb-12 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-2 bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            <Sparkles className="h-3 w-3 mr-1" /> Got Questions?
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">Frequently Asked Questions</h2>
        </div>

        <Card>
          <CardContent className="p-2">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map(faq => (
                <AccordionItem key={faq.id} value={faq.id} className="border-b last:border-0">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline px-3 py-3 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed px-3 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* ─── Trust Badges ──────────────────────────────────────────── */}
      <section className="mb-8">
        <Card className="overflow-hidden border-amber-200/60 dark:border-amber-900/40">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
            <CardContent className="p-5">
              <div className="text-center mb-4">
                <h3 className="text-base font-semibold flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Your Health Data is Protected
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Industry-leading security & compliance standards</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {TRUST_BADGES.map(badge => (
                  <div key={badge.id} className="flex flex-col items-center text-center p-3 rounded-lg bg-card/60 border border-border/50 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-2">
                      <badge.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold leading-tight">{badge.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        </Card>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl mb-4"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600" />
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-yellow-400/30 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-400/30 blur-3xl" />

        <div className="relative z-10 p-8 sm:p-10 text-center text-white">
          <Crown className="h-10 w-10 mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ready to Transform Your Health?</h2>
          <p className="text-white/90 max-w-xl mx-auto mb-5 text-sm sm:text-base">
            Join thousands of women who took control of their wellness journey. Start your 7-day money-back guarantee today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => {
                if (premiumPlan) setCheckoutPlan(premiumPlan)
              }}
              className="bg-white text-purple-700 hover:bg-white/90 font-semibold"
            >
              <Crown className="h-4 w-4 mr-2" /> Get Premium Now
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              <RefreshCcw className="h-3.5 w-3.5" /> 7-day money-back guarantee
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── PayPal Checkout Modal ───────────────────────────────────── */}
      {checkoutPlan && (
        <PaypalCheckoutModal
          plan={checkoutPlan}
          billingCycle={billingCycle}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => {
            onSubscribe()
            setCheckoutPlan(null)
          }}
        />
      )}
    </div>
  )
}
