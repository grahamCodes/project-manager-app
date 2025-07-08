// // src/lib/auth.js
// import { NextResponse } from "next/server";
// import { verifyToken } from "./jwt";

// /**
//  * Middleware to require a valid JWT in the httpOnly cookie.
//  * Throws a NextResponse with 401 if missing/invalid.
//  */
// export function requireAuth(request) {
//   const token = request.cookies.get("token")?.value;
//   if (!token) {
//     throw new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
//       status: 401,
//     });
//   }
//   try {
//     return verifyToken(token);
//   } catch (err) {
//     throw new NextResponse(JSON.stringify({ error: "Invalid token" }), {
//       status: 401,
//     });
//   }
// }
// src/lib/auth.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "./jwt";

/**
 * Reads the JWT from the httpOnly cookie, verifies it,
 * and returns the decoded payload. Throws a NextResponse(401)
 * if there’s no token or it’s invalid/expired.
 */
export async function requireAuth() {
  // 1. Grab the cookie store (async in Next.js 15+)
  const cookieStore = await cookies();

  // 2. Pull out our token
  const token = cookieStore.get("token")?.value;
  if (!token) {
    throw new NextResponse(
      JSON.stringify({ error: "Unauthorized – no token" }),
      { status: 401 }
    );
  }

  // 3. Verify and return the payload
  try {
    return verifyToken(token);
  } catch (err) {
    throw new NextResponse(
      JSON.stringify({ error: "Unauthorized – invalid token" }),
      { status: 401 }
    );
  }
}
