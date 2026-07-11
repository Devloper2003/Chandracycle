import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/notifications/read
// Body: { id?: string, all?: boolean, userId: string }
// - If `all` is true → marks all unread notifications for the user as read
// - If `id` is provided → marks that single notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { id, all, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (all) {
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
      return NextResponse.json({ ok: true, marked: 'all' })
    }

    if (id) {
      await db.notification.update({
        where: { id },
        data: { read: true },
      })
      return NextResponse.json({ ok: true, marked: id })
    }

    return NextResponse.json({ error: 'Provide either `id` or `all: true`' }, { status: 400 })
  } catch (error) {
    console.error('Error marking notification read:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
