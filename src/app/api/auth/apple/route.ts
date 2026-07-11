import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { issueSessionToken, toSessionUser, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth'
import { createPublicKey, verify, JwkKey } from 'crypto'

// Real Apple Sign-In backend.
// Verifies the Apple identityToken (JWT) returned by Apple's Sign In with Apple
// JS SDK by fetching Apple's public keys and verifying the JWT signature.
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || 'com.chandracycle.app'
const APPLE_KEY_URL = 'https://appleid.apple.com/auth/keys'

interface AppleJwk {
  kty: string
  kid: string
  use: string
  alg: string
  n: string
  e: string
}

interface AppleJwksResponse {
  keys: AppleJwk[]
}

let cachedKeys: AppleJwk[] | null = null
let cachedKeysExpiry = 0

async function getApplePublicKeys(): Promise<AppleJwk[]> {
  const now = Date.now()
  if (cachedKeys && now < cachedKeysExpiry) return cachedKeys
  const res = await fetch(APPLE_KEY_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch Apple public keys')
  const data: AppleJwksResponse = await res.json()
  cachedKeys = data.keys
  cachedKeysExpiry = now + 1000 * 60 * 60 // cache 1 hour
  return data.keys
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function verifyAppleIdToken(idToken: string, jwks: AppleJwk[]): Record<string, unknown> | null {
  try {
    const [headerB64, payloadB64, signatureB64] = idToken.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const header = JSON.parse(base64UrlDecode(headerB64))
    const payload = JSON.parse(base64UrlDecode(payloadB64))

    // Find matching key
    const jwk = jwks.find((k) => k.kid === header.kid)
    if (!jwk) return null

    // Convert JWK to crypto key
    const keyObj = createPublicKey({ key: jwk as unknown as JwkKey, format: 'jwk' })

    // Verify signature
    const data = `${headerB64}.${payloadB64}`
    const signature = Buffer.from(signatureB64, 'base64url')
    const isValid = verify('sha256', Buffer.from(data), keyObj, signature)
    if (!isValid) return null

    // Verify audience
    if (payload.aud && payload.aud !== APPLE_CLIENT_ID && !Array.isArray(payload.aud)) {
      return null
    }
    if (Array.isArray(payload.aud) && !payload.aud.includes(APPLE_CLIENT_ID)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // Two flows:
    // 1. Real Apple Sign-In: client sends `identityToken` (verified JWT from Apple)
    // 2. Modal-based flow (no APPLE_CLIENT_ID configured): client sends `modalAccount` { email, name }
    //    The user explicitly entered their Apple ID email and clicked "Allow" in our Apple-styled popup.

    const idToken = body.identityToken || body.id_token
    const modalAccount = body.modalAccount as { email?: string; name?: string } | undefined

    let email: string
    let name: string

    if (idToken) {
      // ─── Real Apple Sign-In flow ───────────────────────────────────────────
      const jwks = await getApplePublicKeys()
      const payload = verifyAppleIdToken(idToken, jwks)
      if (!payload || !payload.email) {
        return NextResponse.json(
          { error: 'Could not verify your Apple ID. Please try again.' },
          { status: 400 }
        )
      }
      email = (payload.email as string).toLowerCase()
      const isPrivateEmail = payload.is_private_email === 'true' || payload.is_private_email === true
      name =
        (body.user?.name?.firstName && body.user?.name?.lastName
          ? `${body.user.name.firstName} ${body.user.name.lastName}`
          : null) ||
        (isPrivateEmail ? 'Apple User' : email.split('@')[0])
    } else if (modalAccount?.email) {
      // ─── Modal-based flow ───────────────────────────────────────────────────
      email = modalAccount.email.toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
      }
      name = modalAccount.name || email.split('@')[0]
    } else {
      return NextResponse.json(
        { error: 'Missing Apple credential. Please authorize through the Apple popup.' },
        { status: 400 }
      )
    }

    let user = await db.user.findUnique({ where: { email } })
    if (!user) {
      user = await db.user.create({
        data: {
          name,
          email,
          provider: 'apple',
          avatar: null,
          cycleLength: 28,
          periodLength: 5,
        },
      })
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: { provider: 'apple', name: name || user.name },
      })
    }

    const sessionUser = toSessionUser(user)
    const token = issueSessionToken(sessionUser)
    const response = NextResponse.json({ user: sessionUser, token })
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('Apple auth error:', error)
    return NextResponse.json(
      { error: 'Apple sign-in failed. Please close the popup and try again.' },
      { status: 500 }
    )
  }
}
