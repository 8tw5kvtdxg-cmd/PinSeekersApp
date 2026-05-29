"use client";

import { useState } from "react";
import { ArrowLeft, Building2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";

export function LocationForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [bays, setBays] = useState(["Bay 1"]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLocation() {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, address, city, state, bays }),
      });
      const data = (await response.json()) as {
        location?: { slug: string };
        error?: string;
      };

      if (!response.ok || !data.location) {
        throw new Error(data.error ?? "Could not create location.");
      }

      setMessage("Location created. QR codes are ready on the locations page.");
      window.location.href = `/admin/locations?created=${data.location.slug}`;
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not create location.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 rounded-lg border border-[#ded6c8] bg-white p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Building2 className="text-[#2f6b3f]" size={30} />
          <h2 className="mt-3 text-2xl font-black">Partner details</h2>
        </div>
        <Link
          href="/admin/locations"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-4 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
        >
          <ArrowLeft size={17} /> Back
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["Location name", name, setName],
          ["Optional slug", slug, setSlug],
          ["Address", address, setAddress],
          ["City", city, setCity],
          ["State", state, setState],
        ].map(([label, value, setter]) => (
          <label
            key={label as string}
            className="grid gap-2 text-sm font-bold text-[#53605a]"
          >
            {label as string}
            <input
              className="h-12 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
              value={value as string}
              onChange={(event) =>
                (setter as (nextValue: string) => void)(event.target.value)
              }
            />
          </label>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black">Bay QR codes</h3>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#18211f] px-4 text-sm font-black text-white transition hover:bg-[#2a3935]"
            type="button"
            onClick={() => setBays((current) => [...current, `Bay ${current.length + 1}`])}
          >
            <Plus size={16} /> Add bay
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {bays.map((bay, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="h-12 flex-1 rounded-md border border-[#ded6c8] px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
                value={bay}
                onChange={(event) =>
                  setBays((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  )
                }
              />
              <button
                className="flex h-12 w-12 items-center justify-center rounded-md border border-[#ded6c8] text-[#9a3324] transition hover:bg-[#fff5f2]"
                type="button"
                onClick={() =>
                  setBays((current) =>
                    current.length === 1
                      ? [""]
                      : current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                aria-label="Remove bay"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-md bg-[#fff5f2] px-4 py-3 text-sm font-bold text-[#9a3324]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-5 rounded-md bg-[#eef7e9] px-4 py-3 text-sm font-bold text-[#2f6b3f]">
          {message}
        </p>
      ) : null}

      <button
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#2f6b3f] px-6 text-sm font-black text-white transition hover:bg-[#3f7f4c] disabled:cursor-not-allowed disabled:bg-[#ded6c8] disabled:text-[#6b756f]"
        disabled={isSubmitting || !name.trim()}
        type="button"
        onClick={submitLocation}
      >
        <Save size={18} /> {isSubmitting ? "Creating..." : "Create location"}
      </button>
    </section>
  );
}
