"use client";

import { useState } from "react";
import { CheckCircle2, Clock, MailCheck, Plus, RefreshCw, XCircle } from "lucide-react";
import type {
  BookingVerificationRecord,
  BookingVerificationStatus,
} from "@/lib/booking-verification-store";

type BookingVerificationConsoleProps = {
  initialBookings: BookingVerificationRecord[];
};

const statusOptions: BookingVerificationStatus[] = [
  "Pending Match",
  "Needs Review",
  "Auto Verified",
  "Used",
  "Rejected",
];

function formatCurrency(cents?: number) {
  if (typeof cents !== "number") {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatBookingTime(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function BookingVerificationConsole({
  initialBookings,
}: BookingVerificationConsoleProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservationStartsAt, setReservationStartsAt] = useState("");
  const [bayName, setBayName] = useState("");
  const [productName, setProductName] = useState("Pin2Win Hole-in-One Challenge");
  const [amount, setAmount] = useState("25");
  const [externalReference, setExternalReference] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshBookings() {
    setIsRefreshing(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/bookings", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        bookings?: BookingVerificationRecord[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not refresh bookings.");
      }

      setBookings(data.bookings ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not refresh bookings.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function createBooking() {
    setIsSaving(true);
    setMessage("");

    try {
      const amountNumber = Number(amount);
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          locationSlug: "alamo-golf-den",
          locationName: "Alamo Golf Den",
          bayName,
          productName,
          reservationStartsAt,
          amountCents: Number.isFinite(amountNumber)
            ? Math.round(amountNumber * 100)
            : undefined,
          source: "Manual",
          externalReference,
        }),
      });
      const data = (await response.json()) as {
        booking?: BookingVerificationRecord;
        error?: string;
      };

      if (!response.ok || !data.booking) {
        throw new Error(data.error ?? "Could not add booking.");
      }

      setBookings((current) => [data.booking as BookingVerificationRecord, ...current]);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setReservationStartsAt("");
      setBayName("");
      setExternalReference("");
      setMessage("Booking verification record added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add booking.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(
    bookingId: string,
    status: BookingVerificationStatus,
  ) {
    setMessage("");

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as {
        booking?: BookingVerificationRecord;
        error?: string;
      };

      if (!response.ok || !data.booking) {
        throw new Error(data.error ?? "Could not update booking.");
      }

      setBookings((current) =>
        current.map((booking) =>
          booking.id === data.booking?.id ? data.booking : booking,
        ),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update booking.",
      );
    }
  }

  const pendingCount = bookings.filter(
    (booking) => booking.status === "Pending Match",
  ).length;
  const usedCount = bookings.filter((booking) => booking.status === "Used").length;
  const reviewCount = bookings.filter(
    (booking) => booking.status === "Needs Review",
  ).length;

  return (
    <div className="mt-10 grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-lg border border-[#ded6c8] bg-white p-6">
        <div className="flex items-center gap-3">
          <Plus className="text-[#2f6b3f]" size={26} />
          <h2 className="text-2xl font-black">Add booking record</h2>
        </div>
        <div className="mt-6 grid gap-4">
          <input
            className="h-12 rounded-md border border-[#ded6c8] px-4 text-sm outline-none focus:border-[#2f6b3f]"
            placeholder="Customer name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
          <input
            className="h-12 rounded-md border border-[#ded6c8] px-4 text-sm outline-none focus:border-[#2f6b3f]"
            placeholder="Booking email"
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
          />
          <input
            className="h-12 rounded-md border border-[#ded6c8] px-4 text-sm outline-none focus:border-[#2f6b3f]"
            placeholder="Phone, if included"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
          />
          <input
            className="h-12 rounded-md border border-[#ded6c8] px-4 text-sm outline-none focus:border-[#2f6b3f]"
            type="datetime-local"
            value={reservationStartsAt}
            onChange={(event) => setReservationStartsAt(event.target.value)}
          />
          <input
            className="h-12 rounded-md border border-[#ded6c8] px-4 text-sm outline-none focus:border-[#2f6b3f]"
            placeholder="Bay name, if known"
            value={bayName}
            onChange={(event) => setBayName(event.target.value)}
          />
          <input
            className="h-12 rounded-md border border-[#ded6c8] px-4 text-sm outline-none focus:border-[#2f6b3f]"
            placeholder="Product name"
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
          />
          <input
            className="h-12 rounded-md border border-[#ded6c8] px-4 text-sm outline-none focus:border-[#2f6b3f]"
            inputMode="decimal"
            placeholder="Amount, dollars"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <input
            className="h-12 rounded-md border border-[#ded6c8] px-4 text-sm outline-none focus:border-[#2f6b3f]"
            placeholder="Confirmation/reference, optional"
            value={externalReference}
            onChange={(event) => setExternalReference(event.target.value)}
          />
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#18211f] px-5 text-sm font-black text-white transition hover:bg-[#2a3935]"
            disabled={isSaving}
            type="button"
            onClick={createBooking}
          >
            <Plus size={17} /> {isSaving ? "Adding..." : "Add booking"}
          </button>
        </div>
        {message ? (
          <p className="mt-4 rounded-md bg-[#fbf8f1] px-4 py-3 text-sm font-bold text-[#59655f]">
            {message}
          </p>
        ) : null}
      </section>

      <section className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Pending", String(pendingCount), Clock],
            ["Needs review", String(reviewCount), MailCheck],
            ["Used", String(usedCount), CheckCircle2],
          ].map(([label, value, Icon]) => (
            <div
              key={label as string}
              className="rounded-lg border border-[#ded6c8] bg-white p-5"
            >
              <Icon className="text-[#2f6b3f]" size={26} />
              <p className="mt-4 text-3xl font-black">{value as string}</p>
              <p className="mt-1 text-sm font-bold text-[#59655f]">
                {label as string}
              </p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-lg border border-[#ded6c8] bg-white">
          <div className="flex flex-col justify-between gap-3 bg-[#18211f] px-5 py-4 text-white sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black">Booking queue</h2>
              <p className="mt-1 text-sm font-bold text-white/62">
                Records from CC&apos;d emails, manual entry, or imports.
              </p>
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-xs font-black text-[#18211f] transition hover:bg-[#f5efdf]"
              disabled={isRefreshing}
              type="button"
              onClick={refreshBookings}
            >
              <RefreshCw size={15} />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 text-center">
              <MailCheck className="mx-auto text-[#2f6b3f]" size={34} />
              <h3 className="mt-4 text-xl font-black">No bookings yet</h3>
              <p className="mt-3 text-sm leading-6 text-[#59655f]">
                Add a booking manually or connect the CC&apos;d booking inbox later.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <article
                key={booking.id}
                className="grid gap-5 border-t border-[#ece5d8] px-5 py-5 lg:grid-cols-[1.2fr_1fr_1fr_170px]"
              >
                <div>
                  <p className="font-black">{booking.customerName}</p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    {booking.customerEmail}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    {booking.customerPhone || "No phone captured"}
                  </p>
                </div>
                <div>
                  <p className="font-black">{booking.productName}</p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    {formatBookingTime(booking.reservationStartsAt)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    {booking.bayName || booking.locationName}
                  </p>
                </div>
                <div>
                  <p className="font-black">{formatCurrency(booking.amountCents)}</p>
                  <p className="mt-1 text-sm font-bold text-[#59655f]">
                    Source: {booking.source}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#87908a]">
                    {booking.externalReference || booking.id}
                  </p>
                </div>
                <div>
                  <select
                    className="h-10 w-full rounded-md border border-[#ded6c8] bg-white px-3 text-sm font-black outline-none focus:border-[#2f6b3f]"
                    value={booking.status}
                    onChange={(event) =>
                      updateStatus(
                        booking.id,
                        event.target.value as BookingVerificationStatus,
                      )
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {booking.matchedEntryId ? (
                    <p className="mt-2 text-xs font-black text-[#2f6b3f]">
                      Entry: {booking.matchedEntryId}
                    </p>
                  ) : null}
                  {booking.status === "Rejected" ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#9a3324]">
                      <XCircle size={14} /> Rejected
                    </p>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </div>
  );
}
