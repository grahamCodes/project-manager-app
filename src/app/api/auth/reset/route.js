// src/app/api/auth/reset/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { cookies } from "next/headers";

function validatePassword(pw) {
  if (typeof pw !== "string" || pw.length < 12) return false;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /\d/.test(pw);
  const hasSym = /[^A-Za-z0-9]/.test(pw);
  return hasLower && hasUpper && (hasNum || hasSym);
}

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!validatePassword(newPassword)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 12 characters and include upper, lower, and a number or symbol.",
        },
        { status: 400 }
      );
    }

    // Hash the provided token (base64url -> raw -> sha256)
    let raw;
    try {
      raw = Buffer.from(token, "base64url");
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 400 }
      );
    }
    const tokenHash = crypto.createHash("sha256").update(raw).digest();

    // Find a valid, unused token
    const record = await prisma.passwordResetToken.findFirst({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: { gt: new Date() },
      },
    });
    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 400 }
      );
    }

    // Update user's password
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: record.user_id },
      data: { password_hash: hash },
    });

    // Invalidate token + clean up old ones
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used_at: new Date() },
    });
    await prisma.passwordResetToken.deleteMany({
      where: {
        user_id: record.user_id,
        OR: [{ expires_at: { lt: new Date() } }, { used_at: { not: null } }],
      },
    });

    // Issue fresh JWT cookie (log them in)
    const jwt = signToken({ sub: record.user_id });
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: jwt,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset error:", err);
    return NextResponse.json(
      { error: "Invalid or expired token." },
      { status: 400 }
    );
  }
}
