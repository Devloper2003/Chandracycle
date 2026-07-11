import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

// ─── Razorpay Webhook Handler ────────────────────────────────────────────────
// Razorpay sends webhook events for payment lifecycle changes. We verify the
// X-Razorpay-Signature header against the raw request body using HMAC SHA256,
// then handle the events we care about. Always return 200 quickly so Razorpay
// doesn't retry.
//
// https://razorpay.com/docs/webhooks/

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || ''

interface RazorpayWebhookEvent {
  event?: string
  payload?: {
    payment?: {
      entity?: {
        id?: string
        order_id?: string
        amount?: number
        status?: string
        notes?: Record<string, string>
      }
    }
    subscription?: {
      entity?: {
        id?: string
        status?: string
        notes?: Record<string, string>
      }
    }
  }
}

function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET) return false
  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(signature, 'hex')
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    // If the webhook secret isn't configured, refuse to process. This avoids
    // silently accepting unverified events.
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 401 })
    }

    const ok = verifyWebhookSignature(rawBody, signature)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let event: RazorpayWebhookEvent
    try {
      event = JSON.parse(rawBody) as RazorpayWebhookEvent
    } catch {
      // Malformed body — still 200 so Razorpay doesn't retry garbage.
      return NextResponse.json({ received: true })
    }

    const eventType = event.event || 'unknown'

    switch (eventType) {
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity
        const userId = payment?.notes?.userId
        const transactionId = payment?.id
        if (userId && transactionId) {
          try {
            await db.subscription.updateMany({
              where: { transactionId },
              data: { status: 'active' },
            })
            await db.user.update({
              where: { id: userId },
              data: { subscriptionStatus: 'active' },
            })
          } catch (e) {
            console.error('[subscription webhook] payment.captured update failed', e)
          }
        }
        break
      }
      case 'subscription.cancelled': {
        const sub = event.payload?.subscription?.entity
        const userId = sub?.notes?.userId
        if (userId) {
          try {
            await db.user.update({
              where: { id: userId },
              data: { subscriptionStatus: 'cancelled' },
            })
          } catch (e) {
            console.error('[subscription webhook] subscription.cancelled update failed', e)
          }
        }
        break
      }
      default:
        // Unknown event — acknowledge so Razorpay doesn't retry.
        break
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[subscription webhook]', e)
    // Still return 200 so Razorpay doesn't retry our internal failures —
    // we've logged the error for ops follow-up.
    return NextResponse.json({ received: true })
  }
}
