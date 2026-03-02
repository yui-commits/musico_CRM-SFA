import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'musico_auth'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  const validUsername = process.env.AUTH_USERNAME
  const validPassword = process.env.AUTH_PASSWORD
  const authSecret = process.env.AUTH_SECRET

  if (!validUsername || !validPassword || !authSecret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, authSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
  return response
}
