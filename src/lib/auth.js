// src/lib/auth.js
import { NextResponse } from "next/server";
import { verifyToken } from "./jwt";

/**
 * Middleware to require a valid JWT in the httpOnly cookie.
 * Throws a NextResponse with 401 if missing/invalid.
 */
export function requireAuth(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    throw new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  try {
    return verifyToken(token);
  } catch (err) {
    throw new NextResponse(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
    });
  }
}
