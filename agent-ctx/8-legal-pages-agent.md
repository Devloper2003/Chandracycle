# Task 8 — Legal Pages Agent

## Scope
Add 3 real, substantive Next.js legal pages for the Aaranya women's health app, plus a shared `LegalLayout` component, so the settings screen "Opening..." toast buttons (Privacy Policy, Terms of Service, Help & Support) have real link targets.

## Files created
1. `src/app/legal/_components/legal-layout.tsx` — shared Server Component layout
   - Sticky header (`sticky top-0 z-40`, backdrop-blur, `h-16`): Aaranya lotus logo + "Back to Aaranya" pill link
   - Hero band: eyebrow "AARANYA LEGAL" + Playfair serif h1 title + optional subtitle
   - Main: `max-w-4xl`, `flex-1`, the page itself scrolls (no fixed-height card)
   - Sticky footer (`mt-auto`): brand blurb + nav (Privacy/Terms/Support + Back to App) with `aria-current="page"` for active page + copyright + support email + 112 emergency notice
   - Root wrapper: `min-h-screen flex flex-col bg-rose-50/40` — footer sticks to bottom, pushes naturally on overflow
   - Exports `LegalSection` helper for consistent h2 + body spacing (`scroll-mt-24` for anchor offset)
2. `src/app/legal/privacy/page.tsx` — 11-section Privacy Policy
   - At-a-glance summary card (4 icon tiles), then: Intro, Data We Collect (account/cycle/symptoms/mood/sleep/water/fertility/pregnancy/PCOS/menopause + AI convos + community + device + payment metadata), How We Use Data (insights/AI coaching/community/account/improvement/safety — never sold), Storage & Security (AES-256 at rest, AWS Mumbai ap-south-1 = Indian data residency per DPDP Act, 72-hr breach notice), Third Parties (Google/Apple OAuth, Razorpay payments, AI chat provider — all with DPAs), User Rights (access/correction/deletion/export/withdraw/grievance, email support@aaranya.health, 30-day response), Cookies (auth session cookie HttpOnly Secure 30-day; local storage theme/offline; analytics opt-in OFF by default), Children (16+ only), Retention (active-while-active, 30-day deletion, 6-yr billing), Updates (7-day email notice), Contact. Effective date: July 4, 2026.
3. `src/app/legal/terms/page.tsx` — 13-section Terms of Service
   - Amber health-disclaimer banner up top, then: Acceptance, Description of Service, Eligibility (16+, India), Accounts (one per person), Subscriptions (₹59/mo = ₹50+₹9 GST; ₹590/yr = ₹500+₹90 GST; two plan cards; 7-day trial; auto-renewal; cancel anytime keep Premium to period end; partial-period fees non-refundable except where law requires; GST invoice emailed; 30-day price-change notice), Acceptable Use (no abuse/scraping/reverse-engineering/medical-advice reliance/reselling), Health Disclaimer (informational not medical; always consult qualified physician; emergency call 112), IP (Aaranya owns; user content remains user's with royalty-free licence for community), Disclaimers (as-is; no warranty on predictions/AI/uptime), Limitation of Liability (no indirect damages; aggregate cap = 12-month paid amount or ₹1000), Governing Law (India, exclusive jurisdiction of Bengaluru courts), Changes (7-day notice), Contact. Effective date: July 4, 2026.
4. `src/app/legal/support/page.tsx` — Help Center
   - Contact card grid: email support@aaranya.health (24–48hr SLA Mon–Fri) + phone +91 80-XXXX-XXXX (9 AM–6 PM IST Mon–Fri)
   - Quick links row: Privacy Policy → /legal/privacy, Terms of Service → /legal/terms, Cancel Subscription → / (settings is a module inside the app)
   - FAQ: 6 Q&As as static Card components (account create/delete, subscription/trial/refund, data export ZIP, forgot password, refund policy, technical troubleshooting)
   - Health emergency disclaimer (rose card): Aaranya Support is NOT for medical emergencies — call 112 in India or go to ER

## Style compliance
- All 4 files use existing shadcn/ui (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `Separator`) + lucide-react icons + `next/link` + the rose theme (`text-rose-600/700/900`, `bg-rose-50/100`, `border-rose-200`, `font-serif` for headings from Playfair).
- Mobile-first responsive: `sm:` breakpoints, `max-w-4xl` content column, `grid sm:grid-cols-2/3` for card grids.
- No `'use client'` anywhere — pure Server Components as required.
- Effective date hardcoded as `July 4, 2026` (today) so pages stay statically renderable (no `new Date()` in render path that would mark them dynamic).

## Verification
- `bun run lint` → EXIT 0 (0 errors project-wide)
- `bunx tsc --noEmit` → 0 errors in legal files (grep for "legal" returned nothing)
- Dev server smoke test skipped: server is in restart cycle (known 4GB-RAM OOM in sandbox, documented in Tasks 10–11). Routes are static server components with no Prisma/API/client imports, so they compile cleanly — lint + tsc are the authoritative checks here.

## Follow-up for integrator
The settings screen `src/components/modules/settings.tsx` still has toast-only handlers at lines 596, 870, 878, 886. They should be swapped to `router.push('/legal/privacy')`, `router.push('/legal/terms')`, `router.push('/legal/support')` respectively (settings.tsx is already a client component). Out of scope for this task per the brief — left to the integrator.
