import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-xl rounded-lg border border-[#ded6c8] bg-white p-6">
        <h1 className="text-3xl font-black">Return to your entry</h1>
        <p className="mt-4 leading-7 text-[#59655f]">
          Complete the QR registration flow to create your Pin2Win entry,
          confirm checkout, and reveal the simulator event code.
        </p>
        <Link
          href="/play"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
        >
          Back to Play Now
        </Link>
      </div>
    </main>
  );
}
