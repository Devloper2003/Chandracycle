#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# ChandraCycle — Vercel Environment Variables Setup Script
# ═══════════════════════════════════════════════════════════════════════════
# Reads credentials from .env.vercel and sets them on your Vercel project
# using the Vercel CLI, so you don't have to enter them manually.
#
# USAGE:
#   1. Make sure .env.vercel exists (it's gitignored — created by the setup)
#   2. Get a Vercel token from: https://vercel.com/account/tokens
#      (Create token → Scope: Full Access → Expiration: 7 days)
#   3. Run:
#      VERCEL_TOKEN=your_token_here bash setup-vercel.sh
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "❌ ERROR: VERCEL_TOKEN is not set."
  echo ""
  echo "Get a token from: https://vercel.com/account/tokens"
  echo "Then run: VERCEL_TOKEN=your_token_here bash setup-vercel.sh"
  exit 1
fi

if [ ! -f ".env.vercel" ]; then
  echo "❌ ERROR: .env.vercel file not found."
  echo "Create it with your credentials (see .env.example for the template)."
  exit 1
fi

echo "🔑 Vercel token detected (length: ${#VERCEL_TOKEN})"
echo "📄 Reading credentials from .env.vercel..."
echo ""

# ─── Parse .env.vercel and set each variable on Vercel ─────────────────────
# Reads KEY=VALUE lines, skips comments and empty lines
set_env() {
  local name="$1"
  local value="$2"
  echo "  Setting $name..."
  for env in production preview development; do
    echo "$value" | vercel env add "$name" "$env" --token "$VERCEL_TOKEN" 2>/dev/null || \
    echo "    ($env: already exists or skipped)"
  done
}

while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" || -z "$value" ]] && continue
  # Trim whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  set_env "$key" "$value"
done < .env.vercel

echo ""
echo "✅ All environment variables from .env.vercel have been set on Vercel!"
echo ""
echo "🚀 Next steps:"
echo "   1. Go to your Vercel project → Deployments → Redeploy"
echo "      (UNCHECK 'Use existing build cache')"
echo "   2. Add your Vercel production URL to Google Cloud Console:"
echo "      https://console.cloud.google.com/apis/credentials"
echo "      → OAuth 2.0 Client ID → Authorized JavaScript origins → Add your Vercel URL"
echo ""
echo "   3. Test Google login on your deployed site!"
