import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Mail,
  Megaphone,
  QrCode,
  Users,
} from "lucide-react";

const inquiryTypes = [
  {
    title: "Partner venues",
    description:
      "Launch Pin2Win as an entertainment add-on for simulator customers.",
    icon: Building2,
  },
  {
    title: "Marketing activations",
    description:
      "Build a promotable challenge around QR signage, social posts, and email campaigns.",
    icon: Megaphone,
  },
  {
    title: "Player support",
    description:
      "Get help with account access, QR registration, event-code access, or result matching.",
    icon: Users,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#13201c]">
      <section id="venues" className="border-b border-[#dfe6df] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <div>
            <Link href="/" className="text-sm font-black uppercase text-[#2f6b3f]">
              Pin2Win
            </Link>
            <p className="mt-10 inline-flex items-center gap-2 rounded-md bg-[#eaf2ff] px-4 py-2 text-sm font-black text-[#24518a]">
              <Building2 size={16} /> Venue partnerships
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
              Bring Pin2Win to your simulator location.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#51615b]">
              Tell us about your venue, simulator setup, and launch goals. We
              can help shape the first challenge, QR placement, customer flow,
              and marketing rollout.
            </p>
          </div>

          <section className="rounded-lg border border-[#dfe6df] bg-white p-6 shadow-xl shadow-[#13201c]/8">
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                className="rounded-lg bg-[#f6f8f5] p-5 transition hover:bg-[#edf3ea]"
                href="mailto:pin2wingolf@outlook.com"
              >
                <Mail className="text-[#2f6b3f]" size={28} />
                <p className="mt-4 text-sm font-black uppercase text-[#2f6b3f]">
                  Partnerships
                </p>
                <p className="mt-2 text-lg font-black">
                  pin2wingolf@outlook.com
                </p>
              </a>
              <Link
                className="rounded-lg bg-[#13201c] p-5 text-white transition hover:bg-[#243630]"
                href="/play"
              >
                <QrCode className="text-[#b7d37c]" size={28} />
                <p className="mt-4 text-sm font-black uppercase text-[#b7d37c]">
                  Preview flow
                </p>
                <p className="mt-2 text-lg font-black">Open QR registration</p>
              </Link>
            </div>

            <form className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#51615b]">
                Name
                <input
                  className="h-12 rounded-md border border-[#dfe6df] px-4 text-base text-[#13201c] outline-none focus:border-[#2f6b3f]"
                  placeholder="Your name"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#51615b]">
                Email
                <input
                  className="h-12 rounded-md border border-[#dfe6df] px-4 text-base text-[#13201c] outline-none focus:border-[#2f6b3f]"
                  placeholder="you@example.com"
                  type="email"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#51615b]">
                Message
                <textarea
                  className="min-h-32 rounded-md border border-[#dfe6df] px-4 py-3 text-base text-[#13201c] outline-none focus:border-[#2f6b3f]"
                  placeholder="Tell us about your venue or support request."
                />
              </label>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#13201c] px-6 text-sm font-black text-white transition hover:bg-[#243630]"
                type="button"
              >
                Send inquiry <ArrowRight size={18} />
              </button>
            </form>
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {inquiryTypes.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-lg border border-[#dfe6df] bg-white p-6 shadow-lg shadow-[#13201c]/5"
              >
                <Icon className="text-[#2f6b3f]" size={30} />
                <h2 className="mt-5 text-2xl font-black">{item.title}</h2>
                <p className="mt-3 leading-7 text-[#51615b]">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-lg bg-[#eaf2ff] p-6">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-[#24518a]" size={28} />
            <h2 className="text-2xl font-black">A clean pilot starts here</h2>
          </div>
          <p className="mt-4 max-w-4xl leading-7 text-[#51615b]">
            The strongest launch starts with one location, one featured
            challenge, clear signage, a staff-ready customer explanation, and a
            weekly review of entries, revenue, and player feedback.
          </p>
        </div>
      </section>
    </main>
  );
}
