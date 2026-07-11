---
Task ID: 7
Agent: Payment Production-Readiness Agent
Task: Real Razorpay scaffold + premium.tsx false claims + paywall bypass removal

Work Log:
- Read prior worklog (Tasks 1–8). Inspected current state of /api/subscription/route.ts (a fake "demo checkout" that just created a Subscription row + flipped the User to premium with no payment), premium.tsx (1112 lines), lib/auth.ts, lib/store.ts, lib/subscription.ts, prisma/schema.prisma.
- Part A.1 — Rewrote /api/subscription/route.ts POST handler:
  * Reads RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET from env at module scope.
  * If both set: POSTs to https://api.razorpay.com/v1/orders with HTTP Basic auth (`Basic base64(KEY_ID:KEY_SECRET)`), body `{ amount, currency: 'INR', receipt: 'aaranya_<userId>_<timestamp>', payment_capture: 1, notes: { userId, plan } }`. Amount lookup table: monthly → 5900 paise (₹50 base + 18% GST = ₹59), yearly → 59000 paise (₹500 base + 18% GST = ₹590).
  * On Razorpay success: returns `{ orderId, amount, currency: 'INR', keyId }` to the client. Does NOT create a Subscription row or update the User — the client must complete Razorpay Checkout + POST to /verify first.
  * If Razorpay keys NOT set: returns 503 with `{ error: 'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.' }`.
  * If Razorpay API call fails (non-2xx): returns 502 with a generic error (logs status + body to server console).
  * GET (subscription status) + DELETE (cancel) handlers preserved verbatim.
- Part A.2 — Created /api/subscription/verify/route.ts (NEW file):
  * Reads `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, plan, userId }` from JSON body.
  * Validates required fields (400 if missing) and plan value (400 if not 'monthly'/'yearly').
  * `verifySignature()` = HMAC SHA256 of `order_id + "|" + payment_id` with RAZORPAY_KEY_SECRET, compared to `razorpay_signature` using `crypto.timingSafeEqual` (with a length-check short-circuit so timingSafeEqual doesn't throw on mismatched-length buffers).
  * If RAZORPAY_KEY_SECRET missing OR signature mismatch → 401.
  * On success: computes base/gst/total from plan, `end = computeSubscriptionEnd(plan)` (30d monthly / 365d yearly), inserts a Subscription row with `status: 'active'`, `transactionId: razorpay_payment_id`, `invoiceId: razorpay_order_id`, `paymentMethod: 'razorpay'`, amount/gst/total/currency. Updates the User: `subscriptionTier: 'premium'`, `subscriptionStatus: 'active'`, `subscriptionPlan: plan`, `subscriptionStart: now`, `subscriptionEnd: end`. Returns `{ success: true, subscription: { id, plan, amount, gst, total, currency, status, startDate, endDate, transactionId, invoiceId }, user: { id, subscriptionTier, subscriptionStatus, subscriptionPlan, subscriptionStart, subscriptionEnd } }`.
- Part A.3 — Created /api/subscription/webhook/route.ts (NEW file):
  * Reads RAZORPAY_WEBHOOK_SECRET from env. Reads raw body via `req.text()` (NOT `req.json()` — signature must be over the raw bytes).
  * `verifyWebhookSignature()` = HMAC SHA256 of rawBody with RAZORPAY_WEBHOOK_SECRET, compared to `X-Razorpay-Signature` header using `crypto.timingSafeEqual` (with length-check short-circuit).
  * If RAZORPAY_WEBHOOK_SECRET missing → 401. If signature invalid → 401. (Razorpay should retry; forged events are rejected.)
  * Parses the verified body as JSON. `console.log`s the event type.
  * `payment.captured`: looks up `payment.entity.notes.userId` + `payment.entity.id`, updates Subscription rows with matching `transactionId` to `status: 'active'`, updates User `subscriptionStatus: 'active'`.
  * `subscription.cancelled`: looks up `subscription.entity.notes.userId`, updates User `subscriptionStatus: 'cancelled'`.
  * Unknown events: no-op (still returns 200 so Razorpay doesn't retry).
  * All paths return 200 to Razorpay except signature failures (401) and JSON-parse failures (200 with `{ received: true }`). The outer catch also returns 200 to prevent Razorpay retries of our internal failures.
- Part B — premium.tsx overhaul (MultiEdit + targeted Edits):
  * Imports cleanup: removed `AnimatePresence` (was unused), `Star`, `Dumbbell`, `Sparkle`, `FileBarChart`, `Ban`, `Headphones`, `Quote`, `Award`, `Users` (all unused after edits), and `Avatar, AvatarFallback` (only used in the removed testimonials section). `Gift` already imported.
  * Removed `Testimonial` interface.
  * Removed `TESTIMONIALS` const (Ananya Reddy / Kavya Iyer / Meera Krishnan fabricated quotes).
  * FAQ updates:
    - faq1 (free trial): removed "We will send you reminders before the trial ends" (no such notification flow exists) → replaced with "Pick a plan before your trial ends to keep Premium access."
    - faq2 (GST invoice): removed false "Aaranya is a registered Indian business" + "emailed instantly after payment" + "always downloadable from Settings → Subscription → Invoices" claims → replaced with honest "18% GST is charged... shown separately at checkout. A receipt with the GST breakdown is available immediately after a successful payment — contact support@aaranya.health if you need a GSTIN field added."
    - faq4 (payment methods): removed false "net banking from 50+ Indian banks" + "EMI on select cards" + "All payments are processed through Razorpay — PCI-DSS Level 1 certified." → replaced with the spec-mandated "We accept UPI, all major credit and debit cards (Visa, Mastercard, RuPay, Amex), net banking, and mobile wallets via the Razorpay checkout. Payments secured by Razorpay (PCI-DSS Level 1). Cancel anytime."
    - faq5 (refund): changed "contact support" → "contact support@aaranya.health" (concrete). Softened "annual plans" → "annual plans" (already accurate).
    - faq6 (family sharing): REMOVED entirely (no family-sharing implementation exists; was a fabricated feature).
  * TRUST_BADGES b6: replaced `{ label: '4.9/5 Rated', icon: Star, description: '50,000+ women' }` with `{ label: '7-Day Free Trial', icon: Gift, description: 'No card required' }` per spec.
  * Hero subtitle: replaced "Join 50,000+ Indian women who transformed their wellbeing with AI-powered cycle intelligence, hormone predictions and 24/7 expert care. All prices include 18% GST." with "Join Aaranya today. 7-day free trial. Cancel anytime. All prices include 18% GST." per spec.
  * Hero rating badge: removed the entire `<span>` containing 5 yellow stars + "4.9/5 · 50k+ women" (fabricated rating + user count). Now only the conditional trial/active/trial badge + the HIPAA-secured badge remain.
  * `handleSubscribe` rewrite (was lines 580–615, the bypass + 1200ms setTimeout):
    - Removed `await new Promise((r) => setTimeout(r, 1200))`.
    - Removed the `if (!res.ok) { console.warn(...) }` followed by `activateSubscription(plan)` + success toast — i.e. the client-side paywall bypass. The premium status now ONLY comes from the server.
    - New flow: POST `/api/subscription` with `{ plan }` (no more `paymentMethod`). On 503 → `toast.error('Payments are coming soon. Email support@aaranya.health to be notified.')` + return. On other non-OK → `toast.error('Payment failed. Please try again.')` + return. On OK → destructure `{ orderId, amount, currency, keyId }`, `await loadRazorpayScript()`, then `new (window as any).Razorpay({ key_id: keyId, amount, currency, name: 'Aaranya Premium', description: plan === 'yearly' ? 'Yearly subscription' : 'Monthly subscription', order_id: orderId, handler: (resp) => verifyPayment(resp, plan), prefill: { email: authUser?.email }, theme: { color: '#e11d74' } }).open()`.
    - On any error (script load failure, network, etc.) → `toast.error('Payment failed. Please try again.')`. Local subscription state is NOT changed on failure.
  * Added `loadRazorpayScript()` helper: returns a Promise that resolves immediately if `window.Razorpay` exists, otherwise creates a `<script src="https://checkout.razorpay.com/v1/checkout.js" async>` and resolves on `onload` / rejects on `onerror`.
  * Added `verifyPayment(resp, plan)` helper: POSTs to `/api/subscription/verify` with `{ ...resp, plan, userId: authUser?.id }` (auth Bearer token from localStorage). On non-OK → `toast.error('Payment verification failed.')` + return (no local state change). On OK → `activateSubscription(plan)` + `setSubscription({ tier, status, plan, subscriptionEnd: data.subscription.endDate })` (so the local store reflects the server-confirmed end date) + `toast.success('Welcome to Premium! 🎉')` + optional `onSubscribe?.()` parent callback.
  * Added `authUser` + `setSubscription` to the useAppStore destructuring.
  * Replaced the entire Testimonials JSX section (the 3-column grid with fabricated Ananya/Kavya/Meera cards, avatars, star ratings, condition tags) with a single honest "Early Access" section: badge "Early Access", heading "Be a Founding Member", subhead "Help shape Aaranya.", and a centered card with a Gift icon, the exact spec-mandated copy "We're in early access. Be among the first 500 founding members — your feedback shapes Aaranya.", plus a `support@aaranya.health` mailto link. No fabricated names, ages, cities, or quotes.
- Verification:
  * `bun run lint` → EXIT 0 (0 errors project-wide).
  * `bunx tsc --noEmit` → 0 errors in premium.tsx, /api/subscription/route.ts, /api/subscription/verify/route.ts, /api/subscription/webhook/route.ts. (Pre-existing TS errors in fertility-planner.tsx framer-motion Variants + examples/ + skills/ are outside this task's scope.)
  * `rg "50,000|50k\+|4\.9/5|TESTIMONIALS|Razorpay — PCI-DSS|Testimonial\b|Fall back gracefully|setTimeout\(r, 1200\)"` in premium.tsx → 0 matches.
  * Dev server log shows clean Next.js 16.1.3 startup with no compile errors.
  * Confirmed all 3 new/modified API routes use `crypto.timingSafeEqual` with length-check short-circuits (no `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH` thrown on malformed signatures).
  * Confirmed the Subscription row is NOT created in /api/subscription POST — only in /api/subscription/verify after signature verification. Confirmed the User is NOT upgraded in /api/subscription POST.

Stage Summary:
- Payment flow is now production-shaped: client → POST /api/subscription → Razorpay order ID → Razorpay Checkout modal → handler → POST /api/subscription/verify → HMAC SHA256 signature verification → Subscription row created + User upgraded to premium. No client-side bypass, no simulated delays, no fake invoices.
- /api/subscription returns 503 with a clear "set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET" message when payments aren't configured (no silent activation). /api/subscription/verify returns 401 on missing keys or signature mismatch. /api/subscription/webhook verifies the X-Razorpay-Signature header against the raw body, handles `payment.captured` + `subscription.cancelled`, and returns 200 for everything except invalid signatures (so Razorpay doesn't retry our internal failures).
- premium.tsx: removed the 1200ms setTimeout, removed the "Fall back gracefully — still activate locally for demo flow" bypass, removed the fabricated TESTIMONIALS block (Ananya/Kavya/Meera), removed the "50,000+ Indian women" hero claim, removed the "4.9/5 · 50k+ women" hero rating badge, removed the "4.9/5 Rated / 50,000+ women" trust badge (replaced with "7-Day Free Trial / No card required"), removed the fabricated faq6 (family sharing), tightened faq1/faq2 to remove unimplemented notification + invoice-email claims, and rewrote faq4 with the spec-mandated Razorpay wording. Added an honest "Early Access / Be a Founding Member" section in place of testimonials. Imports cleaned (removed 11 unused icons + Avatar + AnimatePresence). `bun run lint` clean.
