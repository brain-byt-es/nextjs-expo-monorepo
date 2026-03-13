import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/admin']
const adminRoutes = ['/admin']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isProtected) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('__Secure-better-auth.session_token')?.value ||
    request.cookies.get('better-auth.session_token')?.value

  if (!sessionCookie) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    )
  }

  // Admin routes require additional role check via server-side layout guard
  // Middleware can't easily decode the JWT, so admin layout does the role check
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    // Pass through — admin layout will verify role and redirect non-admins
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|static|public|.*\\..*).*)'],
}
