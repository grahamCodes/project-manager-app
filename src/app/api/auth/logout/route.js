// src/app/api/auth/logout/route.js
import { NextResponse } from "next/server";

export function GET(request) {
  // Clear the cookie and redirect to /login
  const url = new URL(request.url);
  const res = NextResponse.redirect(new URL("/login", url));
  res.cookies.set({
    name: "token",
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
  });
  return res;
}

export function POST(request) {
  // Clear cookie, return JSON
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set({
    name: "token",
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
  });
  return res;
}
