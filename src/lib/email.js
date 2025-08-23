// src/lib/email.js
// Minimal Resend sender. No extra deps needed.
// Requires env: EMAIL_PROVIDER=RESEND, RESEND_API_KEY, EMAIL_FROM

export async function sendEmail({ to, subject, html, replyTo }) {
  const provider = process.env.EMAIL_PROVIDER || "RESEND";
  if (provider !== "RESEND") {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  if (!from) throw new Error("Missing EMAIL_FROM");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend send failed: ${res.status} ${text}`);
  }
}
