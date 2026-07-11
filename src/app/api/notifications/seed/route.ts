import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromToken, parseCookies, SESSION_COOKIE } from '@/lib/auth'

// POST /api/notifications/seed
//
// Generates REAL, data-driven notifications for the current user based on
// their actual cycle history — NOT fake/demo content.
//
// What it checks:
//   1. If the user has a logged cycle, compute days until next predicted
//      period and create a "period reminder" notification if it's within
//      3 days. If no cycle is logged, create a friendly "log your first
//      period" prompt instead.
//   2. If the user hasn't logged mood/symptoms today, create a gentle
//      daily check-in reminder.
//
// Idempotent: only creates a new notification if the user has fewer than
// 2 unread notifications (to avoid spamming).
export async function POST(request: NextRequest) {
  try {
    const cookies = parseCookies(request.headers.get('cookie'))
    const token = cookies[SESSION_COOKIE]
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const sessionUser = await getUserFromToken(token)
    if (!sessionUser) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    // Don't spam — only seed if the user has very few unread notifications
    const unreadCount = await db.notification.count({
      where: { userId: sessionUser.id, read: false },
    })
    if (unreadCount >= 2) {
      return NextResponse.json({ ok: true, seeded: false, count: unreadCount })
    }

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const seeds: Array<{
      userId: string
      title: string
      message: string
      type: string
      read: boolean
      createdAt: Date
    }> = []

    // ─── 1. Cycle-based notification ────────────────────────────────────
    const latestCycle = await db.cycle.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { startDate: 'desc' },
    })

    if (!latestCycle) {
      // No cycle logged — gentle onboarding nudge
      seeds.push({
        userId: sessionUser.id,
        title: 'Welcome to ChandraCycle! 🌸',
        message: 'Log your first period to unlock personalised cycle predictions, ovulation tracking, and AI insights.',
        type: 'period_reminder',
        read: false,
        createdAt: now,
      })
    } else {
      // Compute days until next predicted period
      const cycleLength = latestCycle.cycleLength || 28
      const lastStart = new Date(latestCycle.startDate)
      const nextStart = new Date(lastStart)
      nextStart.setDate(nextStart.getDate() + cycleLength)
      const daysUntil = Math.ceil((nextStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntil <= 3 && daysUntil >= -2) {
        seeds.push({
          userId: sessionUser.id,
          title: daysUntil > 0 ? 'Period expected soon' : 'Period may have started',
          message:
            daysUntil > 0
              ? `Based on your cycle history, your period is expected in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`
              : 'Your period was predicted to start around now. Log it to keep your predictions accurate.',
          type: 'period_reminder',
          read: false,
          createdAt: now,
        })
      }
    }

    // ─── 2. Daily check-in reminder ─────────────────────────────────────
    const todayMood = await db.moodEntry.findFirst({
      where: { userId: sessionUser.id, date: todayStr },
    })
    if (!todayMood) {
      seeds.push({
        userId: sessionUser.id,
        title: 'Daily check-in',
        message: 'How are you feeling today? Log your mood to improve your AI insights.',
        type: 'insight',
        read: false,
        createdAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
      })
    }

    if (seeds.length === 0) {
      return NextResponse.json({ ok: true, seeded: false, count: unreadCount })
    }

    await db.notification.createMany({ data: seeds })
    return NextResponse.json({ ok: true, seeded: true, count: seeds.length })
  } catch (error) {
    console.error('Error seeding notifications:', error)
    return NextResponse.json({ error: 'Failed to seed notifications' }, { status: 500 })
  }
}
