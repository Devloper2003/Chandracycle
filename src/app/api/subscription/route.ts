import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeSubscriptionEnd, isPremiumActive } from '@/lib/auth'

// ─── Razorpay configuration (env-var driven) ─────────────────────────────────
// When RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are both set in the environment,
// this route creates a real Razorpay Order via POST /v1/orders. When they are
// missing, the route returns 503 so the client can surface an honest
// "payments coming soon" message instead of silently activating a subscription.

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

const PLAN_AMOUNTS_PAISE: Record<'monthly' | 'yearly', number> = {
  // ₹50 base + 18% GST = ₹59 → 5900 paise
  monthly: 5900,
  // ₹500 base + 18% GST = ₹590 → 59000 paise
  yearly: 59000,
}

// Get the current user's subscription status
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const session = await db.authSession.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session || session.revoked || session.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const u = session.user
    return NextResponse.json({
      tier: u.subscriptionTier,
      status: u.subscriptionStatus,
      plan: u.subscriptionPlan,
      trialStartDate: u.trialStartDate,
      trialEndDate: u.trialEndDate,
      subscriptionEnd: u.subscriptionEnd,
      isPremium: isPremiumActive(u),
    })
  } catch (e) {
    console.error('[subscription GET]', e)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

// Create a Razorpay Order for the chosen plan.
// The Subscription row is NOT created here — the client must complete the
// Razorpay Checkout flow and POST the result to /api/subscription/verify,
// which verifies the signature and only then activates the subscription.
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const session = await db.authSession.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session || session.revoked || session.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const plan = body?.plan // 'monthly' | 'yearly'
    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // If Razorpay is not configured, refuse to activate. The client should
    // surface an honest "payments coming soon" message.
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        {
          error:
            'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.',
        },
        { status: 503 }
      )
    }

    const amount = PLAN_AMOUNTS_PAISE[plan]
    const receipt = `chandracycle_${session.user.id}_${Date.now()}`

    // Create the Razorpay Order via the Orders API.
    // https://razorpay.com/docs/api/orders/
    const authHeader =
      'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        payment_capture: 1,
        notes: {
          userId: session.user.id,
          plan,
        },
      }),
    })

    if (!rzpRes.ok) {
      const errText = await rzpRes.text().catch(() => '')
      console.error('[subscription POST] Razorpay order creation failed', rzpRes.status, errText)
      return NextResponse.json(
        { error: 'Failed to create payment order. Please try again.' },
        { status: 502 }
      )
    }

    const razorpayOrder = (await rzpRes.json()) as {
      id: string
      amount: number
      currency: string
      receipt?: string
      status?: string
    }

    // Return everything the client needs to open Razorpay Checkout.
    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
    })
  } catch (e) {
    console.error('[subscription POST]', e)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}

// Cancel subscription
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const session = await db.authSession.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionStatus: 'cancelled',
        // keep access until subscriptionEnd, then reverts
      },
    })

    return NextResponse.json({
      success: true,
      subscription: {
        tier: updated.subscriptionTier,
        status: updated.subscriptionStatus,
        plan: updated.subscriptionPlan,
        subscriptionEnd: updated.subscriptionEnd,
      },
    })
  } catch (e) {
    console.error('[subscription DELETE]', e)
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
  }
}
