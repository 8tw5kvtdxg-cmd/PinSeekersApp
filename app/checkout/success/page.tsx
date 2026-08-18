import Link from "next/link";
import { SquareSuccess } from "@/app/checkout/square-success";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
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
    <main className="min-h-screen bg-[#f8f4ec] px-6 py-10 text-[#18211f] sm:px-10">
      <div className="mx-auto max-w-xl rounded-lg border border-[#ded6c8] bg-white p-6">
        <SquareSuccess
          checkoutId={resolvedCheckoutId}
          squareOrderId={orderId ?? ""}
          squarePaymentId={transactionId ?? ""}
        />
        {!resolvedCheckoutId ? (
          <Link
            href="/rent"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
          >
            Book simulator time
          </Link>
        ) : null}
      </div>
    </main>
  );
}
