import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { issueSessionToken, toSessionUser, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth'

// Apple redirects back here after the user signs in on appleid.apple.com.
// Apple POSTs `code`, `id_token`, `user` (first-time only), and `state`.
// We verify the id_token's signature using Apple's public keys, then create
// the session. (Same verification logic as /api/auth/apple — duplicated here
// because Apple's redirect flow uses form_post, not a JSON body.)
import { createPublicKey, verify, JwkKey } from 'crypto'

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

let cachedKeys: AppleJwk[] | null = null
let cachedKeysExpiry = 0

async function getApplePublicKeys(): Promise<AppleJwk[]> {
  const now = Date.now()
  if (cachedKeys && now < cachedKeysExpiry) return cachedKeys
  const res = await fetch(APPLE_KEY_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch Apple public keys')
  const data = await res.json()
  cachedKeys = data.keys
  cachedKeysExpiry = now + 1000 * 60 * 60
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

    const jwk = jwks.find((k) => k.kid === header.kid)
    if (!jwk) return null

    const keyObj = createPublicKey({ key: jwk as unknown as JwkKey, format: 'jwk' })

    const data = `${headerB64}.${payloadB64}`
    const signature = Buffer.from(signatureB64, 'base64url')
    const isValid = verify('sha256', Buffer.from(data), keyObj, signature)
    if (!isValid) return null

    if (payload.aud && payload.aud !== APPLE_CLIENT_ID && !Array.isArray(payload.aud)) return null
    if (Array.isArray(payload.aud) && !payload.aud.includes(APPLE_CLIENT_ID)) return null

    return payload
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const idToken = formData.get('id_token') as string | null
    const state = formData.get('state') as string | null
    const userJson = formData.get('user') as string | null

    if (!idToken) {
      return NextResponse.redirect(new URL('/?apple_error=missing_token', request.url))
    }

    const jwks = await getApplePublicKeys()
    const payload = verifyAppleIdToken(idToken, jwks)
    if (!payload || !payload.email) {
      return NextResponse.redirect(new URL('/?apple_error=invalid_token', request.url))
    }

    const email = (payload.email as string).toLowerCase()
    const isPrivateEmail = payload.is_private_email === 'true' || payload.is_private_email === true

    let name = isPrivateEmail ? 'Apple User' : email.split('@')[0]
    if (userJson) {
      try {
        const userData = JSON.parse(userJson)
        if (userData?.name?.firstName) {
          name = `${userData.name.firstName} ${userData.name.lastName || ''}`.trim()
        }
      } catch {
        // ignore parse errors
      }
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
    const redirectUrl = new URL('/', request.url)
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    // Also set a non-httpOnly flag the client can read to know they're authed
    response.cookies.set('chandracycle_apple_just_signed_in', '1', {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Apple callback error:', error)
    return NextResponse.redirect(new URL('/?apple_error=server', request.url))
  }
}
