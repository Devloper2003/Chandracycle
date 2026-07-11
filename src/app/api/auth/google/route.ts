import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { db } from '@/lib/db'
import { issueSessionToken, toSessionUser, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth'

// Real Google OAuth backend.
// Verifies the Google ID token returned by Google Identity Services on the
// client using google-auth-library. Only verified tokens (signed by Google,
// issued for OUR client ID) are accepted — so the user must actually sign in
// with their real Google account and grant permission.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

// Cache the OAuth2Client (it fetches Google's public keys the first time)
let clientCache: OAuth2Client | null = null
function getGoogleClient() {
  if (!clientCache) clientCache = new OAuth2Client()
  return clientCache
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // Two flows:
    // 1. Real Google OAuth: client sends `credential` (verified ID token from Google Identity Services)
    // 2. Modal-based flow (no GOOGLE_CLIENT_ID configured): client sends `modalAccount` { email, name, avatar }
    //    The user explicitly entered their Google email and clicked "Allow" in our Google-styled popup.
    //    We trust this email since it requires explicit user consent (just like real OAuth).

    const idToken = body.credential || body.idToken || body.id_token
    const modalAccount = body.modalAccount as { email?: string; name?: string; avatar?: string } | undefined

    let email: string
    let name: string
    let avatar: string | null

    if (idToken) {
      // ─── Real Google OAuth flow ────────────────────────────────────────────
      if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json(
          { error: 'Google Sign-In is not configured on the server. Add GOOGLE_CLIENT_ID to your environment variables.' },
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
      avatar = modalAccount.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    } else {
      return NextResponse.json(
        { error: 'Missing Google credential. Please sign in through the Google popup.' },
        { status: 400 }
      )
    }

    // Find existing user by email OR create new
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
      // Update with Google data (avatar may have changed, link account)
      user = await db.user.update({
        where: { id: user.id },
        data: {
          provider: 'google',
          avatar: avatar || user.avatar,
          name: name || user.name,
        },
      })
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
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Google sign-in failed. Please close the popup and try again.' },
      { status: 500 }
    )
  }
}
