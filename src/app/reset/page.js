// src/app/reset/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Reset.module.css";

// SSR-safe ID generator (no browser crypto)
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Simple Toast
function Toast({ msg, onDone, type = "info" }) {
  useEffect(() => {
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [onDone]);
  return <div className={`${styles.toast} ${styles[type]}`}>{msg}</div>;
}

export default function ResetPage() {
  const search = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => search.get("token") || "", [search]);

  const [toasts, setToasts] = useState([]);
  const pushToast = (msg, type = "info") =>
    setToasts((t) => [...t, { id: uid(), msg, type }]);
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {!token ? (
          <RequestForm pushToast={pushToast} />
        ) : (
          <ResetForm
            token={token}
            pushToast={pushToast}
            onSuccess={() => router.replace("/")}
          />
        )}
      </div>

      <div className={styles.toastWrap}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            msg={t.msg}
            type={t.type}
            onDone={() => removeToast(t.id)}
          />
        ))}
      </div>
    </div>
  );
}

function RequestForm({ pushToast }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      pushToast("If an account exists, we emailed a reset link.", "success");
    } catch {
      pushToast("If an account exists, we emailed a reset link.", "success");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.sub}>Enter your email and we’ll send you a link.</p>
      <form onSubmit={submit} className={styles.form}>
        <label className={styles.label}>
          Email
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <button className={styles.btn} disabled={busy}>
          {busy ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </>
  );
}

function ResetForm({ token, pushToast, onSuccess }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  function valid(pw) {
    if (pw.length < 12) return false;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNum = /\d/.test(pw);
    const hasSym = /[^A-Za-z0-9]/.test(pw);
    return hasLower && hasUpper && (hasNum || hasSym);
  }

  async function submit(e) {
    e.preventDefault();
    if (pw1 !== pw2) {
      pushToast("Passwords do not match.", "error");
      return;
    }
    if (!valid(pw1)) {
      pushToast(
        "Min 12 chars incl. upper, lower, and a number or symbol.",
        "error"
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw1 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        pushToast(data.error || "Invalid or expired link.", "error");
        setBusy(false);
        return;
      }
      pushToast("Password updated. You’re signed in.", "success");
      setTimeout(() => onSuccess && onSuccess(), 800);
    } catch {
      pushToast("Something went wrong.", "error");
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className={styles.title}>Choose a new password</h1>
      <p className={styles.sub}>Enter it twice to confirm.</p>
      <form onSubmit={submit} className={styles.form}>
        <label className={styles.label}>
          New password
          <input
            type="password"
            className={styles.input}
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••••••"
          />
        </label>
        <label className={styles.label}>
          Confirm password
          <input
            type="password"
            className={styles.input}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••••••"
          />
        </label>
        <button className={styles.btn} disabled={busy}>
          {busy ? "Saving..." : "Set password"}
        </button>
      </form>
    </>
  );
}
