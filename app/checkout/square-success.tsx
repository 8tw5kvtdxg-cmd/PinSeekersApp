"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, KeyRound } from "lucide-react";

type SquareSuccessProps = {
  checkoutId: string;
};

type Entry = {
  id: string;
  challengeSlug: string;
  playerName: string;
  e6DisplayName: string;
  e6EventCode: string;
};

export function SquareSuccess({ checkoutId }: SquareSuccessProps) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(checkoutId));

  useEffect(() => {
    if (!checkoutId) {
      return;
    }

    async function completeCheckout() {
      try {
        const response = await fetch("/api/square/checkout/complete", {
          body: JSON.stringify({ checkoutId }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = (await response.json()) as {
          entry?: Entry;
          error?: string;
        };

        if (!response.ok || !data.entry) {
          throw new Error(data.error ?? "Could not confirm Square checkout.");
        }

        setEntry(data.entry);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not confirm Square checkout.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void completeCheckout();
  }, [checkoutId]);

  if (!checkoutId) {
    return (
      <div>
        <h1 className="text-3xl font-black">Return to your entry</h1>
        <p className="mt-4 leading-7 text-[#59655f]">
          Your Pin2Win entry flow should be opened from the onsite QR code at a
          partner location.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <Clock className="text-[#2f6b3f]" size={28} />
          <h1 className="text-3xl font-black">Confirming payment</h1>
        </div>
        <p className="mt-4 leading-7 text-[#59655f]">
          Square payment is being confirmed. Your Pin2Win entry will appear
          here in a moment.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-black">Payment needs confirmation</h1>
        <p className="mt-4 leading-7 text-[#59655f]">{error}</p>
        <button
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
          type="button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <CheckCircle2 className="text-[#2f6b3f]" size={30} />
        <h1 className="text-3xl font-black">Entry confirmed</h1>
      </div>
      <p className="mt-4 leading-7 text-[#59655f]">
        Your Square payment is verified and your Pin2Win challenge entry is
        ready.
      </p>
      <dl className="mt-6 grid gap-4">
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
            Pin2Win Entry ID
          </dt>
          <dd className="mt-1 rounded-md bg-[#fbf8f1] px-4 py-3 font-black">
            {entry?.id}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.12em] text-[#87908a]">
            Simulator Event Code
          </dt>
          <dd className="mt-1 rounded-md bg-[#fbf8f1] px-4 py-3 font-black">
            {entry?.e6EventCode}
          </dd>
        </div>
      </dl>
      <Link
        href={`/entry/${entry?.id}?challenge=${entry?.challengeSlug}`}
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
      >
        <KeyRound size={17} /> View entry
      </Link>
    </div>
  );
}
