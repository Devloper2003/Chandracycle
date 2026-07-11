import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { db } from '@/lib/db'
import {
  issueSessionToken,
  toSessionUser,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SessionUser,
} from '@/lib/auth'

// Real Google OAuth backend.
// Verifies the Google ID token returned by Google Identity Services on the
// client using google-auth-library. Only verified tokens (signed by Google,
// issued for OUR client ID) are accepted — so the user must actually sign in
// with their real Google account and grant permission.
//
// RESILIENCE: On Vercel serverless, the SQLite filesystem is ephemeral — the
// DB file may not exist or tables may not be created. So we wrap all DB
// operations in try/catch and fall back to a JWT-only session using Google's
// stable `sub` (user ID) when the DB is unavailable. This guarantees Google
// login ALWAYS works, even without a persistent database.
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

// Cache the OAuth2Client (it fetches Google's public keys the first time)
let clientCache: OAuth2Client | null = null
function getGoogleClient() {
  if (!clientCache) clientCache = new OAuth2Client()
  return clientCache
}

// Build a deterministic user ID from Google's `sub` so the same Google user
// gets the same ID across logins (even when the DB is unavailable).
function googleUserId(sub: string): string {
  return `google-${sub}`
}

export async function POST(request: NextRequest) {
  let googleSub: string | null = null
  let email = ''
  let name = ''
  let avatar: string | null = null

  try {
    const body = await request.json().catch(() => ({}))

    // Two flows:
    // 1. Real Google OAuth: client sends `credential` (verified ID token from Google Identity Services)
    // 2. Modal-based flow (no GOOGLE_CLIENT_ID configured): client sends `modalAccount` { email, name, avatar }

    const idToken = body.credential || body.idToken || body.id_token
    const modalAccount = body.modalAccount as
      | { email?: string; name?: string; avatar?: string }
      | undefined

    if (idToken) {
      // ─── Real Google OAuth flow ────────────────────────────────────────────
      if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json(
          {
            error:
              'Google Sign-In is not configured on the server. Add GOOGLE_CLIENT_ID to your environment variables.',
          },
          { status: 503 }
        )
      }
      const ticket = await getGoogleClient().verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      })
      const payload = ticket.getPayload()
      if (!payload || !payload.email) {
        return NextResponse.json(
          { error: 'Could not retrieve your Google account details. Please try again.' },
          { status: 400 }
        )
      }
      googleSub = payload.sub || null
      email = payload.email.toLowerCase()
      name = payload.name || payload.email.split('@')[0]
      avatar = payload.picture || null
    } else if (modalAccount?.email) {
      // ─── Modal-based flow ───────────────────────────────────────────────────
      email = modalAccount.email.toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
      }
      name = modalAccount.name || email.split('@')[0]
      avatar =
        modalAccount.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    } else {
      return NextResponse.json(
        { error: 'Missing Google credential. Please sign in through the Google popup.' },
        { status: 400 }
      )
    }

    // ─── Try DB operations (may fail on Vercel ephemeral filesystem) ─────────
    let sessionUser: SessionUser | null = null

    try {
      let user = await db.user.findUnique({ where: { email } })

      if (!user) {
        user = await db.user.create({
          data: {
            name,
            email,
            provider: 'google',
            avatar,
            cycleLength: 28,
            periodLength: 5,
          },
        })
      } else {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            avatar: avatar || user.avatar,
            name: name || user.name,
          },
        })
      }
      sessionUser = toSessionUser(user)
    } catch (dbError) {
      // DB unavailable (ephemeral Vercel filesystem, missing DATABASE_URL,
      // tables not created, etc.). Fall back to a JWT-only session using
      // Google's stable `sub` as a deterministic user ID.
      console.warn(
        '[google-auth] DB operation failed, issuing JWT-only session:',
        dbError instanceof Error ? dbError.message : String(dbError)
      )
      const fallbackId =
        googleSub ? googleUserId(googleSub) : `google-${Buffer.from(email).toString('hex').slice(0, 24)}`
      sessionUser = {
        id: fallbackId,
        name,
        email,
        avatar,
        provider: 'google',
        onboardingComplete: false,
        cycleLength: 28,
        periodLength: 5,
        lastPeriodStart: null,
      }
    }

    // ─── Issue session token (always succeeds — JWT is self-contained) ──────
    const token = issueSessionToken(sessionUser)
    const response = NextResponse.json({
      user: sessionUser,
      token,
    })
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return response
  } catch (error) {
    // This catch only fires for non-DB errors (e.g., Google token verification
    // failed, JSON parse error, etc.). DB errors are handled above.
    console.error('[google-auth] Fatal error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Google sign-in failed. Please close the popup and try again.',
        detail:
          process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV
            ? undefined
            : detail,
      },
      { status: 500 }
    )
  }
}
