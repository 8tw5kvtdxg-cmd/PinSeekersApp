import Link from "next/link";
import { CheckCircle2, CreditCard, QrCode, UserPlus } from "lucide-react";

const signupSteps = [
  "QR code identifies the location, bay, and active challenge.",
  "Player chooses Hole-in-One, Closest to the Pin, or Longest Drive.",
  "Profile details are captured before checkout.",
  "$20 payment creates a pending challenge entry.",
];

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <Link href="/" className="text-sm font-black uppercase tracking-[0.16em] text-[#7c8d34]">
            PinSeekers
          </Link>
          <h1 className="mt-10 text-4xl font-black sm:text-5xl">Player signup</h1>
          <p className="mt-5 text-lg leading-8 text-[#53605a]">
            This is the first POC screen players reach after scanning a bay QR
            code. The production flow will connect this form to Stripe checkout
            and create the challenge entry after successful payment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#53605a]">
              Location: Minneapolis
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#53605a]">
              Bay: 03
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#53605a]">
              Entry: $20
            </span>
          </div>
        </section>

        <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
          <div className="grid gap-4 sm:grid-cols-3">
            {["Hole-in-One", "Closest to the Pin", "Longest Drive"].map((name) => (
              <button
                key={name}
                className="min-h-28 rounded-md border border-[#ded6c8] bg-[#fbf8f1] p-4 text-left text-lg font-black transition hover:border-[#7c8d34]"
              >
                {name}
              </button>
            ))}
          </div>

          <form className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Player name
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#7c8d34]"
                placeholder="Jordan Smith"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[#53605a]">
              Email
              <input
                className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#7c8d34]"
                placeholder="jordan@example.com"
                type="email"
              />
            </label>
            <button
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
              type="button"
            >
              <CreditCard size={18} /> Continue to $20 payment
            </button>
          </form>
        </section>

        <section className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-4">
            {signupSteps.map((step, index) => {
              const icons = [QrCode, CheckCircle2, UserPlus, CreditCard];
              const Icon = icons[index];

              return (
                <div key={step} className="rounded-lg bg-[#18211f] p-5 text-white">
                  <Icon className="text-[#c8f03f]" size={28} />
                  <p className="mt-4 text-sm font-black text-[#c8f03f]">
                    STEP {index + 1}
                  </p>
                  <p className="mt-2 leading-7 text-white/78">{step}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
