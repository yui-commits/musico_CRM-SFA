import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth API routes must be accessible without a cookie
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('musico_auth')
  const authSecret = process.env.AUTH_SECRET
  const isAuthenticated = authSecret && authCookie?.value === authSecret

  // Authenticated users visiting /login → redirect to /pre-apo
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/pre-apo', request.url))
  }

  // Unauthenticated users on any protected route → redirect to /login
  if (pathname !== '/login' && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
