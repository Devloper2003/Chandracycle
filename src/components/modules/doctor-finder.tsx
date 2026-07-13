'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  MapPin,
  Stethoscope,
  Star,
  Phone,
  Video,
  Calendar as CalendarIcon,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  User,
  Award,
  Languages,
  Navigation,
  Heart,
  Activity,
  Brain,
  Baby,
  Sparkles,
  Zap,
  Loader2,
  Siren,
  Eye,
  Droplet,
  Thermometer,
  Pill,
  Hospital,
  CircleDollarSign,
  Frown,
  Flame,
  Utensils,
  HandHeart,
  Crosshair,
  ExternalLink,
  Globe,
  ChevronRight,
  MapPinned,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Specialty =
  | 'Gynecologist'
  | 'Fertility Specialist'
  | 'Obstetrician'
  | 'Endocrinologist'
  | 'Nutritionist'
  | 'Dermatologist'
  | 'Mental Health Counselor'
  | 'General Physician'
  | 'Urologist'

type Severity = 'Mild' | 'Moderate' | 'Severe'

interface Doctor {
  id: string
  name: string
  specialty: Specialty
  qualifications: string
  experience: number
  rating: number
  reviews: number
  clinic: string
  address: string
  city: string
  area?: string
  distance: number
  fee: number
  nextSlotDay: 'Today' | 'Tomorrow' | 'Day After'
  nextSlotTime: string
  languages: string[]
  gender: 'Female' | 'Male'
  availableToday: boolean
  videoConsult: boolean
  onlineNow: boolean
  // Google Places powered fields
  openNow?: boolean | null
  phone?: string | null
  placeId?: string | null
  mapsUrl?: string
  website?: string | null
  lat?: number | null
  lng?: number | null
  types?: string[]
  photoUrl?: string | null
  source?: 'google' | 'empty'
}

interface AreaSuggestion {
  description: string
  mainText: string
  secondaryText: string
}

// ─── Helper: debounce ─────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

// ─── Specialty Metadata ───────────────────────────────────────────────────────

interface SpecialtyMeta {
  id: Specialty
  label: string
  shortLabel: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}

const SPECIALTIES: SpecialtyMeta[] = [
  {
    id: 'Gynecologist',
    label: 'Gynecologist',
    shortLabel: 'Gynecologist',
    description: 'Period issues, PCOS, irregular cycles',
    icon: Stethoscope,
    color: '#0d9488',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800',
    textColor: 'text-teal-700 dark:text-teal-300',
  },
  {
    id: 'Fertility Specialist',
    label: 'Fertility Specialist',
    shortLabel: 'Fertility',
    description: 'Conception, IVF, fertility tracking',
    icon: Baby,
    color: '#0891b2',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    textColor: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    id: 'Obstetrician',
    label: 'Obstetrician',
    shortLabel: 'Obstetrician',
    description: 'Pregnancy care, prenatal',
    icon: Heart,
    color: '#be123c',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
    textColor: 'text-rose-700 dark:text-rose-300',
  },
  {
    id: 'Endocrinologist',
    label: 'Endocrinologist',
    shortLabel: 'Endocrine',
    description: 'Hormone issues, thyroid, PCOS',
    icon: Activity,
    color: '#7c3aed',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    textColor: 'text-violet-700 dark:text-violet-300',
  },
  {
    id: 'Nutritionist',
    label: 'Nutritionist/Dietitian',
    shortLabel: 'Nutritionist',
    description: 'Diet, weight management',
    icon: Utensils,
    color: '#16a34a',
    bgColor: 'bg-green-50 dark:bg-green-950/40',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300',
  },
  {
    id: 'Dermatologist',
    label: 'Dermatologist',
    shortLabel: 'Dermatologist',
    description: 'Acne, skin issues related to hormones',
    icon: Sparkles,
    color: '#db2777',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40',
    borderColor: 'border-pink-200 dark:border-pink-800',
    textColor: 'text-pink-700 dark:text-pink-300',
  },
  {
    id: 'Mental Health Counselor',
    label: 'Mental Health Counselor',
    shortLabel: 'Mental Health',
    description: 'Anxiety, depression, mood',
    icon: Brain,
    color: '#2563eb',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-800',
    textColor: 'text-sky-700 dark:text-sky-300',
  },
  {
    id: 'General Physician',
    label: 'General Physician',
    shortLabel: 'General Physician',
    description: 'General health',
    icon: Stethoscope,
    color: '#475569',
    bgColor: 'bg-slate-50 dark:bg-slate-950/40',
    borderColor: 'border-slate-200 dark:border-slate-800',
    textColor: 'text-slate-700 dark:text-slate-300',
  },
  {
    id: 'Urologist',
    label: 'Urologist',
    shortLabel: 'Urologist',
    description: 'Urinary issues',
    icon: Droplet,
    color: '#0284c7',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    textColor: 'text-cyan-700 dark:text-cyan-300',
  },
]

const SPECIALTY_MAP: Record<Specialty, SpecialtyMeta> = SPECIALTIES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<Specialty, SpecialtyMeta>
)

// ─── Health Concern Guide ─────────────────────────────────────────────────────

interface GuideEntry {
  specialty: Specialty
  whenToSee: string
  icon: React.ElementType
}

const SPECIALTY_GUIDE: GuideEntry[] = [
  {
    specialty: 'Gynecologist',
    whenToSee: 'Irregular periods, severe cramps, abnormal bleeding, pelvic pain, or routine annual check-ups.',
    icon: Stethoscope,
  },
  {
    specialty: 'Fertility Specialist',
    whenToSee: 'Trying to conceive for 12+ months (6+ months if over 35), PCOS with fertility concerns, or recurrent pregnancy loss.',
    icon: Baby,
  },
  {
    specialty: 'Endocrinologist',
    whenToSee: 'Hormone imbalances, thyroid issues (hypo/hyper), severe PCOS resistant to first-line treatment, or diabetes management.',
    icon: Activity,
  },
  {
    specialty: 'Obstetrician',
    whenToSee: 'Confirmed or suspected pregnancy, prenatal care, high-risk pregnancy monitoring, or postpartum follow-up.',
    icon: Heart,
  },
  {
    specialty: 'Mental Health Counselor',
    whenToSee: 'Persistent anxiety, low mood, mood swings affecting daily life, PMS/PMDD symptoms, or postpartum depression.',
    icon: Brain,
  },
  {
    specialty: 'Nutritionist',
    whenToSee: 'PCOS diet planning, weight management, gestational diabetes, or eating concerns tied to cycle changes.',
    icon: Utensils,
  },
]

const RED_FLAG_SYMPTOMS = [
  { text: 'Severe pelvic pain that doesn\'t subside', icon: Frown },
  { text: 'Heavy bleeding — soaking a pad in 1 hour', icon: Droplet },
  { text: 'Missed period with severe abdominal pain', icon: AlertTriangle },
  { text: 'Fever (≥101°F) with pelvic symptoms', icon: Thermometer },
  { text: 'Sudden severe headache, worse than usual', icon: Zap },
  { text: 'Vision changes, blurriness, or flashing lights', icon: Eye },
]

// ─── Time Slots for Booking ───────────────────────────────────────────────────

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
]

// ─── Severity Config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string; ring: string; dot: string }> = {
  Mild: {
    label: 'Mild',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-700',
    ring: 'ring-emerald-500',
    dot: 'bg-emerald-500',
  },
  Moderate: {
    label: 'Moderate',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-700',
    ring: 'ring-amber-500',
    dot: 'bg-amber-500',
  },
  Severe: {
    label: 'Severe',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-300 dark:border-rose-700',
    ring: 'ring-rose-500',
    dot: 'bg-rose-500',
  },
}

// ─── Helper: Avatar Gradient ──────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-green-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-cyan-500 to-teal-600',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function getInitials(name: string): string {
  const parts = name.replace(/^Dr\.\s*/i, '').split(' ')
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

// ─── Sub-component: Star Rating ───────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < full
        const isHalf = i === full && hasHalf
        return (
          <Star
            key={i}
            className={cn(
              'h-3.5 w-3.5',
              isFull || isHalf
                ? 'fill-amber-400 text-amber-400'
                : 'fill-muted text-muted-foreground/40'
            )}
          />
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DoctorFinderModule() {
  // Search state
  const [location, setLocation] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
  const [severity, setSeverity] = useState<Severity | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchSource, setSearchSource] = useState<'google' | 'empty' | null>(null)
  const [searchedLocation, setSearchedLocation] = useState('')

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AreaSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locating, setLocating] = useState(false)
  const suggestionsRef = React.useRef<HTMLDivElement | null>(null)
  // AbortController ref so rapid typing cancels stale geocode requests
  const suggestionsAbortRef = React.useRef<AbortController | null>(null)

  // Filter & sort state
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'experience' | 'fee'>('distance')
  const [filterToday, setFilterToday] = useState(false)
  const [filterVideo, setFilterVideo] = useState(false)
  const [filterFemale, setFilterFemale] = useState(false)
  const [filterOpenNow, setFilterOpenNow] = useState(false)
  const [maxFee, setMaxFee] = useState<'any' | '500' | '800' | '1200'>('any')

  // Booking dialog state
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined)
  const [bookingTime, setBookingTime] = useState<string>('')
  const [bookingReason, setBookingReason] = useState('')
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  // ─── Location autocomplete ──────────────────────────────────────────────
  const fetchSuggestions = React.useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      return
    }
    // Cancel any in-flight request so a slow earlier response can't
    // overwrite the result of a newer one (rapid-typing race condition).
    suggestionsAbortRef.current?.abort()
    const controller = new AbortController()
    suggestionsAbortRef.current = controller
    try {
      const res = await fetch(`/api/doctors/geocode?q=${encodeURIComponent(q.trim())}`, {
        signal: controller.signal,
      })
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (e: unknown) {
      // AbortError is expected when a newer keystroke supersedes this request;
      // swallow it silently. Anything else stays silent to match prior behavior.
      const name = (e as { name?: string })?.name
      if (name !== 'AbortError') {
        // silent
      }
    }
  }, [])

  const debouncedFetch = React.useRef(
    debounce((q: string) => fetchSuggestions(q), 250)
  ).current

  const handleLocationChange = (val: string) => {
    setLocation(val)
    setShowSuggestions(true)
    debouncedFetch(val)
  }

  const selectSuggestion = (s: AreaSuggestion) => {
    setLocation(s.description)
    setShowSuggestions(false)
    setSuggestions([])
  }

  // ─── Use my current location ────────────────────────────────────────────
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported on this device.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/doctors/geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          )
          if (res.ok) {
            const data = await res.json()
            setLocation(data.formatted || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
          } else {
            setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
          }
        } catch {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setSearchError('Could not access your location. Please enter it manually.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // ─── Fetch doctors from API ─────────────────────────────────────────────
  const fetchDoctors = async (loc: string, spec: Specialty | null) => {
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(false)
    setSearchedLocation(loc)
    try {
      const params = new URLSearchParams({ location: loc })
      if (spec) params.set('specialty', spec)
      const res = await fetch(`/api/doctors/search?${params.toString()}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Search failed')
      setDoctors(data.doctors || [])
      setSearchSource(data.source || null)
      setHasSearched(true)
    } catch (e: any) {
      setSearchError(e?.message || 'Something went wrong. Please try again.')
      setDoctors([])
      setHasSearched(true)
    } finally {
      setIsSearching(false)
    }
  }

  // Derived: filtered + sorted doctors
  const filteredDoctors = useMemo(() => {
    if (!hasSearched) return []
    let list = [...doctors]

    // Apply filter bar filters
    if (filterToday) list = list.filter((d) => d.availableToday)
    if (filterVideo) list = list.filter((d) => d.videoConsult)
    if (filterFemale) list = list.filter((d) => d.gender === 'Female')
    if (filterOpenNow) list = list.filter((d) => d.openNow === true)
    if (maxFee !== 'any') {
      const cap = parseInt(maxFee, 10)
      list = list.filter((d) => d.fee <= cap)
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'experience':
          return b.experience - a.experience
        case 'fee':
          return a.fee - b.fee
        case 'distance':
        default:
          return a.distance - b.distance
      }
    })

    return list
  }, [hasSearched, doctors, filterToday, filterVideo, filterFemale, filterOpenNow, maxFee, sortBy])

  // Online-now doctors for telehealth quick connect
  const onlineDoctors = useMemo(() => doctors.filter((d) => d.onlineNow).slice(0, 3), [doctors])

  const isSevere = severity === 'Severe'

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSearch = () => {
    if (!location.trim()) {
      setSearchError('Please enter your area or city to find doctors nearby.')
      return
    }
    setShowSuggestions(false)
    fetchDoctors(location.trim(), selectedSpecialty)
  }

  const handleSelectSpecialty = (s: Specialty) => {
    setSelectedSpecialty((cur) => (cur === s ? null : s))
  }

  const openBooking = (doctor: Doctor) => {
    setBookingDoctor(doctor)
    setBookingDate(undefined)
    setBookingTime('')
    setBookingReason('')
    setBookingConfirmed(false)
  }

  const closeBooking = () => {
    setBookingDoctor(null)
    setTimeout(() => setBookingConfirmed(false), 200)
  }

  const confirmBooking = () => {
    if (!bookingDate || !bookingTime) return
    setBookingConfirmed(true)
  }

  const canConfirm = bookingDate && bookingTime

  // Close suggestions on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-4">
      {/* ═══ 1. HEADER ═══ */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-500 bg-clip-text text-transparent">
                Find Your Doctor
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-0.5">
              Connect with trusted healthcare specialists near you
            </p>
          </div>
        </div>

        {/* Emergency banner */}
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3">
          <Siren className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-800 dark:text-rose-200 font-medium">
            🚨 For medical emergencies, call your local emergency number immediately
            <span className="block text-xs font-normal text-rose-700/80 dark:text-rose-300/80 mt-0.5">
              India: 108 / 112 · US: 911 · UK: 999 · EU: 112
            </span>
          </p>
        </div>
      </motion.header>

      {/* ═══ 2. SEARCH SECTION ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="border-teal-100 dark:border-teal-900/50 bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 dark:from-teal-950/20 dark:via-card dark:to-cyan-950/20 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-teal-600" />
              Search Healthcare Providers
            </CardTitle>
            <CardDescription>
              Tell us what you need and we&apos;ll find the right specialist for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Location input with autocomplete + use my location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  Your Location
                </Label>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 disabled:opacity-50 transition-colors"
                >
                  {locating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Crosshair className="h-3.5 w-3.5" />
                  )}
                  {locating ? 'Locating...' : 'Use my location'}
                </button>
              </div>
              <div className="relative" ref={suggestionsRef}>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  id="location"
                  placeholder="Enter your area or city (works for any location in India)"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                  className="pl-9 pr-9 h-11 bg-background/70"
                />
                {location && (
                  <button
                    type="button"
                    onClick={() => { setLocation(''); setSuggestions([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear location"
                  >
                    ×
                  </button>
                )}
                {/* Autocomplete dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-30 mt-1 w-full rounded-xl border border-teal-100 dark:border-teal-900/50 bg-white dark:bg-card shadow-xl overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-teal-50/50 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900/50 flex items-center gap-1">
                        <MapPinned className="h-3 w-3" /> Powered by Google Places
                      </div>
                      <ul className="max-h-64 overflow-y-auto chandracycle-scroll">
                        {suggestions.map((s, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() => selectSuggestion(s)}
                              className="w-full text-left px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors flex items-start gap-2"
                            >
                              <MapPin className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{s.mainText}</p>
                                {s.secondaryText && (
                                  <p className="text-xs text-muted-foreground truncate">{s.secondaryText}</p>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {searchError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> {searchError}
                </p>
              )}
            </div>

            {/* Specialty selector grid */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                Health Concern
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIALTIES.map((s) => {
                  const Icon = s.icon
                  const isSelected = selectedSpecialty === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSpecialty(s.id)}
                      className={cn(
                        'group flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-200',
                        isSelected
                          ? cn(s.bgColor, s.borderColor, 'shadow-md ring-2', s.ring, 'ring-offset-0')
                          : 'border-border bg-background/60 hover:bg-accent/50 hover:border-teal-200 dark:hover:border-teal-800'
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                            isSelected ? cn(s.bgColor, s.textColor) : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 ml-auto text-teal-600" />
                        )}
                      </div>
                      <span className="text-xs font-semibold leading-tight">{s.shortLabel}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                        {s.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Severity level */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-teal-600" />
                Severity Level
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev]
                  const isSelected = severity === sev
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity((cur) => (cur === sev ? null : sev))}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                        isSelected
                          ? cn(cfg.bg, cfg.border, cfg.color, 'shadow-md ring-2', cfg.ring)
                          : 'border-border bg-background/60 hover:bg-accent/50'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Severe warning */}
            <AnimatePresence>
              {isSevere && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-rose-800 dark:text-rose-200">
                        Your symptoms seem severe.
                      </p>
                      <p className="text-rose-700 dark:text-rose-300 mt-0.5">
                        We recommend booking an appointment soon. Consider{' '}
                        <span className="font-semibold">teleconsultation</span> for immediate advice.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search button */}
            <Button
              size="lg"
              onClick={handleSearch}
              disabled={isSearching || !location.trim()}
              className="w-full h-12 text-base bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg shadow-teal-500/20"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Find Doctors
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ PRE-SEARCH EMPTY STATE ═══ */}
      {/* A brand-new user (no search performed yet) sees a friendly hint card
          in place of results — no fake doctor listings. */}
      <AnimatePresence>
        {!hasSearched && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="border-dashed border-teal-200 dark:border-teal-900/50 bg-gradient-to-br from-teal-50/40 to-cyan-50/20 dark:from-teal-950/10 dark:to-cyan-950/10">
              <CardContent className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/40 mb-3">
                  <Search className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="text-sm font-medium text-foreground">Search to find doctors near you</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Enter your area or city above, optionally pick a health concern, then tap
                  &ldquo;Find Doctors&rdquo; — we&rsquo;ll surface verified specialists from
                  Google Places with real clinic details, fees, and availability.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 5. TELEHEALTH QUICK CONNECT ═══ */}
      <AnimatePresence>
        {hasSearched && isSevere && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="border-teal-300 dark:border-teal-800 bg-gradient-to-br from-teal-50 via-cyan-50 to-white dark:from-teal-950/40 dark:via-cyan-950/30 dark:to-card shadow-lg shadow-teal-500/10">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                        <Video className="h-6 w-6" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-teal-900 dark:text-teal-100">
                        Need immediate advice? Connect with a doctor in 2 minutes
                      </h3>
                      <p className="text-sm text-teal-700 dark:text-teal-300 mt-0.5 flex items-center gap-1.5">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Video Consult Available Now
                      </p>
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md shrink-0">
                    <Video className="h-4 w-4" />
                    Start Video Consult
                  </Button>
                </div>

                <Separator className="my-4 bg-teal-200/50 dark:bg-teal-800/50" />

                {/* Online doctors */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                    Available Right Now
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {onlineDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-white/70 dark:bg-card/60 p-2.5"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className={cn('bg-gradient-to-br text-white font-semibold text-xs', getAvatarGradient(doc.name))}>
                              {getInitials(doc.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-card" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{doc.name}</p>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="h-4 text-[10px] px-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                            </Badge>
                            <span className="text-[10px] text-muted-foreground truncate">{SPECIALTY_MAP[doc.specialty].shortLabel}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 3 & 4. RESULTS + FILTER BAR ═══ */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Filter & Sort Bar */}
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Results count + location + source */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-base">{filteredDoctors.length}</span>
                      <span className="text-muted-foreground">doctors found</span>
                      {selectedSpecialty && (
                        <Badge variant="secondary" className="ml-1 bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                          {SPECIALTY_MAP[selectedSpecialty].shortLabel}
                        </Badge>
                      )}
                    </div>
                    {searchedLocation && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 text-teal-500" />
                        <span className="truncate max-w-[260px]">{searchedLocation}</span>
                        <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 text-[10px] font-medium">
                          <Globe className="h-2.5 w-2.5" />
                          {searchSource === 'google' ? 'Google Places' : 'Live results'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1" />

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Filter className="h-3.5 w-3.5" /> Sort:
                    </span>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="experience">Experience</SelectItem>
                        <SelectItem value="fee">Fee (Low to High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Filter toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium mr-1">Filters:</span>
                  <FilterToggle
                    active={filterToday}
                    onClick={() => setFilterToday((v) => !v)}
                    icon={CalendarIcon}
                    label="Available Today"
                  />
                  <FilterToggle
                    active={filterOpenNow}
                    onClick={() => setFilterOpenNow((v) => !v)}
                    icon={Clock}
                    label="Open Now"
                  />
                  <FilterToggle
                    active={filterVideo}
                    onClick={() => setFilterVideo((v) => !v)}
                    icon={Video}
                    label="Video Consult"
                  />
                  <FilterToggle
                    active={filterFemale}
                    onClick={() => setFilterFemale((v) => !v)}
                    icon={User}
                    label="Female Doctor"
                  />
                  <div className="flex items-center gap-1.5 ml-1">
                    <CircleDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select value={maxFee} onValueChange={(v) => setMaxFee(v as typeof maxFee)}>
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Fee</SelectItem>
                        <SelectItem value="500">≤ ₹500</SelectItem>
                        <SelectItem value="800">≤ ₹800</SelectItem>
                        <SelectItem value="1200">≤ ₹1200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctor cards */}
            {isSearching ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div className="h-14 w-14 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/2 bg-muted rounded" />
                          <div className="h-3 w-1/3 bg-muted rounded" />
                          <div className="h-3 w-2/3 bg-muted rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Search className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-3 font-semibold">No doctors match your filters</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or searching a different area.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setFilterToday(false)
                      setFilterOpenNow(false)
                      setFilterVideo(false)
                      setFilterFemale(false)
                      setMaxFee('any')
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredDoctors.map((doc, idx) => (
                  <DoctorCard
                    key={doc.id}
                    doctor={doc}
                    index={idx}
                    onBook={() => openBooking(doc)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 6. HEALTH CONCERN GUIDE ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <HandHeart className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-bold">Health Concern Guide</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SPECIALTY_GUIDE.map((entry, idx) => {
            const meta = SPECIALTY_MAP[entry.specialty]
            const Icon = entry.icon
            return (
              <motion.div
                key={entry.specialty}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card className={cn('h-full border bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-md', meta.borderColor)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.bgColor, meta.textColor)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">See a {meta.shortLabel} if:</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.whenToSee}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Red Flag Symptoms */}
        <Card className="border-rose-200 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-orange-50/50 dark:from-rose-950/40 dark:to-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-rose-800 dark:text-rose-200">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950">
                <Flame className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </span>
              Red Flag Symptoms
            </CardTitle>
            <CardDescription className="text-rose-700/80 dark:text-rose-300/80">
              Seek <strong>immediate medical attention</strong> if you experience any of these:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RED_FLAG_SYMPTOMS.map((sym) => {
                const Icon = sym.icon
                return (
                  <div
                    key={sym.text}
                    className="flex items-start gap-2.5 rounded-lg bg-white/70 dark:bg-card/60 border border-rose-100 dark:border-rose-900/50 px-3 py-2"
                  >
                    <Icon className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-rose-900 dark:text-rose-100">{sym.text}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/40 rounded-lg px-3 py-2">
              <Siren className="h-4 w-4 shrink-0" />
              <span>Do not wait — these symptoms may indicate a serious condition requiring urgent care.</span>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ═══ 7. APPOINTMENT BOOKING DIALOG ═══ */}
      <Dialog open={!!bookingDoctor} onOpenChange={(open) => !open && closeBooking()}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          {bookingDoctor && !bookingConfirmed && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-teal-600" />
                  Book Appointment
                </DialogTitle>
                <DialogDescription>
                  Choose a date and time that works for you.
                </DialogDescription>
              </DialogHeader>

              {/* Doctor summary */}
              <div className="flex items-start gap-3 rounded-xl border border-teal-100 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20 p-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={cn('bg-gradient-to-br text-white font-semibold', getAvatarGradient(bookingDoctor.name))}>
                    {getInitials(bookingDoctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{bookingDoctor.name}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{bookingDoctor.qualifications}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <Badge variant="secondary" className={cn('text-[10px]', SPECIALTY_MAP[bookingDoctor.specialty].bgColor, SPECIALTY_MAP[bookingDoctor.specialty].textColor)}>
                      {SPECIALTY_MAP[bookingDoctor.specialty].shortLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hospital className="h-3 w-3" /> {bookingDoctor.clinic}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-teal-700 dark:text-teal-300">₹{bookingDoctor.fee}</p>
                  <p className="text-[10px] text-muted-foreground">consultation</p>
                </div>
              </div>

              {/* Date picker */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-teal-600" /> Select Date
                </Label>
                <div className="rounded-lg border p-2 flex justify-center bg-background">
                  <Calendar
                    mode="single"
                    selected={bookingDate}
                    onSelect={setBookingDate}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const max = new Date(today)
                      max.setDate(max.getDate() + 14)
                      return date < today || date > max
                    }}
                    className="mx-auto"
                  />
                </div>
              </div>

              {/* Time slot */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-teal-600" /> Select Time Slot
                </Label>
                <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-0.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = bookingTime === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!bookingDate}
                        onClick={() => setBookingTime(slot)}
                        className={cn(
                          'rounded-md border px-2 py-1.5 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                          isSelected
                            ? 'border-teal-500 bg-teal-600 text-white shadow-sm'
                            : 'border-border bg-background hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                        )}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
                {!bookingDate && (
                  <p className="text-[11px] text-muted-foreground">Pick a date to see available slots.</p>
                )}
              </div>

              {/* Reason for visit */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-teal-600" /> Reason for Visit
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Briefly describe your symptoms or reason for the consultation..."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={confirmBooking}
                  disabled={!canConfirm}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Appointment
                </Button>
              </DialogFooter>
            </>
          )}

          {bookingDoctor && bookingConfirmed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="py-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle2 className="h-9 w-9 text-white" />
              </motion.div>
              <DialogTitle className="mt-4 text-xl">Appointment booked!</DialogTitle>
              <DialogDescription className="mt-1">
                You&apos;ll receive a confirmation shortly.
              </DialogDescription>

              <div className="mt-4 rounded-xl border bg-muted/40 p-3 text-left space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Doctor</span>
                  <span className="font-medium">{bookingDoctor.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {bookingDate?.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{bookingTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-medium text-teal-700 dark:text-teal-300">₹{bookingDoctor.fee}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium text-right text-xs">{bookingDoctor.clinic}, {bookingDoctor.city}</span>
                </div>
              </div>

              <Button onClick={closeBooking} className="mt-5 w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                Done
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-component: Filter Toggle ─────────────────────────────────────────────

function FilterToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-teal-500 bg-teal-600 text-white shadow-sm'
          : 'border-border bg-background hover:bg-accent'
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
      {active && <CheckCircle2 className="h-3 w-3" />}
    </button>
  )
}

// ─── Sub-component: Doctor Card ───────────────────────────────────────────────

function DoctorCard({
  doctor,
  index,
  onBook,
}: {
  doctor: Doctor
  index: number
  onBook: () => void
}) {
  const meta = SPECIALTY_MAP[doctor.specialty]
  const Icon = meta.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.4) }}
    >
      <Card className="h-full bg-card/80 backdrop-blur-sm border-border/70 hover:border-teal-200 dark:hover:border-teal-800 hover:shadow-lg transition-all">
        <CardContent className="p-5">
          {/* Top: avatar + name + rating */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14">
                <AvatarFallback className={cn('bg-gradient-to-br text-white font-bold text-base', getAvatarGradient(doctor.name))}>
                  {getInitials(doctor.name)}
                </AvatarFallback>
              </Avatar>
              {doctor.onlineNow && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-card" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base leading-tight truncate">{doctor.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doctor.qualifications}</p>
                </div>
                <Badge variant="secondary" className={cn('shrink-0 text-[10px]', meta.bgColor, meta.textColor, 'border', meta.borderColor)}>
                  <Icon className="h-3 w-3" />
                  {meta.shortLabel}
                </Badge>
              </div>

              {/* Rating + experience + gender */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs">
                <span className="flex items-center gap-1">
                  <StarRating rating={doctor.rating} />
                  <span className="font-semibold">{doctor.rating}</span>
                  <span className="text-muted-foreground">({doctor.reviews} reviews)</span>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Award className="h-3 w-3" /> {doctor.experience} yrs
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" /> {doctor.gender}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Clinic + address */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-start gap-2">
              <Hospital className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="font-medium leading-tight">{doctor.clinic}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground leading-tight text-xs">
                {doctor.address}, {doctor.city}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground text-xs">{doctor.distance} km away</span>
            </div>
            <div className="flex items-start gap-2">
              <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground text-xs">{doctor.languages.join(', ')}</span>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Bottom: fee + slot + actions */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Consultation Fee</p>
              <p className="text-lg font-bold text-teal-700 dark:text-teal-300">₹{doctor.fee}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Next Available</p>
              <p className="text-sm font-semibold flex items-center gap-1 justify-end">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                {doctor.nextSlotDay}, {doctor.nextSlotTime}
              </p>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {doctor.openNow === true && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open Now
              </Badge>
            )}
            {doctor.openNow === false && (
              <Badge variant="secondary" className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Closed
              </Badge>
            )}
            {doctor.availableToday && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CalendarIcon className="h-3 w-3" /> Available Today
              </Badge>
            )}
            {doctor.videoConsult && (
              <Badge variant="secondary" className="text-[10px] bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                <Video className="h-3 w-3" /> Video Consult
              </Badge>
            )}
            {doctor.onlineNow && (
              <Badge variant="secondary" className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online Now
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              onClick={onBook}
              size="sm"
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Book
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!doctor.videoConsult}
              className={!doctor.videoConsult ? 'opacity-40' : ''}
            >
              <Video className="h-3.5 w-3.5" />
              Video
            </Button>
            {doctor.phone ? (
              <Button size="sm" variant="outline" asChild>
                <a href={`tel:${doctor.phone}`}>
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled className="opacity-40">
                <Phone className="h-3.5 w-3.5" />
                Call
              </Button>
            )}
            {doctor.mapsUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={doctor.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="h-3.5 w-3.5" />
                  Directions
                </a>
              </Button>
            )}
          </div>

          {/* Google Maps link footer */}
          {doctor.mapsUrl && (
            <a
              href={doctor.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <Globe className="h-3 w-3" />
              View on Google Maps
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
