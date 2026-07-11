import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, issueSessionToken, toSessionUser, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const hashed = await hashPassword(password)
    const user = await db.user.create({
      data: {
        name: name || null,
        email: email.toLowerCase(),
        password: hashed,
        provider: 'email',
        cycleLength: 28,
        periodLength: 5,
      },
    })

    const sessionUser = toSessionUser(user)
    const token = issueSessionToken(sessionUser)
    const response = NextResponse.json({ user: sessionUser, token })
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
