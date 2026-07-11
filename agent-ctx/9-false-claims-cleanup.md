# Task 9 — False-Claims Cleanup Agent

## Task
- Part A: Remove false compliance badges (HIPAA, GDPR, E2E Encrypted, ISO 27001) from `settings.tsx`; fix `HIPAA-compliant` → `DPDP Act compliant` in `feature-gate.tsx`.
- Part B: Wire the 6 "Opening..." toast buttons in `settings.tsx` to real `/legal/*` pages (created by Task 8) using Next.js `useRouter`.
- Part C: Remove fabricated "50,000+ women" marketing claim + fabricated product `reviews` and `rating` numbers in `marketplace.tsx`; hide rating/review UI when 0.

## Files Modified
- `/home/z/my-project/src/components/modules/settings.tsx`
- `/home/z/my-project/src/components/auth/feature-gate.tsx`
- `/home/z/my-project/src/components/modules/marketplace.tsx`

## Changes

### settings.tsx
1. Added `import { useRouter } from 'next/navigation'` (line 4).
2. Added `const router = useRouter()` inside `SettingsModule` (line 172).
3. Removed unused `KeyRound` icon import (only used in removed GDPR badge).
4. Privacy Policy button (Privacy & Security section, line 597): `onClick={() => toast.info('Privacy Policy', { description: 'Opening privacy policy in a new tab...' })}` → `onClick={() => router.push('/legal/privacy')}`.
5. Manage Billing button (Subscription section, line 840): since Aaranya has no real billing portal, replaced fake "Opening billing portal to update payment method..." toast with `toast.info('Manage your subscription from the Premium page')` + `setActiveModule('premium')` (uses the existing `setActiveModule` from the store, also used by the Upgrade to Premium button at line 826).
6. Terms of Service button (About section, line 874): `router.push('/legal/terms')`.
7. Privacy Policy button (About section, line 882): `router.push('/legal/privacy')`.
8. Help & Support button (line 890): `router.push('/legal/support')`.
9. Contact Us button (line 898): `router.push('/legal/support')` (was not a mailto; routed to support page which Task 8 created with contact info).
10. Compliance badges row (line 908-915 area): replaced the 4-cell grid `HIPAA / GDPR / E2E Encrypted / ISO 27001` with a single honest badge:
    ```tsx
    <div className="mt-2">
      <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs">
        <Shield className="h-3.5 w-3.5 text-emerald-600" />
        <span className="font-medium">Data encrypted at rest · Indian data residency (DPDP Act compliant)</span>
      </div>
    </div>
    ```
    Uses existing `Shield` icon (already imported).

### feature-gate.tsx
- Line 141: `Cancel anytime · GST invoice provided · HIPAA-compliant` → `Cancel anytime · GST invoice provided · DPDP Act compliant`. No other changes.

### marketplace.tsx
1. Line 1141: `subtitle="Top picks loved by 50,000+ Aaranya women"` → `subtitle="Curated wellness essentials for Aaranya members"`.
2. PRODUCTS array (20 products, lines 116-426): every `rating:` and `reviews:` field set to `0` (was fabricated 4.4–4.8 ratings and 234–3421 review counts).
3. ProductCard component (line 577-586): wrapped `<Stars>` + rating/reviews `<span>` in `{product.rating > 0 && (...)}` so the row collapses when rating is 0.
4. FeaturedCard component (line 652-661): same conditional wrap.
5. RecommendationRow component (line 745): `{product.rating > 0 && <Stars rating={product.rating} className="scale-90" />}` so the inline stars collapse when rating is 0.

## Verification
- `rg "HIPAA|GDPR|ISO 27001|E2E Encrypted"` in `src/components/modules/settings.tsx` → 0 matches.
- `rg "HIPAA|GDPR|ISO 27001|E2E Encrypted"` in `src/components/auth/feature-gate.tsx` → 0 matches.
- `rg "50,000|50k\+|4\.9/5|reviews: [1-9]"` in `src/components/modules/marketplace.tsx` → 0 matches.
- `rg "rating: [1-9]|reviews: [1-9]"` in `src/components/modules/marketplace.tsx` → 0 matches.
- `rg "router\.push\('/legal"` in `src/components/modules/settings.tsx` → 5 matches (Privacy×2, Terms, Support×2). Manage Billing uses `setActiveModule('premium')` per the task's fallback option since there is no real billing portal yet.
- `rg "Opening|toast\.info\('Billing|toast\.info\('Terms|toast\.info\('Privacy|toast\.info\('Support|toast\.info\('Contact"` in `src/components/modules/settings.tsx` → 0 matches (all removed).
- `bun run lint` → EXIT 0.
- Dev server log (`tail -100 dev.log`): clean Next.js 16.1.3 startup, no compile errors.

## Notes / Out-of-scope
- The "End-to-End Encryption" feature card in the Privacy & Security section of `settings.tsx` (around line 611-625) contains the text "End-to-End Encryption" and "All your health data is encrypted with AES-256 — even we can't read it." This was NOT explicitly listed in the task's Part A.1 (which only mentioned the badges row at line 905-908) and the acceptance criteria only forbids the literal strings HIPAA/GDPR/ISO 27001/E2E Encrypted. Left untouched to stay within scope. If a future task wants to clean this up, the contradictory "even we can't read it" claim should be softened to match the new honest "Data encrypted at rest" badge.
- `setActiveModule('premium')` for Manage Billing uses the store method already used by the Upgrade button — no new prop or pattern needed.
