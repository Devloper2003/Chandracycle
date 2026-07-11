import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, parseCookies, SESSION_COOKIE, toSessionUser, verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const cookies = parseCookies(request.headers.get('cookie'))
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const token = cookies[SESSION_COOKIE] || headerToken

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // First verify the JWT signature/expiry. If the token itself is invalid,
    // there's no point hitting the DB.
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    const exp = payload.exp as number | undefined
    if (exp && Date.now() > exp) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Try a fresh DB lookup so profile updates (onboarding, cycle edits, etc.)
    // are reflected immediately.
    const sub = typeof payload.sub === 'string' ? payload.sub : null
    if (sub) {
      try {
        const fresh = await db.user.findUnique({ where: { id: sub } })
        if (fresh) {
          return NextResponse.json({ user: toSessionUser(fresh) })
        }
      } catch {
        // DB unavailable (ephemeral Vercel filesystem, missing DATABASE_URL,
        // table not created, etc.). Fall through to JWT-embedded user below.
      }
    }

    // Fallback: return the user info embedded in the JWT itself. This is what
    // makes login persist on Vercel serverless even when the SQLite filesystem
    // is ephemeral.
    const u = payload.u as Record<string, unknown> | undefined
    if (u && typeof u.email === 'string' && sub) {
      return NextResponse.json({
        user: {
          id: sub,
          name: (u.name as string | null) ?? null,
          email: u.email,
          avatar: (u.avatar as string | null) ?? null,
          provider: (u.provider as string) ?? 'email',
          onboardingComplete: (u.onboardingComplete as boolean) ?? false,
          cycleLength: (u.cycleLength as number) ?? 28,
          periodLength: (u.periodLength as number) ?? 5,
          lastPeriodStart: (u.lastPeriodStart as string | null) ?? null,
        },
      })
    }

    return NextResponse.json({ user: null }, { status: 200 })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
