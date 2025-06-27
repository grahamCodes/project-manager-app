// middleware.js
import { NextResponse } from "next/server";

/**
 * This middleware protects API routes by checking for the presence of a token cookie.
 * It does not fully verify JWT validity (that occurs inside each route via `requireAuth`).
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public access to authentication endpoints
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protect these API routes
  if (
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/tasks") ||
    pathname === "/api/settings"
  ) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/projects/:path*", "/api/tasks/:path*", "/api/settings"],
};
