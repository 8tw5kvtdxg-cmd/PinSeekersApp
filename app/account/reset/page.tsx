"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, KeyRound, Lock } from "lucide-react";

export default function AccountResetPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function submitPasswordReset() {
    if (!token) {
      setError("Reset link is missing.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Password could not be reset.");
      }

      setPassword("");
      setConfirmPassword("");
      setNotice("Password updated. You are now logged in.");
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Password could not be reset.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <Link
            href="/"
            className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
          >
            Pin2Win
          </Link>
          <div className="mt-10 max-w-xl">
            <KeyRound className="text-[#2f6b3f]" size={38} />
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Set a new password.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53605a]">
              Choose a new password for your Pin2Win player account. Reset
              links expire after 1 hour.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
          <form className="grid gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
                Password reset
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Create your new login
              </h2>
            </div>

            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              New password
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                placeholder="********"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Confirm password
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                placeholder="********"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>

            <button
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
              disabled={isSubmitting}
              type="button"
              onClick={submitPasswordReset}
            >
              <Lock size={18} />
              {isSubmitting ? "Saving..." : "Update password"}
              <ArrowRight size={18} />
            </button>

            {error ? (
              <p className="rounded-md bg-[#fff5f2] px-4 py-3 text-sm font-bold text-[#9a3324]">
                {error}
              </p>
            ) : null}
            {notice ? (
              <div className="rounded-md bg-[#eef7e9] px-4 py-3 text-sm font-bold text-[#2f6b3f]">
                <p className="inline-flex items-center gap-2">
                  <CheckCircle2 size={17} /> {notice}
                </p>
                <Link
                  href="/account"
                  className="mt-3 inline-flex items-center gap-2 text-[#2f6b3f]"
                >
                  Go to dashboard <ArrowRight size={16} />
                </Link>
              </div>
            ) : null}

            {!notice ? (
              <Link
                href="/account/recovery"
                className="inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f]"
              >
                Request a new link <ArrowRight size={16} />
              </Link>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
