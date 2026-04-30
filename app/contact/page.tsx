import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Mail,
  MapPin,
  Phone,
  Share2,
  Users,
} from "lucide-react";

const addresses = [
  {
    label: "San Antonio office",
    address: "123 Placeholder Drive, San Antonio, TX 78205",
  },
  {
    label: "Houston partner location",
    address: "456 Example Avenue, Houston, TX 77002",
  },
  {
    label: "Austin partner location",
    address: "789 Template Street, Austin, TX 78701",
  },
  {
    label: "Dallas partner location",
    address: "321 Sample Road, Dallas, TX 75201",
  },
];

const socialLinks = [
  { label: "Instagram", handle: "@pinseekers", icon: Share2 },
  { label: "X / Twitter", handle: "@pinseekers", icon: Share2 },
  { label: "LinkedIn", handle: "PinSeekers", icon: Users },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]"
        >
          PinSeekers
        </Link>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#2f6b3f]">
              Contact us
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Questions about challenges, bays, or locations?
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#53605a]">
              Reach out for player support, venue partnerships, private events,
              or help getting a PinSeekers challenge started at your location.
            </p>
          </div>

          <section className="rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                className="rounded-lg bg-[#fbf8f1] p-5 transition hover:bg-[#f5efdf]"
                href="mailto:hello@pinseekers.example"
              >
                <Mail className="text-[#2f6b3f]" size={28} />
                <p className="mt-4 text-sm font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
                  Email
                </p>
                <p className="mt-2 text-lg font-black">hello@pinseekers.example</p>
              </a>
              <a
                className="rounded-lg bg-[#fbf8f1] p-5 transition hover:bg-[#f5efdf]"
                href="tel:+12105550123"
              >
                <Phone className="text-[#2f6b3f]" size={28} />
                <p className="mt-4 text-sm font-black uppercase tracking-[0.12em] text-[#2f6b3f]">
                  Phone
                </p>
                <p className="mt-2 text-lg font-black">(210) 555-0123</p>
              </a>
            </div>

            <form className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Name
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder="Your name"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Email
                <input
                  className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder="you@example.com"
                  type="email"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#53605a]">
                Message
                <textarea
                  className="min-h-32 rounded-md border border-[#ded6c8] px-4 py-3 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                  placeholder="Tell us what you need help with."
                />
              </label>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-6 text-sm font-black text-white transition hover:bg-[#2a3935]"
                type="button"
              >
                Send message <ArrowRight size={18} />
              </button>
            </form>
          </section>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-[#ded6c8] bg-white p-6">
            <div className="flex items-center gap-3">
              <Building2 className="text-[#2f6b3f]" size={30} />
              <h2 className="text-2xl font-black">Addresses</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {addresses.map((item) => (
                <article key={item.label} className="rounded-lg bg-[#fbf8f1] p-4">
                  <MapPin className="text-[#2f6b3f]" size={24} />
                  <h3 className="mt-3 text-lg font-black">{item.label}</h3>
                  <p className="mt-2 leading-7 text-[#59655f]">{item.address}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[#18211f] p-6 text-white">
            <h2 className="text-2xl font-black">Social media</h2>
            <div className="mt-5 space-y-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.label}
                    className="flex items-center justify-between rounded-lg bg-white/10 p-4 transition hover:bg-white/16"
                    href="#"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="text-[#a8c878]" size={24} />
                      <span className="font-black">{social.label}</span>
                    </span>
                    <span className="text-sm font-bold text-white/68">
                      {social.handle}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
