'use client'

import React, { useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Calendar,
  Ruler,
  Weight,
  Bell,
  Shield,
  Palette,
  Watch,
  Crown,
  Info,
  LogOut,
  Edit2,
  Save,
  X,
  Download,
  Trash2,
  Lock,
  FileText,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Check,
  ChevronRight,
  ExternalLink,
  Apple,
  Activity,
  HeartPulse,
  Zap,
  Smartphone,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  KeyRound,
  FileLock2,
  Compass,
  RotateCcw,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NotificationPref {
  id: string
  label: string
  description: string
  enabled: boolean
  icon: React.ElementType
  color: string
}

interface WearableDevice {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  connected: boolean
  features: string[]
}

// ─── Settings Section Wrapper ───────────────────────────────────────────────

function SettingsSection({
  id,
  title,
  description,
  icon: Icon,
  iconColor,
  children,
  delay = 0,
}: {
  id?: string
  title: string
  description?: string
  icon: React.ElementType
  iconColor: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      id={id}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {description && <CardDescription className="text-xs">{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Module ────────────────────────────────────────────────────────────

export default function SettingsModule() {
  const { isPremium, setPremium, userProfile, setUserProfile } = useAppStore()
  const { theme, setTheme } = useTheme()
  // Detect client-side rendering to avoid hydration mismatch with theme
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form state — empty defaults for a brand-new user. Profile fields that
  // come from useAppStore (name, email, cycleLength, periodLength,
  // lastPeriodStart) fall back to sensible config defaults (cycle length 28,
  // period length 5) per the task rules — these are user-adjustable settings,
  // not fake history. dob / height / weight / lastPeriod start empty so a
  // new user fills them in rather than seeing fabricated personal data.
  const [formData, setFormData] = useState({
    name: userProfile?.name || 'ChandraCycle User',
    email: userProfile?.email || 'user@chandracycle.health',
    dob: '',
    height: '',
    weight: '',
    cycleLength: String(userProfile?.cycleLength || 28),
    periodLength: String(userProfile?.periodLength || 5),
    lastPeriod: userProfile?.lastPeriodStart || '',
  })

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPref[]>([
    { id: 'period', label: 'Period Reminders', description: 'Alerts before your period starts', enabled: true, icon: Calendar, color: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' },
    { id: 'ovulation', label: 'Ovulation Alerts', description: 'Notifications for fertile window', enabled: true, icon: HeartPulse, color: 'bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400' },
    { id: 'pill', label: 'Medication Reminders', description: 'Birth control & supplement alerts', enabled: false, icon: Zap, color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
    { id: 'mood', label: 'Mood Check-ins', description: 'Daily mood logging prompts', enabled: true, icon: Activity, color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' },
    { id: 'water', label: 'Hydration Reminders', description: 'Periodic water intake alerts', enabled: false, icon: Activity, color: 'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400' },
    { id: 'sleep', label: 'Sleep Wind-down', description: 'Bedtime reminder alerts', enabled: true, icon: Moon, color: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' },
    { id: 'community', label: 'Community Updates', description: 'Replies, likes, and mentions', enabled: true, icon: User, color: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400' },
    { id: 'weekly', label: 'Weekly Health Report', description: 'Summary of your week every Sunday', enabled: true, icon: FileText, color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
    { id: 'tips', label: 'AI Tips & Insights', description: 'Personalized health tips', enabled: false, icon: Sparkles, color: 'bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400' },
  ])

  // Wearable devices
  const [devices, setDevices] = useState<WearableDevice[]>([
    {
      id: 'apple',
      name: 'Apple Health',
      description: 'Sync cycle, sleep, steps & heart rate from your iPhone',
      icon: Apple,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-950/40',
      connected: false,
      features: ['Steps', 'Heart Rate', 'Sleep', 'Cycle'],
    },
    {
      id: 'fitbit',
      name: 'Fitbit',
      description: 'Connect your Fitbit for sleep & activity tracking',
      icon: Watch,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-950/40',
      // Demo-data cleanup: no wearables are pre-connected for a brand-new user.
      // The user explicitly taps "Connect" to link a device.
      connected: false,
      features: ['Sleep Stages', 'Heart Rate', 'Steps', 'Stress'],
    },
    {
      id: 'garmin',
      name: 'Garmin Connect',
      description: 'Sync Garmin watch data for advanced health metrics',
      icon: Watch,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-950/40',
      connected: false,
      features: ['Stress Score', 'Sleep', 'SpO2', 'Body Battery'],
    },
    {
      id: 'googlefit',
      name: 'Google Fit',
      description: 'Connect Google Fit on Android devices',
      icon: Smartphone,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
      connected: false,
      features: ['Steps', 'Heart Points', 'Sleep'],
    },
  ])

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n))
  }

  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        const newConnected = !d.connected
        toast.success(newConnected ? `${d.name} connected` : `${d.name} disconnected`)
        return { ...d, connected: newConnected }
      }
      return d
    }))
  }

  const handleSave = () => {
    setUserProfile({
      id: userProfile?.id || 'local-user',
      name: formData.name,
      email: formData.email,
      cycleLength: Number(formData.cycleLength),
      periodLength: Number(formData.periodLength),
      lastPeriodStart: formData.lastPeriod,
    })
    setIsEditing(false)
    toast.success('Profile updated', {
      description: 'Your changes have been saved successfully.',
    })
  }

  const handleExportData = () => {
    toast.success('Data export started', {
      description: 'You\'ll receive an email with your data download link within 24 hours.',
    })
  }

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(false)
    toast.error('Account scheduled for deletion', {
      description: 'Your account will be permanently deleted in 30 days. We\'re sorry to see you go.',
    })
  }

  const handleSignOut = () => {
    toast.success('Signed out', {
      description: 'You\'ve been signed out of ChandraCycle.',
    })
  }

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-md">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account, preferences, and privacy</p>
        </div>
      </motion.div>

      {/* ─── Profile Card ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-rose-500 via-fuchsia-500 to-purple-500 h-20" />
          <CardContent className="p-5 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-rose-400 to-fuchsia-500 text-white text-xl font-bold">
                  {formData.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold">{formData.name}</h2>
                  {isPremium ? (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 gap-1">
                      <Crown className="h-3 w-3" /> Premium
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">Free</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5" /> {formData.email}
                </p>
              </div>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? (
                  <><Save className="h-4 w-4 mr-1.5" /> Save Changes</>
                ) : (
                  <><Edit2 className="h-4 w-4 mr-1.5" /> Edit Profile</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
              <CardContent className="p-4 flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-amber-700 dark:text-amber-300">
                  You're now editing your profile. Click "Save Changes" at the top to apply.
                </span>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Personal Information ──────────────────────────────────── */}
      <SettingsSection
        title="Personal Information"
        description="Your basic profile details"
        icon={User}
        iconColor="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
        delay={0.1}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs flex items-center gap-1.5">
              <User className="h-3 w-3" /> Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted/50' : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted/50' : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dob" className="text-xs flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Date of Birth
            </Label>
            <Input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted/50' : ''}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height" className="text-xs flex items-center gap-1.5">
                <Ruler className="h-3 w-3" /> Height (cm)
              </Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight" className="text-xs flex items-center gap-1.5">
                <Weight className="h-3 w-3" /> Weight (kg)
              </Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ─── Cycle Settings ────────────────────────────────────────── */}
      <SettingsSection
        title="Cycle Settings"
        description="Personalize your cycle tracking parameters"
        icon={Calendar}
        iconColor="bg-fuchsia-100 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400"
        delay={0.15}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Cycle Length (days)</Label>
            <Select
              value={formData.cycleLength}
              onValueChange={(v) => setFormData(prev => ({ ...prev, cycleLength: v }))}
              disabled={!isEditing}
            >
              <SelectTrigger className={!isEditing ? 'bg-muted/50' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => i + 21).map(d => (
                  <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Period Length (days)</Label>
            <Select
              value={formData.periodLength}
              onValueChange={(v) => setFormData(prev => ({ ...prev, periodLength: v }))}
              disabled={!isEditing}
            >
              <SelectTrigger className={!isEditing ? 'bg-muted/50' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(d => (
                  <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastPeriod" className="text-xs">Last Period Start</Label>
            <Input
              id="lastPeriod"
              type="date"
              value={formData.lastPeriod}
              onChange={(e) => setFormData(prev => ({ ...prev, lastPeriod: e.target.value }))}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted/50' : ''}
            />
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/20 border border-fuchsia-200 dark:border-fuchsia-900">
          <p className="text-xs text-fuchsia-700 dark:text-fuchsia-300 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>Tip:</strong> The more accurate your cycle settings, the better ChandraCycle's predictions.
              Most women have cycles between 26–32 days. Update if your cycle changes over time.
            </span>
          </p>
        </div>
      </SettingsSection>

      {/* ─── Notification Preferences ──────────────────────────────── */}
      <SettingsSection
        title="Notification Preferences"
        description="Choose what you want to be notified about"
        icon={Bell}
        iconColor="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
        delay={0.2}
      >
        <div className="space-y-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', n.color)}>
                <n.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs text-muted-foreground">{n.description}</div>
              </div>
              <Switch
                checked={n.enabled}
                onCheckedChange={() => toggleNotification(n.id)}
              />
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ─── Privacy & Security ────────────────────────────────────── */}
      <SettingsSection
        title="Privacy & Security"
        description="Manage your data and account security"
        icon={Shield}
        iconColor="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        delay={0.25}
      >
        <div className="space-y-2">
          <button
            onClick={handleExportData}
            className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Download className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Export My Data</div>
              <div className="text-xs text-muted-foreground">Download all your health data as a ZIP file</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => toast.info('Privacy Policy', { description: 'Opening privacy policy in a new tab...' })}
            className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Privacy Policy</div>
              <div className="text-xs text-muted-foreground">Read our full data handling practices</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-center gap-1.5">
                End-to-End Encryption
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Active
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                All your health data is encrypted with AES-256 — even we can't read it.
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-rose-600 dark:text-rose-400">Delete My Account</div>
                  <div className="text-xs text-muted-foreground">Permanently remove your account and all data</div>
                </div>
                <ChevronRight className="h-4 w-4 text-rose-400" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  Delete account permanently?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed">
                  This will permanently delete your account, all health data, cycle history, community posts, and AI conversations. <strong className="text-foreground">This action cannot be undone.</strong> You'll have a 30-day grace period before permanent deletion. To proceed, type <code className="px-1 py-0.5 bg-muted rounded text-xs">DELETE</code> below.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input placeholder="Type DELETE to confirm" className="my-2" />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsSection>

      {/* ─── Appearance ────────────────────────────────────────────── */}
      <SettingsSection
        title="Appearance"
        description="Customize how ChandraCycle looks for you"
        icon={Palette}
        iconColor="bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
        delay={0.3}
      >
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(opt => {
            const isActive = mounted && theme === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  isActive
                    ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/20 shadow-md'
                    : 'border-border hover:border-purple-300 dark:hover:border-purple-700'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  isActive ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  <opt.icon className="h-5 w-5" />
                </div>
                <span className={cn('text-sm font-medium', isActive && 'text-purple-600 dark:text-purple-400')}>{opt.label}</span>
                {isActive && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 gap-0.5">
                    <Check className="h-2.5 w-2.5" /> Active
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
        {!mounted && (
          <p className="text-xs text-muted-foreground mt-3 text-center">Loading theme...</p>
        )}
      </SettingsSection>

      {/* ─── Health Connections ────────────────────────────────────── */}
      <SettingsSection
        title="Health Connections"
        description="Sync data from your wearable devices"
        icon={Watch}
        iconColor="bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400"
        delay={0.35}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {devices.map(device => (
            <div
              key={device.id}
              className={cn(
                'rounded-xl border p-3 transition-all',
                device.connected
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10'
                  : 'border-border'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', device.bgColor, device.color)}>
                  <device.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">{device.name}</span>
                    {device.connected && (
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{device.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {device.features.map(f => (
                      <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant={device.connected ? 'outline' : 'default'}
                className="w-full mt-3"
                onClick={() => toggleDevice(device.id)}
              >
                {device.connected ? (
                  <><X className="h-3.5 w-3.5 mr-1.5" /> Disconnect</>
                ) : (
                  <><Zap className="h-3.5 w-3.5 mr-1.5" /> Connect</>
                )}
              </Button>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ─── Subscription ──────────────────────────────────────────── */}
      <SettingsSection
        title="Subscription"
        description="Manage your ChandraCycle plan"
        icon={Crown}
        iconColor="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
        delay={0.4}
      >
        <div className="rounded-xl border overflow-hidden">
          <div className={cn(
            'p-4 flex items-center gap-4',
            isPremium
              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20'
              : 'bg-muted/40'
          )}>
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl shrink-0',
              isPremium
                ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white shadow-md'
                : 'bg-muted text-muted-foreground'
            )}>
              <Crown className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </span>
                {isPremium && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPremium
                  ? '₹299/month · Unlimited AI coach, predictions & reports'
                  : 'Basic period tracking, mood logging & community access'}
              </p>
            </div>
          </div>
          <div className="p-3 flex flex-col sm:flex-row gap-2 bg-card">
            <Button
              variant={isPremium ? 'outline' : 'default'}
              className="flex-1"
              onClick={() => {
                if (isPremium) {
                  setPremium(false)
                  toast.success('Subscription cancelled', {
                    description: 'Your premium access will end at the next billing cycle.',
                  })
                } else {
                  setPremium(true)
                  toast.success('Welcome to Premium! 🎉', {
                    description: 'You now have access to all premium features.',
                  })
                }
              }}
            >
              {isPremium ? (
                <><X className="h-4 w-4 mr-1.5" /> Cancel Subscription</>
              ) : (
                <><Crown className="h-4 w-4 mr-1.5" /> Upgrade to Premium</>
              )}
            </Button>
            {isPremium && (
              <Button variant="ghost" className="flex-1" onClick={() => toast.info('Billing portal', { description: 'Opening billing portal to update payment method...' })}>
                <FileText className="h-4 w-4 mr-1.5" /> Manage Billing
              </Button>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* ─── About ─────────────────────────────────────────────────── */}
      <SettingsSection
        title="About ChandraCycle"
        description="App information and resources"
        icon={Info}
        iconColor="bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
        delay={0.45}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                A
              </div>
              <div>
                <div className="text-sm font-semibold">ChandraCycle</div>
                <div className="text-xs text-muted-foreground">AI Women's Health Companion</div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">v2.4.1</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => toast.info('Terms of Service', { description: 'Opening terms in a new tab...' })}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">Terms of Service</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </button>
            <button
              onClick={() => toast.info('Privacy Policy', { description: 'Opening privacy policy in a new tab...' })}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
            >
              <FileLock2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">Privacy Policy</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </button>
            <button
              onClick={() => toast.info('Support Center', { description: 'Opening support center in a new tab...' })}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">Help & Support</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </button>
            <button
              onClick={() => toast.info('Contact us', { description: 'support@chandracycle.health · +91 80-4567-8900' })}
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
            >
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">Contact Us</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {[
              { label: 'HIPAA', icon: ShieldCheck, color: 'text-emerald-600' },
              { label: 'GDPR', icon: KeyRound, color: 'text-sky-600' },
              { label: 'E2E Encrypted', icon: Lock, color: 'text-purple-600' },
              { label: 'ISO 27001', icon: Shield, color: 'text-amber-600' },
            ].map(b => (
              <div key={b.label} className="flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs">
                <b.icon className={cn('h-3.5 w-3.5', b.color)} />
                <span className="font-medium">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* ─── Help & Guidance ─────────────────────────────────────────── */}
      <SettingsSection
        title="Help & Guidance"
        description="Tour the app and find help"
        icon={Compass}
        iconColor="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
        delay={0.48}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            New to ChandraCycle? Replay the interactive tour to learn where everything is —
            the sidebar, Period Tracker, AI Coach, your profile, and Premium.
          </p>
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 text-white">
              <Compass className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Replay onboarding tour</div>
              <div className="text-xs text-muted-foreground">
                Restarts the 60-second guided walkthrough of the app.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
              onClick={() => {
                try {
                  // Remove the per-user tour-seen flag so the tour auto-starts
                  // on the next dashboard load. Also clear the legacy global
                  // flag for back-compat with older sessions.
                  const uid = userProfile?.id
                  if (uid) localStorage.removeItem(`chandracycle_tour_seen_${uid}`)
                  localStorage.removeItem('chandracycle_tour_seen')
                } catch {
                  // ignore — best-effort
                }
                toast.success('Onboarding tour restarted', {
                  description: 'The tour will open on the dashboard in a moment.',
                })
                // Slight delay so the toast can render before the reload.
                setTimeout(() => {
                  window.location.reload()
                }, 600)
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Replay tour
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={() =>
                toast.info('Help Center', {
                  description: 'Opening the help center in a new tab...',
                })
              }
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">Help Center</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </button>
            <button
              onClick={() =>
                toast.info('Contact us', {
                  description: 'support@chandracycle.health · +91 80-4567-8900',
                })
              }
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
            >
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">Contact Support</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* ─── Sign Out ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pb-4"
      >
        <Card className="border-rose-200 dark:border-rose-900">
          <CardContent className="p-4">
            <Button
              variant="outline"
              className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              You can sign back in anytime with your email.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-2">
        Made with <HeartPulse className="inline h-3 w-3 text-rose-500" /> for women everywhere · © 2024 ChandraCycle Health
      </div>
    </div>
  )
}
