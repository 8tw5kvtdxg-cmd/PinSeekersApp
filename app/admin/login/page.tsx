import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, LockKeyhole } from "lucide-react";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge?: string; error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const isAuthenticated = await isAdminAuthenticated();
  const nextPath =
    typeof params.next === "string" &&
    (params.next === "/admin" ||
      params.next.startsWith("/admin/") ||
      params.next === "/testing-portal" ||
      params.next.startsWith("/testing-portal/"))
      ? params.next
      : "/admin";

  if (isAuthenticated) {
    redirect(nextPath);
  }

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          Pin2Win
        </Link>

        <section className="mt-10 rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-md bg-[#e3edd8] text-[#2f6b3f]">
              <LockKeyhole size={26} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
                Secure admin
              </p>
              <h1 className="mt-1 text-3xl font-black">Admin login</h1>
            </div>
          </div>

          <p className="mt-5 leading-7 text-[#59655f]">
            {params.challenge
              ? "Enter the six-digit code sent to your authorized administrator email."
              : "Use your individual Pin2Win account before changing event codes, reviewing entries, or opening verification tools."}
          </p>

          {params.error ? (
            <p className="mt-5 rounded-md bg-[#fff7f4] px-4 py-3 text-sm font-bold text-[#9a3324]">
              {params.error === "unavailable"
                ? "Admin login is temporarily unavailable."
                : params.error === "rate-limit"
                  ? "Too many login attempts. Wait 15 minutes and try again."
                  : params.error === "mfa"
                    ? "That verification code is invalid or expired."
                  : "Invalid admin email/username or password."}
            </p>
          ) : null}

          {params.challenge ? (
            <form action="/api/admin/mfa" className="mt-6 grid gap-4" method="post">
              <input name="next" type="hidden" value={nextPath} />
              <input name="challenge" type="hidden" value={params.challenge} />
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Verification code
                <input
                  autoComplete="one-time-code"
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-center text-xl font-black tracking-[0.3em] text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  inputMode="numeric"
                  maxLength={6}
                  name="code"
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  required
                />
              </label>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
                type="submit"
              >
                <KeyRound size={18} /> Verify and login
              </button>
              <Link className="text-center text-sm font-black text-[#2f6b3f]" href={`/admin/login?next=${encodeURIComponent(nextPath)}`}>
                Start over
              </Link>
            </form>
          ) : (
          <form action="/api/admin/login" className="mt-6 grid gap-4" method="post">
            <input name="next" type="hidden" value={nextPath} />
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Admin email or username
              <input
                autoComplete="username"
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                name="login"
                placeholder="Admin email or username"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Password
              <input
                autoComplete="current-password"
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                name="password"
                placeholder="Admin password"
                required
                type="password"
              />
            </label>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
              type="submit"
            >
              <KeyRound size={18} /> Login
            </button>
            <Link className="text-center text-sm font-black text-[#2f6b3f]" href="/account/recovery">
              Forgot your account password or username?
            </Link>
            <p className="text-sm leading-6 text-[#59655f]">Use your individual player account password. The former shared administrator login is no longer supported.</p>
          </form>
          )}
        </section>
      </div>
    </main>
  );
}
