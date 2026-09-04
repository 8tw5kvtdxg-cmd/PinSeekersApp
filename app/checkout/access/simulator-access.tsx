"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  KeyRound,
  MapPin,
  MonitorPlay,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type SimulatorAccessProps = {
  checkoutId: string;
  squareOrderId?: string;
  squarePaymentId?: string;
};

type Entry = {
  id: string;
  challengeSlug: string;
  playerName: string;
  phoneNumber?: string;
  e6DisplayName: string;
  e6EventCode?: string;
  locationName?: string;
  locationSlug?: string;
  bayName?: string;
  validFrom: string;
  validUntil: string;
  attemptLimit: number;
};

const e6Steps = [
  "Go to the simulator computer at your bay.",
  "Open the E6 Golf app if it is not already open.",
  "Most players will already be signed in to E6 when they arrive for their bay booking. Make sure the E6 username matches the username listed with your Pin2Win entry so Pin2Win can verify your challenge entry and result.",
  "Select the Event navigation header in the E6 Golf app.",
  "At the bottom left of the Event tab, select the button that says Enter event code or similar.",
  "Type in the event code shown on this page to start the Pin2Win Hole-in-One Challenge.",
  "Time to go Pin Hunting.",
  "When you are finished use the button below to manually enter your result, closest shot out of 5. Pin2Win will verify your results and display on our monthly leaderboard.",
];

export function SimulatorAccess({
  checkoutId,
  squareOrderId,
  squarePaymentId,
}: SimulatorAccessProps) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(checkoutId));
  const [isEventCodeHidden, setIsEventCodeHidden] = useState(false);
  const [isEventCodeExpired, setIsEventCodeExpired] = useState(false);
  const [eventCodeExpiresAt, setEventCodeExpiresAt] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isCaptureWarningVisible, setIsCaptureWarningVisible] = useState(false);

  useEffect(() => {
    function handleVisibilityChange() {
      setIsCaptureWarningVisible(document.hidden);
    }

    function handleContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key === "PrintScreen" ||
        (event.metaKey && event.shiftKey && ["3", "4", "5"].includes(event.key)) ||
        (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s")
      ) {
        event.preventDefault();
        setIsCaptureWarningVisible(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!checkoutId) {
      return;
    }

    let isMounted = true;

    async function completeCheckout() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/square/checkout/complete", {
          body: JSON.stringify({
            checkoutId,
            revealAccess: true,
            squareOrderId,
            squarePaymentId,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const data = (await response.json()) as {
          entry?: Entry;
          error?: string;
          eventCodeExpired?: boolean;
          eventCodeExpiresAt?: string;
        };

        if (!response.ok || !data.entry) {
          throw new Error(data.error ?? "Could not confirm Square checkout.");
        }

        if (isMounted) {
          const wasHiddenForResult =
            window.sessionStorage.getItem(
              `pin2win-event-code-hidden:${data.entry.id}`,
            ) === "true";

          setEntry(
            wasHiddenForResult
              ? { ...data.entry, e6EventCode: undefined }
              : data.entry,
          );
          setEventCodeExpiresAt(data.eventCodeExpiresAt ?? "");
          setIsEventCodeExpired(
            data.eventCodeExpired === true || !data.entry.e6EventCode,
          );
          setSecondsRemaining(
            data.eventCodeExpiresAt
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(data.eventCodeExpiresAt).getTime() - Date.now()) /
                      1000,
                  ),
                )
              : null,
          );
          setIsEventCodeHidden(wasHiddenForResult);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not confirm Square checkout.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void completeCheckout();

    return () => {
      isMounted = false;
    };
  }, [checkoutId, squareOrderId, squarePaymentId]);

  useEffect(() => {
    if (!eventCodeExpiresAt || isEventCodeHidden || isEventCodeExpired) {
      return;
    }

    function updateCountdown() {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(eventCodeExpiresAt).getTime() - Date.now()) / 1000),
      );

      setSecondsRemaining(remaining);

      if (remaining === 0) {
        setIsEventCodeExpired(true);
        setEntry((currentEntry) =>
          currentEntry
            ? { ...currentEntry, e6EventCode: undefined }
            : currentEntry,
        );
      }
    }

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [eventCodeExpiresAt, isEventCodeExpired, isEventCodeHidden]);

  function handleResultEntryClick() {
    if (!entry) {
      return;
    }

    window.sessionStorage.setItem(`pin2win-event-code-hidden:${entry.id}`, "true");
    setEntry({ ...entry, e6EventCode: undefined });
    setIsEventCodeHidden(true);
  }

  if (!checkoutId) {
    return (
      <section className="mx-auto mt-10 max-w-2xl rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
        <AlertCircle className="text-[#8d4f28]" size={30} />
        <h1 className="mt-4 text-3xl font-black">Payment link needed</h1>
        <p className="mt-3 leading-7 text-[#59655f]">
          Simulator access opens after a completed Pin2Win checkout. Please
          start from the onsite QR code at a partner location.
        </p>
        <Link
          href="/locations"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
        >
          View locations
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="mx-auto mt-10 max-w-2xl rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
        <div className="flex items-center gap-3">
          <Clock className="text-[#2f6b3f]" size={30} />
          <h1 className="text-3xl font-black">Confirming payment</h1>
        </div>
        <p className="mt-4 leading-7 text-[#59655f]">
          Square payment is being verified. Your simulator access info will
          appear here in a moment.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto mt-10 max-w-2xl rounded-lg border border-[#ded6c8] bg-white p-6 shadow-xl shadow-[#18211f]/8">
        <AlertCircle className="text-[#8d4f28]" size={30} />
        <h1 className="mt-4 text-3xl font-black">Payment needs confirmation</h1>
        <p className="mt-3 leading-7 text-[#59655f]">{error}</p>
        <button
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
          type="button"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={17} /> Try again
        </button>
      </section>
    );
  }

  return (
    <div
      className={`mx-auto mt-8 max-w-5xl ${
        isCaptureWarningVisible ? "select-none blur-xl" : ""
      }`}
      style={{ WebkitTouchCallout: "none" }}
    >
      <section className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white shadow-xl shadow-[#18211f]/8">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[#18211f] p-6 text-white sm:p-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#a8c878]" size={32} />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-white/62">
                  Payment confirmed
                </p>
                <h1 className="mt-2 text-3xl font-black">
                  Simulator Access Info
                </h1>
              </div>
            </div>

            <div className="mt-8 rounded-md border border-white/16 bg-white/8 p-5">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-white/62">
                Entry Code
              </p>
              {isEventCodeHidden || isEventCodeExpired ? (
                <>
                  <p className="mt-3 text-2xl font-black tracking-normal">
                    {isEventCodeExpired
                      ? "10-minute access window ended"
                      : "Hidden after result entry started"}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-white/72">
                    {isEventCodeExpired
                      ? "Pay for another entry to receive a new eligible challenge attempt."
                      : "Your entry code was hidden to protect your completed challenge attempt."}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 break-all text-4xl font-black tracking-normal">
                    {entry?.e6EventCode}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-white/72">
                    Enter this code in the simulator software to access the
                    Pin2Win Hole-in-One Challenge.
                  </p>
                  {secondsRemaining !== null ? (
                    <p className="mt-3 text-sm font-black text-[#ffe7a2]">
                      Code hides in {Math.floor(secondsRemaining / 60)}:
                      {String(secondsRemaining % 60).padStart(2, "0")}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-white/52">
                  Pin2Win Entry ID
                </dt>
                <dd className="mt-1 break-all font-black">{entry?.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.12em] text-white/52">
                  Play Window
                </dt>
                <dd className="mt-1 font-black">
                  {entry?.validFrom} to {entry?.validUntil}
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <MonitorPlay className="text-[#2f6b3f]" size={28} />
              <h2 className="text-2xl font-black">Start the E6 challenge</h2>
            </div>
            <ol className="mt-6 grid gap-3">
              {e6Steps.map((step, index) => (
                <li
                  className="grid grid-cols-[2rem_1fr] items-start gap-3 text-sm leading-6 text-[#59655f]"
                  key={step}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef4e7] text-sm font-black text-[#2f6b3f]">
                    {index + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            {entry ? (
              <Link
                href={`/entry/${entry.id}/result`}
                onClick={handleResultEntryClick}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935] sm:w-auto"
              >
                <PencilLine size={18} /> Manually enter result
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 border-t border-[#ece5d8] bg-[#fbf8f1] p-6 lg:grid-cols-3">
          <div>
            <UserRound className="text-[#2f6b3f]" size={24} />
            <h3 className="mt-3 font-black">Player</h3>
            <p className="mt-2 text-sm leading-6 text-[#59655f]">
              {entry?.playerName}
            </p>
            <p className="mt-1 text-sm font-black text-[#18211f]">
              Simulator name: {entry?.e6DisplayName}
            </p>
          </div>
          <div>
            <MapPin className="text-[#2f6b3f]" size={24} />
            <h3 className="mt-3 font-black">Location</h3>
            <p className="mt-2 text-sm leading-6 text-[#59655f]">
              {entry?.locationName || "Partner location"}
            </p>
            {entry?.bayName ? (
              <p className="mt-1 text-sm font-black text-[#18211f]">
                Bay: {entry.bayName}
              </p>
            ) : null}
          </div>
          <div>
            <ShieldCheck className="text-[#2f6b3f]" size={24} />
            <h3 className="mt-3 font-black">Entry protection</h3>
            <p className="mt-2 text-sm leading-6 text-[#59655f]">
              Use this player record and simulator name so Pin2Win can match the
              result to your paid entry.
            </p>
          </div>
        </div>
      </section>

      {entry ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/play/${entry.challengeSlug}?${new URLSearchParams({
              ...(entry.locationSlug ? { location: entry.locationSlug } : {}),
              ...(entry.bayName ? { bay: entry.bayName } : {}),
              autoCheckout: "1",
            }).toString()}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-5 text-sm font-black text-white"
          >
            <CreditCard size={17} /> Play again
          </Link>
          <Link
            href={`/entry/${entry.id}?challenge=${entry.challengeSlug}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white"
          >
            <KeyRound size={17} /> View entry record
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#d8cfbf] bg-white px-5 text-sm font-black text-[#18211f]"
          >
            Pin2Win home
          </Link>
        </div>
      ) : null}
    </div>
  );
}
