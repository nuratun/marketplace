import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED_ROUTES = ["/post", "/profile", "/my-listings"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (!isProtected) return NextResponse.next()

  // Access token is in localStorage (unreadable by middleware).
  // Refresh token is in the httpOnly cookie — use that as the session signal.
  const hasSession = request.cookies.get("session")?.value

  if (!hasSession) {
    const loginUrl = new URL("/auth", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/post/:path*", "/profile/:path*", "/my-listings/:path*"]
}