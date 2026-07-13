import { NextResponse } from 'next/server'

// Exposes the Google OAuth client ID (NOT a secret) to the frontend.
// Client IDs are PUBLIC identifiers — safe to expose.
export async function GET() {
  return NextResponse.json({
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      configured: !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID),
    },
  })
}
