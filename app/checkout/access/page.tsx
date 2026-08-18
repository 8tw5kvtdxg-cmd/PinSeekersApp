import Link from "next/link";
import { SimulatorAccess } from "@/app/checkout/access/simulator-access";

export const dynamic = "force-dynamic";

export default async function CheckoutAccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkoutId?: string;
    orderId?: string;
    referenceId?: string;
    squareCheckoutId?: string;
    transactionId?: string;
  }>;
}) {
  const { checkoutId, orderId, referenceId, squareCheckoutId, transactionId } =
    await searchParams;
  const resolvedCheckoutId = squareCheckoutId ?? checkoutId ?? referenceId ?? "";

  return (
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-8 text-[#18211f] sm:px-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/" className="text-xl font-black">
          Pin2Win
        </Link>
        <Link
          href="/locations"
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#d8cfbf] bg-white px-4 text-sm font-black text-[#18211f]"
        >
          Locations
        </Link>
      </div>

      <SimulatorAccess
        checkoutId={resolvedCheckoutId}
        squareOrderId={orderId ?? ""}
        squarePaymentId={transactionId ?? ""}
      />
    </main>
  );
}
