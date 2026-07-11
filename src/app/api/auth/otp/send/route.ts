import { NextRequest, NextResponse } from 'next/server'
import { sendOtp, normalisePhone, cleanupExpired } from '@/lib/otp'

// POST /api/auth/otp/send
// Body: { phone: string }
// Sends a 6-digit OTP to the given phone number.
//
// In dev/sandbox mode (no SMS gateway configured), the OTP is returned in the
// response as `devCode` so the frontend can display it for the user to enter.
// In production with a real SMS gateway (Twilio/MSG91), `devCode` would be
// undefined and the OTP would be delivered via SMS.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (!rawPhone) {
      return NextResponse.json({ error: 'Please enter your mobile number.' }, { status: 400 })
    }

    const phone = normalisePhone(rawPhone)
    if (!phone) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      )
    }

    cleanupExpired()
    const result = sendOtp(phone)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 429 })
    }

    // In dev/sandbox mode (no real SMS gateway configured), we ALSO return the
    // code to the client so the frontend can display it in a "Demo OTP" banner
    // for the user to enter. This is essential for testing in environments
    // without an SMS provider. In production with a real gateway (Twilio /
    // MSG91), `devCode` is undefined and the code is delivered via SMS only.
    if (result.devCode) {
      console.log(`[OTP] ${phone} → code ${result.devCode} (expires in 5 min)`)
    }

    return NextResponse.json({
      ok: true,
      message: `OTP sent to ${phone}`,
      // Returned ONLY when no SMS gateway is configured (dev/sandbox mode).
      // The frontend shows this in a clearly-labelled "Demo OTP" banner.
      devCode: result.devCode,
      resendAfterSec: result.resendAfterSec,
      maskedPhone: maskPhone(phone),
    })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    )
  }
}

function maskPhone(phone: string): string {
  // +919876543210 → +91 •••• ••21
  const last4 = phone.slice(-4)
  const last2 = phone.slice(-2)
  return `+91 •••• ••${last2} (ending ${last4})`
}
