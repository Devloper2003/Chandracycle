import { NextRequest, NextResponse } from 'next/server'
import { parseCookies, SESSION_COOKIE, getUserFromToken } from '@/lib/auth'
import { createOrder, isPaypalConfigured, PAYPAL_MODE } from '@/lib/paypal'

// ─── Real PayPal Orders API integration ──────────────────────────────────────
// POST  → creates a real PayPal Order via REST API and returns the orderID
//         that the client uses with the PayPal JS SDK to approve the payment.
// GET   → health check + configuration info.

const PLAN_PRICES: Record<'premium' | 'plus', { monthly: number; yearly: number }> = {
  premium: { monthly: 299, yearly: 2499 },
  plus: { monthly: 599, yearly: 4999 },
}

// PayPal charges in USD (INR is not supported for most sandbox/merchant
// accounts — PayPal returns CURRENCY_NOT_SUPPORTED). These USD prices are the
// INR prices converted at ~₹83/$ and rounded to clean .99 values.
const PLAN_PRICES_USD: Record<'premium' | 'plus', { monthly: number; yearly: number }> = {
  premium: { monthly: 3.99, yearly: 29.99 },
  plus: { monthly: 7.99, yearly: 59.99 },
}

const PLAN_NAMES: Record<'premium' | 'plus', string> = {
  premium: 'ChandraCycle Premium',
  plus: 'ChandraCycle Premium Plus',
}

const GST_RATE = 0.18

// PayPal charges in USD; the INR breakdown is shown to the user for reference.
const PAYPAL_CURRENCY = 'USD'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export async function POST(request: NextRequest) {
  try {
    // ─── Fail fast if PayPal is not configured ───────────────────────────────
    if (!isPaypalConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.',
        },
        { status: 503 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as {
      planId?: 'premium' | 'plus'
      billingCycle?: 'monthly' | 'yearly'
    }

    const planId = body.planId
    const billingCycle = body.billingCycle
    if (!planId || !(planId in PLAN_PRICES)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or missing planId. Must be "premium" or "plus".' },
        { status: 400 },
      )
    }
    if (!billingCycle || (billingCycle !== 'monthly' && billingCycle !== 'yearly')) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or missing billingCycle. Must be "monthly" or "yearly".' },
        { status: 400 },
      )
    }

    const basePriceINR = PLAN_PRICES[planId][billingCycle]
    const subtotalINR = round2(basePriceINR)
    const gstINR = round2(subtotalINR * GST_RATE)
    const totalINR = round2(subtotalINR + gstINR)

    // USD amount for PayPal (INR not supported by PayPal sandbox)
    const usdAmount = round2(PLAN_PRICES_USD[planId][billingCycle])

    // ─── Resolve session user (for custom_id / receipt) ──────────────────────
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

    const customId = `chandracycle_${userId || 'guest'}_${planId}_${billingCycle}_${Date.now()}`
    const planName = PLAN_NAMES[planId]

    // ─── Create the REAL PayPal Order (in USD) ───────────────────────────────
    const order = await createOrder({
      amount: usdAmount,
      currency: PAYPAL_CURRENCY,
      description: `${planName} — ${billingCycle} subscription`,
      customId,
    })

    // Find the approval URL (rel="approve") — the client uses the orderID with
    // the PayPal JS SDK, but we also return this for the redirect flow.
    const approveLink = order.links.find((l) => l.rel === 'approve')?.href

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      status: order.status,
      approveUrl: approveLink,
      // What PayPal actually charges:
      amount: usdAmount,
      currency: PAYPAL_CURRENCY,
      displayAmount: `$${usdAmount.toFixed(2)}`,
      // INR reference (for display):
      inrBreakdown: { subtotal: subtotalINR, gst: gstINR, total: totalINR },
      inrDisplayAmount: formatINR(totalINR),
      planId,
      planName,
      billingCycle,
      buyerEmail: buyerEmail || undefined,
      buyerName: buyerName ?? undefined,
    })
  } catch (error) {
    console.error('[/api/payment/paypal POST]', error)
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/payment/paypal',
    method: 'POST',
    description: 'Creates a real PayPal Order for ChandraCycle premium subscriptions.',
    configured: isPaypalConfigured(),
    mode: PAYPAL_MODE,
    publicClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: PAYPAL_CURRENCY,
    plansINR: Object.fromEntries(
      Object.entries(PLAN_PRICES).map(([id, prices]) => [id, prices]),
    ),
    plansUSD: Object.fromEntries(
      Object.entries(PLAN_PRICES_USD).map(([id, prices]) => [id, prices]),
    ),
    gstRate: GST_RATE,
    note: 'PayPal charges in USD (INR not supported by PayPal sandbox). INR prices shown for reference.',
    flow: 'POST /api/payment/paypal → orderId → client approves via PayPal JS SDK → POST /api/payment/paypal/capture',
  })
}
