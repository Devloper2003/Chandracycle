import { randomInt } from 'crypto'

// ─── In-memory OTP store (singleton, survives HMR) ─────────────────────────
//
// Each entry: phone → { code, expiresAt, attempts, lastSentAt }
// - expiresAt: 5 minutes from generation
// - attempts:  wrong-verify counter (max 5)
// - lastSentAt: rate-limit resends (min 30s gap)

interface OtpEntry {
  code: string
  expiresAt: number
  attempts: number
  lastSentAt: number
}

const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes
const RESEND_GAP_MS = 30 * 1000 // 30 seconds between resends
const MAX_ATTEMPTS = 5

type OtpStore = Map<string, OtpEntry>

const globalForOtp = globalThis as unknown as { __CHANDRACYCLE_OTP_STORE__?: OtpStore }

const store: OtpStore =
  globalForOtp.__CHANDRACYCLE_OTP_STORE__ ?? (globalForOtp.__CHANDRACYCLE_OTP_STORE__ = new Map())

export interface OtpSendResult {
  ok: boolean
  error?: string
  // In dev/sandbox mode (no real SMS gateway), we return the code so the
  // frontend can display it for the user to enter — production would use a
  // real SMS provider (Twilio, MSG91, etc.) and never return the code.
  devCode?: string
  resendAfterSec?: number
}

export interface OtpVerifyResult {
  ok: boolean
  error?: string
}

// Normalise Indian phone numbers to E.164-like "+91XXXXXXXXXX"
// Accepts: "9876543210", "+919876543210", "09876543210", "+91 98765 43210"
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '')
  let n = digits
  if (n.startsWith('+91')) n = n.slice(3)
  else if (n.startsWith('91') && n.length === 12) n = n.slice(2)
  else if (n.startsWith('0')) n = n.slice(1)
  if (!/^\d{10}$/.test(n)) return null
  // First digit must be 6-9 for valid Indian mobile
  if (!/^[6-9]/.test(n)) return null
  return `+91${n}`
}

export function sendOtp(phone: string): OtpSendResult {
  const entry = store.get(phone)

  // Rate-limit: must wait 30s between sends
  if (entry && Date.now() - entry.lastSentAt < RESEND_GAP_MS) {
    const wait = Math.ceil((RESEND_GAP_MS - (Date.now() - entry.lastSentAt)) / 1000)
    return {
      ok: false,
      error: `Please wait ${wait}s before requesting another OTP.`,
      resendAfterSec: wait,
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')

  store.set(phone, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: Date.now(),
  })

  // Dev/sandbox mode: no SMS gateway configured → return code so frontend can
  // display it. In production, you'd call your SMS provider here and NOT
  // return the code.
  const smsConfigured = !!(
    process.env.SMS_GATEWAY_API_KEY || process.env.TWILIO_ACCOUNT_SID
  )

  return {
    ok: true,
    devCode: smsConfigured ? undefined : code,
    resendAfterSec: Math.ceil(RESEND_GAP_MS / 1000),
  }
}

export function verifyOtp(phone: string, code: string): OtpVerifyResult {
  const entry = store.get(phone)

  if (!entry) {
    return { ok: false, error: 'No OTP was sent to this number. Please request a new code.' }
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(phone)
    return { ok: false, error: 'This OTP has expired. Please request a new code.' }
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(phone)
    return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' }
  }

  if (entry.code !== code.trim()) {
    entry.attempts += 1
    const remaining = MAX_ATTEMPTS - entry.attempts
    return {
      ok: false,
      error:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
    }
  }

  // Success: clear the entry so it can't be reused
  store.delete(phone)
  return { ok: true }
}

// Cleanup expired entries periodically (called on each send)
export function cleanupExpired() {
  const now = Date.now()
  for (const [phone, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(phone)
  }
}
