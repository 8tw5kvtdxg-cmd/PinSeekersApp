import Link from "next/link";
import { privacyRequestTypes } from "@/lib/privacy-requests";

export const dynamic = "force-dynamic";

export default async function PublicPrivacyRequestPage({ searchParams }: { searchParams: Promise<{ submitted?: string; error?: string }> }) {
  const notices = await searchParams;
  return <main className="min-h-screen bg-[#f8f4ec] px-5 py-10 text-[#18211f]"><div className="mx-auto max-w-2xl">
    <Link href="/privacy" className="text-sm font-semibold underline">Privacy Policy</Link>
    <h1 className="mt-6 text-4xl font-black">Submit a privacy request</h1>
    <p className="mt-3 text-stone-600">You do not need an account to start a request. We will verify identity before releasing or changing personal data. Do not include Social Security numbers, ID scans, tax forms, or payment-card numbers here. For an appeal of a prior decision, email pin2wingolf@outlook.com with the prior request reference.</p>
    {notices.submitted && <p className="mt-5 rounded-lg bg-green-100 p-4">Request {notices.submitted} received. Keep the reference for follow-up.</p>}
    {notices.error && <p className="mt-5 rounded-lg bg-red-100 p-4 text-red-900">{notices.error}</p>}
    <form action="/api/privacy-requests" method="post" className="mt-8 space-y-4 rounded-2xl border bg-white p-6">
      <label className="block text-sm font-semibold">Your email<input name="email" type="email" required maxLength={254} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-semibold">Request type<select name="requestType" required className="mt-1 w-full rounded-lg border p-3"><option value="">Select a request</option>{privacyRequestTypes.filter(t => t !== "Appeal").map(t => <option key={t}>{t}</option>)}</select></label>
      <label className="block text-sm font-semibold">What do you need?<textarea name="detail" required minLength={10} maxLength={2000} rows={5} className="mt-1 w-full rounded-lg border p-3" /></label>
      <button className="rounded-lg bg-[#18211f] px-5 py-3 font-semibold text-white">Submit request</button>
    </form>
    <p className="mt-5 text-sm text-stone-600">You can also email pin2wingolf@outlook.com with the subject “Texas Privacy Request.” If you have an account, <Link href="/account/privacy" className="underline">sign in to track requests and appeals</Link>.</p>
  </div></main>;
}
