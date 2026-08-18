"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, KeyRound, Mail } from "lucide-react";

export default function AccountRecoveryPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRecoveryRequest() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/account/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Recovery email could not be sent.");
      }

      setNotice(
        data.message ??
          "If an account exists for that email, recovery instructions have been sent.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Recovery email could not be sent.",
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
              Recover your account.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53605a]">
              Enter the email tied to your player account. We will send your
              username and a secure link to set a new password.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
          <form className="grid gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
                Account help
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Forgot password or username?
              </h2>
            </div>

            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Account email
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                placeholder="jordan@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <button
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
              disabled={isSubmitting}
              type="button"
              onClick={submitRecoveryRequest}
            >
              <Mail size={18} />
              {isSubmitting ? "Sending..." : "Send recovery email"}
              <ArrowRight size={18} />
            </button>

            {error ? (
              <p className="rounded-md bg-[#fff5f2] px-4 py-3 text-sm font-bold text-[#9a3324]">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded-md bg-[#eef7e9] px-4 py-3 text-sm font-bold text-[#2f6b3f]">
                {notice}
              </p>
            ) : null}

            <Link
              href="/account#login"
              className="inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f]"
            >
              Back to login <ArrowRight size={16} />
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
