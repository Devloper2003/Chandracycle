import { NextResponse } from 'next/server'

// Exposes OAuth client IDs (NOT secrets) to the frontend.
// Client IDs are PUBLIC identifiers — safe to expose. Only client SECRETS
// must stay server-side, and we never use those here.
export async function GET() {
  return NextResponse.json({
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      configured: !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID),
    },
    apple: {
      clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || process.env.APPLE_CLIENT_ID || 'com.chandracycle.app',
      configured: !!(process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || process.env.APPLE_CLIENT_ID),
    },
  })
}
