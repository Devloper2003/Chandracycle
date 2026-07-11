import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { computeSubscriptionEnd } from '@/lib/auth'

// ─── Payment Signature Verification + Subscription Activation ────────────────
// Receives the Razorpay Checkout response (payment_id, order_id, signature)
// plus the chosen plan + userId, verifies the HMAC SHA256 signature against
// RAZORPAY_KEY_SECRET, and only then creates the Subscription row + upgrades
// the User to premium.
//
// https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/#step-5-verify-the-signature

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

interface VerifyBody {
  razorpay_payment_id?: string
  razorpay_order_id?: string
  razorpay_signature?: string
  plan?: 'monthly' | 'yearly'
  userId?: string
}

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!RAZORPAY_KEY_SECRET) return false
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
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
    const body = (await req.json().catch(() => ({}))) as VerifyBody
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      plan,
      userId,
    } = body

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !plan ||
      !userId
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // If Razorpay isn't configured or signature verification fails → 401.
    if (!RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payments not configured' }, { status: 401 })
    }

    const ok = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )
    if (!ok) {
      return NextResponse.json(
        { error: 'Payment signature verification failed' },
        { status: 401 }
      )
    }

    // Signature is valid — activate the subscription.
    const base = plan === 'yearly' ? 500 : 50
    const gst = Math.round(base * 0.18)
    const total = base + gst
    const now = new Date()
    const end = computeSubscriptionEnd(plan)

    const subscription = await db.subscription.create({
      data: {
        userId,
        plan,
        amount: base,
        gst,
        total,
        currency: 'INR',
        status: 'active',
        startDate: now,
        endDate: end,
        paymentMethod: 'razorpay',
        transactionId: razorpay_payment_id,
        invoiceId: razorpay_order_id,
      },
    })

    const user = await db.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionPlan: plan,
        subscriptionStart: now,
        subscriptionEnd: end,
      },
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        amount: subscription.amount,
        gst: subscription.gst,
        total: subscription.total,
        currency: subscription.currency,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        transactionId: subscription.transactionId,
        invoiceId: subscription.invoiceId,
      },
      user: {
        id: user.id,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStart: user.subscriptionStart,
        subscriptionEnd: user.subscriptionEnd,
      },
    })
  } catch (e) {
    console.error('[subscription verify POST]', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
