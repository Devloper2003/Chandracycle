import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyOtp, normalisePhone } from '@/lib/otp'
import {
  issueSessionToken,
  toSessionUser,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SessionUser,
} from '@/lib/auth'

// POST /api/auth/otp/verify
// Body: { phone: string, code: string, name?: string }
// Verifies the OTP and logs the user in (creating an account if first time).
//
// RESILIENCE: DB operations are wrapped in try/catch. On Vercel serverless
// (ephemeral SQLite), if the DB is unavailable we fall back to a JWT-only
// session using a deterministic ID derived from the phone number.
export async function POST(request: NextRequest) {
  let phone = ''
  let name = ''

  try {
    const body = await request.json().catch(() => ({}))
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!rawPhone || !code) {
      return NextResponse.json(
        { error: 'Please enter the OTP sent to your mobile.' },
        { status: 400 }
      )
    }

    phone = normalisePhone(rawPhone) || ''
    if (!phone) {
      return NextResponse.json(
        { error: 'Invalid mobile number. Please restart the flow.' },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'OTP must be 6 digits.' }, { status: 400 })
    }

    const result = verifyOtp(phone, code)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const displayName = name || 'ChandraCycle User'
    const placeholderEmail = `${phone.replace('+', '')}@mobile.chandracycle.app`
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=fef3c7,fce7f3,e0e7ff,d1fae5`

    // ─── Try DB operations (may fail on Vercel ephemeral filesystem) ─────────
    let sessionUser: SessionUser

    try {
      let user = await db.user.findUnique({ where: { phone } })

      if (!user) {
        user = await db.user.create({
          data: {
            phone,
            email: placeholderEmail,
            name: displayName,
            provider: 'mobile',
            avatar,
            cycleLength: 28,
            periodLength: 5,
          },
        })
      } else if (name) {
        if (!user.name || user.name === 'ChandraCycle User') {
          user = await db.user.update({
            where: { id: user.id },
            data: {
              name,
              provider: user.provider === 'email' ? 'mobile' : user.provider,
            },
          })
        }
      }
      sessionUser = toSessionUser(user)
    } catch (dbError) {
      console.warn(
        '[otp-verify] DB operation failed, issuing JWT-only session:',
        dbError instanceof Error ? dbError.message : String(dbError)
      )
      // Deterministic ID from phone so the same user gets the same ID.
      const fallbackId = `mobile-${phone.replace(/[^0-9]/g, '')}`
      sessionUser = {
        id: fallbackId,
        name: displayName,
        email: placeholderEmail,
        avatar,
        provider: 'mobile',
        onboardingComplete: false,
        cycleLength: 28,
        periodLength: 5,
        lastPeriodStart: null,
      }
    }

    const token = issueSessionToken(sessionUser)
    const response = NextResponse.json({
      user: sessionUser,
      token,
    })
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('[otp-verify] Fatal error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Failed to verify OTP. Please try again.',
        detail:
          process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV
            ? undefined
            : detail,
      },
      { status: 500 }
    )
  }
}
