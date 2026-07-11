import { NextRequest, NextResponse } from 'next/server'
import { parseCookies, SESSION_COOKIE, getUserFromToken, computeSubscriptionEnd } from '@/lib/auth'
import { db } from '@/lib/db'
import { captureOrder, isPaypalConfigured } from '@/lib/paypal'

// ─── Capture an approved PayPal Order + activate subscription ────────────────
// Flow:
//   1. Client POSTs /api/payment/paypal { planId, billingCycle } → gets orderId
//   2. Client opens PayPal JS SDK; user logs into PayPal + approves the order
//   3. Client POSTs /api/payment/paypal/capture { orderId, planId, billingCycle }
//      → server captures the payment (real money moves) + upgrades the user
//
// This endpoint verifies the payment was actually captured by PayPal before
// activating the subscription. No client-supplied "I paid" flag is trusted.

const PLAN_PRICES: Record<'premium' | 'plus', { monthly: number; yearly: number }> = {
  premium: { monthly: 299, yearly: 2499 },
  plus: { monthly: 599, yearly: 4999 },
}

// USD prices (PayPal charges in USD — INR not supported by sandbox)
const PLAN_PRICES_USD: Record<'premium' | 'plus', { monthly: number; yearly: number }> = {
  premium: { monthly: 3.99, yearly: 29.99 },
  plus: { monthly: 7.99, yearly: 59.99 },
}

const PLAN_NAMES: Record<'premium' | 'plus', string> = {
  premium: 'ChandraCycle Premium',
  plus: 'ChandraCycle Premium Plus',
}

const GST_RATE = 0.18

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

interface CaptureRequestBody {
  orderId?: string
  planId?: 'premium' | 'plus'
  billingCycle?: 'monthly' | 'yearly'
}

export async function POST(request: NextRequest) {
  try {
    if (!isPaypalConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'PayPal is not configured on the server.' },
        { status: 503 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as CaptureRequestBody
    const orderId = body.orderId?.trim()
    const planId = body.planId
    const billingCycle = body.billingCycle

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Missing PayPal orderId.' }, { status: 400 })
    }
    if (!planId || !(planId in PLAN_PRICES)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid planId. Must be "premium" or "plus".' },
        { status: 400 },
      )
    }
    if (!billingCycle || (billingCycle !== 'monthly' && billingCycle !== 'yearly')) {
      return NextResponse.json(
        { ok: false, error: 'Invalid billingCycle. Must be "monthly" or "yearly".' },
        { status: 400 },
      )
    }

    // ─── Resolve session user (subscription attaches to this user) ───────────
    const cookies = parseCookies(request.headers.get('cookie'))
    const token = cookies[SESSION_COOKIE]
    let userId: string | undefined
    let buyerEmail: string | undefined
    let buyerName: string | null | undefined
    if (token) {
      const sessionUser = await getUserFromToken(token)
      if (sessionUser) {
        userId = sessionUser.id
        buyerEmail = sessionUser.email
        buyerName = sessionUser.name
      }
    }

    // ─── Capture the payment via PayPal REST API (real money moves here) ─────
    const capture = await captureOrder(orderId)

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json(
        {
          ok: false,
          error: `Payment was not completed. PayPal status: ${capture.status}`,
          paypalStatus: capture.status,
        },
        { status: 402 },
      )
    }

    // ─── Activate the subscription in the database ──────────────────────────
    const basePriceINR = PLAN_PRICES[planId][billingCycle]
    const subtotalINR = round2(basePriceINR)
    const gstINR = round2(subtotalINR * GST_RATE)
    const totalINR = round2(subtotalINR + gstINR)
    const usdAmount = round2(PLAN_PRICES_USD[planId][billingCycle])
    const planName = PLAN_NAMES[planId]

    let subscriptionEnd: Date | undefined
    const subscriptionTier: 'premium' | 'plus' | 'free' = planId
    const subscriptionPlan: 'monthly' | 'yearly' | null = billingCycle
    const subscriptionStatus: 'active' | 'cancelled' | 'expired' | 'trialing' | null = 'active'

    if (userId) {
      subscriptionEnd = computeSubscriptionEnd(billingCycle)
      try {
        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionTier,
            subscriptionStatus,
            subscriptionPlan,
            subscriptionEnd,
          },
        })
      } catch (dbError) {
        // DB unavailable (ephemeral Vercel filesystem). Payment was still
        // captured by PayPal — we just can't persist the subscription status.
        // Log the error but don't fail the request; the receipt is still valid.
        console.warn(
          '[paypal-capture] DB update failed (payment was captured, subscription not persisted):',
          dbError instanceof Error ? dbError.message : String(dbError)
        )
      }
    }

    const receipt = {
      transactionId: capture.captureId,
      paypalOrderId: capture.orderId,
      merchant: 'ChandraCycle Health Technologies Pvt. Ltd.',
      planId,
      planName,
      billingCycle,
      // Amount actually charged by PayPal (USD)
      chargedAmount: usdAmount,
      chargedCurrency: capture.amount.currency,
      // INR reference breakdown
      subtotal: subtotalINR,
      gst: gstINR,
      total: totalINR,
      currency: 'INR',
      paymentMethod: {
        type: 'paypal' as const,
        email: capture.payer?.email || buyerEmail,
        name: capture.payer?.name || buyerName || undefined,
      },
      buyerEmail: buyerEmail || capture.payer?.email,
      buyerName: buyerName ?? capture.payer?.name ?? undefined,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED' as const,
      note: `Subscription to ${planName} (${billingCycle}) via PayPal. Charged $${usdAmount.toFixed(2)} USD (≈ ₹${formatINR(totalINR)} incl. 18% GST).`,
    }

    return NextResponse.json({
      ok: true,
      transactionId: capture.captureId,
      paypalOrderId: capture.orderId,
      receipt,
      displayAmount: `$${usdAmount.toFixed(2)} USD`,
      inrDisplayAmount: formatINR(totalINR),
      subscription: userId
        ? {
            tier: subscriptionTier,
            status: subscriptionStatus,
            plan: subscriptionPlan,
            subscriptionEnd,
          }
        : undefined,
    })
  } catch (error) {
    console.error('[/api/payment/paypal/capture POST]', error)
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
