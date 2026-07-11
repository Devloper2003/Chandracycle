import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Returns existing accounts that have signed in via Google (or any OAuth
// provider) — these are shown in the "Choose an account" list of the Google
// sign-in modal, mirroring the real Google account chooser UX.
//
// We only return public-facing fields (name, email, avatar). No IDs, no tokens.
export async function GET() {
  try {
    const users = await db.user.findMany({
      where: {
        provider: { in: ['google', 'apple'] },
      },
      select: {
        email: true,
        name: true,
        avatar: true,
        provider: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    // Normalise the response shape
    const accounts = users.map((u) => ({
      email: u.email,
      name: u.name || u.email.split('@')[0],
      avatar:
        u.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || u.email)}`,
      provider: u.provider,
    }))

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Failed to fetch accounts:', error)
    return NextResponse.json({ accounts: [] }, { status: 200 })
  }
}
