'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, CalendarDays, Sparkles, Stethoscope, Users, Droplets, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AppNotification {
  id: string
  title: string
  message: string
  type: string // period_reminder | medication | appointment | insight | community
  read: boolean
  createdAt: string
}

interface NotificationPanelProps {
  userId: string
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  period_reminder: { icon: CalendarDays, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/40', label: 'Cycle' },
  medication: { icon: Droplets, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/40', label: 'Medication' },
  appointment: { icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/40', label: 'Appointment' },
  insight: { icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40', label: 'Insight' },
  community: { icon: Users, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40', label: 'Community' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotificationPanel({ userId }: NotificationPanelProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      // Seed demo notifications on first load so panel feels alive
      await fetch('/api/notifications/seed', { method: 'POST' }).catch(() => {})
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch on mount + when panel opens
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const markOneRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId }),
      })
    } catch {
      // revert on failure
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)))
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0 || markingAll) return
    setMarkingAll(true)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, userId }),
      })
      toast.success('All notifications marked as read')
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: false })))
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative h-9 w-9 inline-flex items-center justify-center rounded-full transition-all',
          'hover:bg-accent text-foreground/70 hover:text-foreground',
          open && 'bg-accent text-foreground'
        )}
        aria-label="Notifications"
      >
        <Bell className={cn('h-[18px] w-[18px] transition-transform', open && 'rotate-[-8deg]')} />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-rose-500/40 ring-2 ring-background"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-full animate-ping bg-rose-500/20" aria-hidden="true" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[min(380px,calc(100vw-2rem))] z-50"
          >
            <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-amber-50/50 to-rose-50/50 dark:from-amber-950/20 dark:to-rose-950/20">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      disabled={markingAll}
                      className="text-[11px] font-medium text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span className="hidden sm:inline">Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="ml-1 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto chandracycle-scroll">
                {loading ? (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading notifications…
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">You&apos;re all caught up</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      New notifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {notifications.map((n, idx) => {
                      const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.insight
                      const Icon = cfg.icon
                      return (
                        <motion.button
                          key={n.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                          onClick={() => !n.read && markOneRead(n.id)}
                          className={cn(
                            'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors group relative',
                            !n.read ? 'bg-primary/[0.03] hover:bg-primary/[0.06]' : 'hover:bg-accent/50'
                          )}
                        >
                          {/* Unread indicator */}
                          {!n.read && (
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                          )}
                          <div className={cn('h-9 w-9 shrink-0 rounded-xl flex items-center justify-center', cfg.bg)}>
                            <Icon className={cn('h-4 w-4', cfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn('text-[13px] leading-tight', !n.read ? 'font-semibold' : 'font-medium')}>
                                {n.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                            <span className={cn('inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                              {cfg.label}
                            </span>
                          </div>
                          {!n.read && (
                            <Check className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1.5 transition-colors" />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-center">
                <button
                  onClick={() => {
                    setOpen(false)
                    toast.info('Opening all notifications…')
                  }}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
