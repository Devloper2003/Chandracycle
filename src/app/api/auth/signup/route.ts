import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  hashPassword,
  issueSessionToken,
  toSessionUser,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SessionUser,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const hashed = await hashPassword(password)

    // ─── Try DB operations (may fail on Vercel ephemeral filesystem) ─────────
    let sessionUser: SessionUser

    try {
      const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      const user = await db.user.create({
        data: {
          name: name || null,
          email: email.toLowerCase(),
          password: hashed,
          provider: 'email',
          cycleLength: 28,
          periodLength: 5,
        },
      })
      sessionUser = toSessionUser(user)
    } catch (dbError) {
      console.warn(
        '[signup] DB operation failed, issuing JWT-only session:',
        dbError instanceof Error ? dbError.message : String(dbError)
      )
      // DB unavailable (ephemeral Vercel filesystem). Issue a JWT-only session
      // so the user can still sign up and use the app. NOTE: without a
      // persistent DB, email/password re-login won't work — the user should
      // use Google login for subsequent sign-ins.
      const fallbackId = `email-${Buffer.from(email.toLowerCase()).toString('hex').slice(0, 24)}`
      sessionUser = {
        id: fallbackId,
        name: name || null,
        email: email.toLowerCase(),
        avatar: null,
        provider: 'email',
        onboardingComplete: false,
        cycleLength: 28,
        periodLength: 5,
        lastPeriodStart: null,
      }
    }

    const token = issueSessionToken(sessionUser)
    const response = NextResponse.json({ user: sessionUser, token })
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
