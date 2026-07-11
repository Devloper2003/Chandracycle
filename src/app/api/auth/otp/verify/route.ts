import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyOtp, normalisePhone } from '@/lib/otp'
import { issueSessionToken, toSessionUser, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth'

// POST /api/auth/otp/verify
// Body: { phone: string, code: string, name?: string }
// Verifies the OTP and logs the user in (creating an account if first time).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!rawPhone || !code) {
      return NextResponse.json(
        { error: 'Please enter the OTP sent to your mobile.' },
        { status: 400 }
      )
    }

    const phone = normalisePhone(rawPhone)
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

    // Find existing user by phone OR create a new one
    let user = await db.user.findUnique({ where: { phone } })

    if (!user) {
      // New user — create with phone-only account
      // Generate a placeholder email so the unique constraint is satisfied
      // (real email can be added later in onboarding)
      const placeholderEmail = `${phone.replace('+', '')}@mobile.chandracycle.app`
      user = await db.user.create({
        data: {
          phone,
          email: placeholderEmail,
          name: name || `ChandraCycle User`,
          provider: 'mobile',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'ChandraCycle User')}&backgroundColor=fef3c7,fce7f3,e0e7ff,d1fae5`,
          cycleLength: 28,
          periodLength: 5,
        },
      })
    } else if (name) {
      // Update name if provided and user is new-ish (no name set)
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

    const sessionUser = toSessionUser(user)
    const token = issueSessionToken(sessionUser)
    const response = NextResponse.json({
      user: sessionUser,
      token,
    })
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    )
  }
}
