"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  KeyRound,
  Lock,
  QrCode,
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
  const [username, setUsername] = useState("");
  const [simulatorUsername, setSimulatorUsername] = useState("");
  const [emailOrLogin, setEmailOrLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedEmailOrLogin = emailOrLogin.trim();
    const trimmedSimulatorUsername =
      simulatorUsername.trim() || trimmedUsername;

    if (
      !trimmedEmailOrLogin ||
      !password.trim() ||
      (mode === "create" &&
        (!fullName.trim() || !phone.trim() || !trimmedUsername))
    ) {
      setError(
        mode === "create"
          ? "Name, phone, username, email, and password are required."
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
                  simulatorDisplayName: trimmedSimulatorUsername,
                  username: trimmedUsername,
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
    <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <section>
        <QrCode className="text-[#2f6b3f]" size={38} />
        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
          Login or create your Pin2Win account.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#53605a]">
          Start here for the {challengeName}. Your player details will carry
          into checkout so you do not have to retype them on the entry page.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["1", "Account"],
            ["2", "Checkout"],
            ["3", "Event code"],
          ].map(([step, label]) => (
            <div key={step} className="rounded-lg border border-[#ded6c8] bg-white p-5">
              <p className="text-sm font-black text-[#2f6b3f]">STEP {step}</p>
              <p className="mt-2 font-black">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
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
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              {mode === "create" ? "New player" : "Welcome back"}
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {mode === "create"
                ? "Set up challenge access"
                : "Continue to checkout"}
            </h2>
          </div>

          {mode === "create" ? (
            <>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Full name
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder="Jordan Smith"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Phone
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  inputMode="tel"
                  placeholder="210-555-0123"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Pin2Win username
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder="jordan-smith"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setSimulatorUsername((current) => current || event.target.value);
                  }}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                E6 username
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder="Same as your E6 account"
                  value={simulatorUsername}
                  onChange={(event) => setSimulatorUsername(event.target.value)}
                />
              </label>
            </>
          ) : null}

          <label className="grid gap-2 text-sm font-bold text-[#53605a]">
            {mode === "create" ? "Email" : "Email/Username"}
            <input
              className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
              placeholder={
                mode === "create"
                  ? "jordan@example.com"
                  : "jordan@example.com or jordan-smith"
              }
              type={mode === "create" ? "email" : "text"}
              value={emailOrLogin}
              onChange={(event) => setEmailOrLogin(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#53605a]">
            Password
            <input
              className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
              placeholder="********"
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
