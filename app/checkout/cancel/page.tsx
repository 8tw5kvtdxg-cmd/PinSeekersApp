import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-xl rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
        <ClipboardCheck className="text-[#2f6b3f]" size={32} />
        <h1 className="mt-4 text-3xl font-black">Checkout not completed</h1>
        <p className="mt-4 leading-7 text-[#59655f]">
          Your Pin2Win entry is not active yet. The challenge entry flow should
          be opened from the onsite QR code at a partner location.
        </p>
        <Link
          href="/rent"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
        >
          Book simulator time
        </Link>
      </div>
    </main>
  );
}
