import { NextRequest, NextResponse } from 'next/server'
import { parseCookies, SESSION_COOKIE, verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/auth/debug
// Diagnostics endpoint for diagnosing login issues on Vercel.
// Reports: which env vars are set (without leaking values), whether the
// session cookie is present, whether the JWT verifies, whether the DB is
// reachable, and the user record (if any). Safe to leave enabled — no
// secrets are exposed.
export async function GET(request: NextRequest) {
  const cookies = parseCookies(request.headers.get('cookie'))
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const token = cookies[SESSION_COOKIE] || headerToken

  const payload = token ? verifyToken(token) : null
  const sub = payload && typeof payload.sub === 'string' ? payload.sub : null

  let dbStatus: 'ok' | 'error' | 'unknown' = 'unknown'
  let dbUserCount: number | null = null
  let dbError: string | null = null
  try {
    dbUserCount = await db.user.count()
    dbStatus = 'ok'
  } catch (e) {
    dbStatus = 'error'
    dbError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    runtime: {
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      region: process.env.VERCEL_REGION ?? null,
      nextPhase: process.env.NEXT_PHASE ?? null,
    },
    env: {
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: process.env.DATABASE_URL
        ? `<redacted, length=${process.env.DATABASE_URL.length}, prefix=${process.env.DATABASE_URL.slice(0, 8)}...>`
        : null,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      APPLE_CLIENT_ID: !!process.env.APPLE_CLIENT_ID,
    },
    session: {
      cookiePresent: !!cookies[SESSION_COOKIE],
      headerTokenPresent: !!headerToken,
      tokenPresent: !!token,
      tokenVerified: !!payload,
      tokenSub: sub ?? null,
      tokenHasEmbeddedUser: !!(payload?.u as Record<string, unknown> | undefined)?.email,
      tokenExp: payload?.exp ?? null,
    },
    database: {
      status: dbStatus,
      userCount: dbUserCount,
      error: dbError,
    },
  })
}
