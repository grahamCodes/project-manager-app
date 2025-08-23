// src/app/api/auth/forgot/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

const TOKEN_TTL_MINUTES = 30;
const RATE_LIMIT_PER_HOUR = 5;

function getClientInfo(request) {
  const xf = request.headers.get("x-forwarded-for") || "";
  const ip =
    xf.split(",")[0].trim() || request.headers.get("x-real-ip") || "0.0.0.0";
  const userAgent = request.headers.get("user-agent") || "";
  return { ip, userAgent };
}

function baseUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    const { ip, userAgent } = getClientInfo(request);

    // Always return generic success to avoid email enumeration
    const generic = NextResponse.json({ ok: true });

    if (!email || typeof email !== "string") return generic;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return generic;

    // Rate limit by IP: 5 requests/hour
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const count = await prisma.passwordResetToken.count({
      where: { ip, created_at: { gt: cutoff } },
    });
    if (count >= RATE_LIMIT_PER_HOUR) return generic;

    // Create single-use token
    const raw = crypto.randomBytes(32);
    const token = raw.toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(raw).digest(); // Buffer
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip,
        user_agent: userAgent,
      },
    });

    const resetUrl = `${baseUrl()}/reset?token=${token}`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.5;">
        <p>Please click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="color:#0b72e7">${resetUrl}</a></p>
        <p style="font-size:12px;color:#666">This link expires in ${TOKEN_TTL_MINUTES} minutes and can be used once.</p>
        <p style="font-size:12px;color:#999">If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Reset your password",
      html,
    });

    return generic;
  } catch (err) {
    console.error("forgot error:", err);
    // Still return generic to avoid enumeration
    return NextResponse.json({ ok: true });
  }
}
