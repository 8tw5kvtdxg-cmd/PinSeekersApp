"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  KeyRound,
  Lock,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QrAccountGateProps = {
  challengeName: string;
  nextPath: string;
};

type PlayerAccount = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  simulatorDisplayName: string;
};

export function QrAccountGate({
  challengeName,
  nextPath,
}: QrAccountGateProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "login">("create");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [e6GolfUsername, setE6GolfUsername] = useState("");
  const [emailOrLogin, setEmailOrLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmailOrLogin = emailOrLogin.trim();
    const trimmedE6GolfUsername = e6GolfUsername.trim();

    if (
      !trimmedEmailOrLogin ||
      !password.trim() ||
      (mode === "create" &&
        (!fullName.trim() || !phone.trim() || !trimmedE6GolfUsername))
    ) {
      setError(
        mode === "create"
          ? "Name, phone, E6 Golf username, email, and password are required."
          : "Email/username and password are required.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        mode === "create" ? "/api/account/signup" : "/api/account/login",
        {
          body: JSON.stringify(
            mode === "create"
              ? {
                  email: trimmedEmailOrLogin,
                  name: fullName.trim(),
                  password,
                  phone: phone.trim(),
                  simulatorDisplayName: trimmedE6GolfUsername,
                }
              : {
                  login: trimmedEmailOrLogin,
                  password,
                },
          ),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const data = (await response.json()) as {
        user?: PlayerAccount;
        error?: string;
      };

      if (!response.ok || !data.user) {
        throw new Error(data.error ?? "Could not access account.");
      }

      router.replace(nextPath);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not access account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-8">
      <section className="w-full max-w-md rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/10 sm:p-7">
        <div className="mb-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
            {challengeName}
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight">
            {mode === "create" ? "Create your account" : "Login to continue"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#59655f]">
            Your player details carry into checkout automatically.
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-md bg-[#f2eadb] p-1">
          {(["create", "login"] as const).map((option) => (
            <button
              key={option}
              className={cn(
                "h-11 rounded-md text-sm font-black capitalize transition",
                mode === option
                  ? "bg-[#18211f] text-white shadow-md shadow-[#18211f]/12"
                  : "text-[#53605a] hover:bg-white",
              )}
              type="button"
              onClick={() => {
                setMode(option);
                setError("");
              }}
            >
              {option === "create" ? "Create account" : "Login"}
            </button>
          ))}
        </div>

        <form className="mt-6 grid gap-4" onSubmit={submitAccount}>
          {mode === "create" ? (
            <>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Full name
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Phone
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                E6 Golf username
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  value={e6GolfUsername}
                  onChange={(event) => setE6GolfUsername(event.target.value)}
                />
              </label>
            </>
          ) : null}

          <label className="grid gap-2 text-sm font-bold text-[#53605a]">
            {mode === "create" ? "Email" : "Email/Username"}
            <input
              className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
              type={mode === "create" ? "email" : "text"}
              value={emailOrLogin}
              onChange={(event) => setEmailOrLogin(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#53605a]">
            Password
            <input
              className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {mode === "login" ? (
            <Link
              href="/account/recovery"
              className="inline-flex items-center gap-2 text-sm font-black text-[#2f6b3f]"
            >
              <KeyRound size={16} /> Forgot password/username?
            </Link>
          ) : null}

          <button
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {mode === "create" ? <UserPlus size={18} /> : <Lock size={18} />}
            {isSubmitting
              ? "Working..."
              : mode === "create"
              ? "Create account"
              : "Login"}
            <ArrowRight size={18} />
          </button>

          {error ? (
            <p className="rounded-md bg-[#fff5f2] px-4 py-3 text-sm font-bold text-[#9a3324]">
              {error}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
