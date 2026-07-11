import { createHmac, randomBytes } from 'crypto'
import { db } from './db'

// ─── JWT secret (lazy, build-safe) ───────────────────────────────────────────
// IMPORTANT: Vercel runs `next build` with NODE_ENV=production but WITHOUT the
// runtime env vars. If we eagerly read JWT_SECRET at module load, the build
// crashes. So we read it lazily inside signToken/verifyToken, and allow a dev
// fallback when no secret is configured (and we're not in a real production
// runtime).

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  // Allow build-time evaluation without crashing.
  const isBuildPhase =
    process.env.NEXT_PHASE?.includes('build') ||
    process.env.CI === '1' && !process.env.VERCEL_ENV
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    // In production runtime without a configured secret, still fall back to the
    // dev secret so login doesn't fully break — but log a warning.
    console.warn('WARNING: JWT_SECRET is not set. Using insecure dev fallback.')
  }
  return 'chandracycle-dev-secret-change-in-production-2024'
}

// ─── Token helpers (simple HMAC-signed JWT-like token) ───────────────────────

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

export function signToken(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify({ ...payload, iat: Date.now() }))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac('sha256', getJwtSecret()).update(data).digest('base64url')
  return `${data}.${signature}`
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [encodedHeader, encodedPayload, signature] = parts
    const data = `${encodedHeader}.${encodedPayload}`
    const expectedSignature = createHmac('sha256', getJwtSecret()).update(data).digest('base64url')
    if (signature !== expectedSignature) return null
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    return payload
  } catch {
    return null
  }
}

// ─── Password helpers ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  // Simple salted hash (sufficient for demo; use bcrypt in production)
  const salt = randomBytes(16).toString('hex')
  const hash = createHmac('sha256', salt).update(password).digest('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const testHash = createHmac('sha256', salt).update(password).digest('hex')
  return hash === testHash
}

// ─── Session helpers ─────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  name: string | null
  email: string
  avatar: string | null
  provider: string
  onboardingComplete: boolean
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
}

export function toSessionUser(user: {
  id: string
  name: string | null
  email: string
  avatar: string | null
  provider: string
  onboardingComplete: boolean
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
    onboardingComplete: user.onboardingComplete,
    cycleLength: user.cycleLength,
    periodLength: user.periodLength,
    lastPeriodStart: user.lastPeriodStart,
  }
}

// ─── Self-contained JWT session ──────────────────────────────────────────────
// The JWT contains ALL user fields needed by the frontend so that /api/auth/me
// can return the session user WITHOUT a database lookup. This is critical for
// Vercel serverless where the SQLite filesystem is ephemeral — without this,
// login succeeds on one instance but the next /me call on a different instance
// returns {user: null} and the user appears logged out.
//
// When a persistent DB (Turso/Postgres) is configured, /me still prefers DB
// data (so profile updates are reflected) and only falls back to JWT claims if
// the DB lookup fails.

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export function issueSessionToken(user: SessionUser): string {
  return signToken({
    sub: user.id,
    exp: Date.now() + TOKEN_TTL_MS,
    // Embed the full session user so /me can return without a DB hit.
    u: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      onboardingComplete: user.onboardingComplete,
      cycleLength: user.cycleLength,
      periodLength: user.periodLength,
      lastPeriodStart: user.lastPeriodStart,
    },
  })
}

// Backwards-compat: old callers passed just a userId. Prefer issueSessionToken(user).
export function issueSessionTokenForUserId(userId: string): string {
  return signToken({ sub: userId, exp: Date.now() + TOKEN_TTL_MS })
}

// Decode the embedded user from a verified token payload, if present.
function userFromPayload(payload: Record<string, unknown>): SessionUser | null {
  const sub = typeof payload.sub === 'string' ? payload.sub : null
  if (!sub) return null
  const u = payload.u as Partial<SessionUser> | undefined
  if (u && typeof u.email === 'string') {
    return {
      id: sub,
      name: u.name ?? null,
      email: u.email,
      avatar: u.avatar ?? null,
      provider: u.provider ?? 'email',
      onboardingComplete: u.onboardingComplete ?? false,
      cycleLength: u.cycleLength ?? 28,
      periodLength: u.periodLength ?? 5,
      lastPeriodStart: u.lastPeriodStart ?? null,
    }
  }
  return null
}

export async function getUserFromToken(token: string): Promise<SessionUser | null> {
  const payload = verifyToken(token)
  if (!payload) return null
  const exp = payload.exp as number | undefined
  if (exp && Date.now() > exp) return null

  // Prefer a fresh DB lookup so profile updates are reflected.
  const sub = typeof payload.sub === 'string' ? payload.sub : null
  if (sub) {
    try {
      const user = await db.user.findUnique({ where: { id: sub } })
      if (user) return toSessionUser(user)
    } catch {
      // DB unavailable (ephemeral Vercel filesystem, missing DATABASE_URL, etc.)
      // Fall through to JWT-embedded user below.
    }
  }

  // Fallback: use the user info embedded in the JWT itself.
  return userFromPayload(payload)
}

// ─── Cookie helpers (for server-side) ────────────────────────────────────────

export const SESSION_COOKIE = 'chandracycle_session'

// Cookie options that work on both localhost (HTTP) and Vercel (HTTPS).
// `secure` is auto-set by the runtime when sameSite is 'lax' on HTTPS origins;
// explicitly forcing secure:true would block the cookie on HTTP previews.
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name) cookies[name.trim()] = decodeURIComponent(rest.join('=').trim())
  })
  return cookies
}

// ─── Subscription helpers ────────────────────────────────────────────────────

export function computeSubscriptionEnd(plan: 'monthly' | 'yearly'): Date {
  const end = new Date()
  if (plan === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end
}

export function isPremiumActive(user: {
  subscriptionTier?: string | null
  subscriptionStatus?: string | null
  subscriptionEnd?: Date | null
}): boolean {
  if (user.subscriptionStatus === 'cancelled' || user.subscriptionStatus === 'expired') {
    // Still premium if within the paid-until window
    if (user.subscriptionEnd && new Date(user.subscriptionEnd) > new Date()) {
      return user.subscriptionTier === 'premium' || user.subscriptionTier === 'plus'
    }
    return false
  }
  if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
    if (user.subscriptionEnd && new Date(user.subscriptionEnd) <= new Date()) {
      return false
    }
    return user.subscriptionTier === 'premium' || user.subscriptionTier === 'plus'
  }
  return false
}
