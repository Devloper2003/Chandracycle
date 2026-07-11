// ─── PayPal REST API client (server-side only) ───────────────────────────────
// https://developer.paypal.com/api/rest/
//
// Uses the OAuth2 client-credentials flow to obtain an access token, then
// creates + captures orders via the /v2/checkout/orders endpoints.
//
// Credentials come from .env:
//   PAYPAL_CLIENT_ID
//   PAYPAL_CLIENT_SECRET
//   PAYPAL_MODE = "sandbox" | "live"

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
export const PAYPAL_MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'

const API_BASE =
  PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

export function isPaypalConfigured(): boolean {
  return !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET)
}

// ─── Access token (cached in memory) ─────────────────────────────────────────
interface TokenCache {
  token: string
  expiresAt: number // epoch ms
}
let tokenCache: TokenCache | null = null

async function getAccessToken(): Promise<string> {
  if (!isPaypalConfigured()) {
    throw new Error('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.')
  }

  // Reuse cached token if it has >60s of life left
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt - now > 60_000) {
    return tokenCache.token
  }

  const authHeader =
    'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[paypal] getAccessToken failed', res.status, errText)
    throw new Error(`PayPal auth failed (${res.status})`)
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number // seconds
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }
  return tokenCache.token
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface PaypalOrderAmount {
  value: string // e.g. "354.00"
  currency: string // e.g. "INR" or "USD"
}

export interface CreatedPaypalOrder {
  id: string // PayPal order ID
  status: string // "CREATED" | "APPROVED" | "COMPLETED"
  links: {
    href: string
    rel: string // "approve" | "capture" | "self"
    method: string
  }[]
}

export interface CapturedPaypalPayment {
  orderId: string
  status: string // "COMPLETED"
  captureId: string // the actual transaction id (from capture breakdown)
  amount: PaypalOrderAmount
  payer?: {
    email?: string
    name?: string
  }
  raw: unknown
}

// ─── Create an order ─────────────────────────────────────────────────────────
// https://developer.paypal.com/api/orders/v2/#orders-create
export async function createOrder(params: {
  amount: number // total in major units (e.g. 354.00)
  currency: string // "INR" | "USD"
  description: string
  customId?: string // our internal reference (e.g. userId + plan)
  returnUrl?: string
  cancelUrl?: string
}): Promise<CreatedPaypalOrder> {
  const token = await getAccessToken()
  const { amount, currency, description, customId, returnUrl, cancelUrl } = params

  const body: Record<string, unknown> = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description,
        ...(customId ? { custom_id: customId } : {}),
      },
    ],
    ...(returnUrl || cancelUrl
      ? {
          application_context: {
            ...(returnUrl ? { return_url: returnUrl } : {}),
            ...(cancelUrl ? { cancel_url: cancelUrl } : {}),
            brand_name: 'ChandraCycle Health',
            user_action: 'PAY_NOW',
          },
        }
      : {}),
  }

  const res = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[paypal] createOrder failed', res.status, errText)
    throw new Error(`PayPal create-order failed (${res.status})`)
  }

  const data = (await res.json()) as CreatedPaypalOrder
  return data
}

// ─── Capture an approved order ───────────────────────────────────────────────
// https://developer.paypal.com/api/orders/v2/#orders_capture
export async function captureOrder(orderId: string): Promise<CapturedPaypalPayment> {
  const token = await getAccessToken()

  const res = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[paypal] captureOrder failed', res.status, errText)
    throw new Error(`PayPal capture failed (${res.status})`)
  }

  const data = (await res.json()) as {
    id: string
    status: string
    payer?: { email_address?: string; name?: { given_name?: string; surname?: string } }
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          id: string
          status: string
          amount: { value: string; currency_code: string }
        }>
      }
    }>
  }

  const capture =
    data.purchase_units?.[0]?.payments?.captures?.[0]

  if (!capture) {
    throw new Error('PayPal capture response missing capture breakdown')
  }

  const payerName = data.payer?.name
    ? `${data.payer.name.given_name ?? ''} ${data.payer.name.surname ?? ''}`.trim()
    : undefined

  return {
    orderId: data.id,
    status: capture.status || data.status,
    captureId: capture.id,
    amount: {
      value: capture.amount.value,
      currency: capture.amount.currency_code,
    },
    payer: {
      email: data.payer?.email_address,
      name: payerName,
    },
    raw: data,
  }
}

// ─── Fetch order details (for verifying status) ──────────────────────────────
export async function getOrder(orderId: string): Promise<{
  id: string
  status: string
  amount?: PaypalOrderAmount
}> {
  const token = await getAccessToken()
  const res = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[paypal] getOrder failed', res.status, errText)
    throw new Error(`PayPal get-order failed (${res.status})`)
  }
  const data = (await res.json()) as {
    id: string
    status: string
    purchase_units?: Array<{
      amount?: { value: string; currency_code: string }
      payments?: { captures?: Array<{ amount: { value: string; currency_code: string } }> }
    }>
  }
  const amt =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.amount ||
    data.purchase_units?.[0]?.amount
  return {
    id: data.id,
    status: data.status,
    amount: amt
      ? { value: amt.value, currency: amt.currency_code }
      : undefined,
  }
}
