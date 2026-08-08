"use client";

import { useState } from "react";
import { ArrowLeft, Building2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";

type LocationFormProps = {
  mode?: "create" | "edit";
  locationId?: string;
  simulatorSoftwareOptions?: string[];
  initialValues?: {
    name: string;
    slug: string;
    address: string;
    city: string;
    state: string;
    websiteUrl: string;
    bookingUrl: string;
    simulatorProvider: SimulatorProviderValue;
    simulatorSoftwareName: string;
    bays: string[];
  };
};

type SimulatorProviderValue =
  | "TRUGOLF_APOGEE_E6"
  | "E6_CONNECT"
  | "FLIGHTSCOPE_E6"
  | "MANUAL"
  | "OTHER";

const simulatorProviders: {
  value: SimulatorProviderValue;
  label: string;
  description: string;
}[] = [
  {
    value: "E6_CONNECT",
    label: "E6 Connect",
    description: "For venues running E6 Connect as the primary challenge software.",
  },
  {
    value: "TRUGOLF_APOGEE_E6",
    label: "TruGolf Apogee + E6",
    description: "For Apogee launch monitor setups that currently route into E6.",
  },
  {
    value: "FLIGHTSCOPE_E6",
    label: "FlightScope + E6",
    description: "For FlightScope simulator setups connected to E6.",
  },
  {
    value: "OTHER",
    label: "Other / To be confirmed",
    description: "For future simulator software or unknown setups.",
  },
];

const defaultSimulatorSoftwareOptions = ["GC", "Trackman", "Garmin"];

const emptyValues = {
  name: "",
  slug: "",
  address: "",
  city: "",
  state: "",
  websiteUrl: "",
  bookingUrl: "",
  simulatorProvider: "OTHER" as SimulatorProviderValue,
  simulatorSoftwareName: "",
  bays: ["Bay 1"],
};

export function LocationForm({
  mode = "create",
  locationId,
  simulatorSoftwareOptions = [],
  initialValues = emptyValues,
}: LocationFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [slug, setSlug] = useState(initialValues.slug);
  const [address, setAddress] = useState(initialValues.address);
  const [city, setCity] = useState(initialValues.city);
  const [state, setState] = useState(initialValues.state);
  const [websiteUrl, setWebsiteUrl] = useState(initialValues.websiteUrl);
  const [bookingUrl, setBookingUrl] = useState(initialValues.bookingUrl);
  const [simulatorProvider, setSimulatorProvider] = useState<SimulatorProviderValue>(
    initialValues.simulatorProvider,
  );
  const [simulatorSoftwareName, setSimulatorSoftwareName] = useState(
    initialValues.simulatorSoftwareName,
  );
  const [bays, setBays] = useState(
    initialValues.bays.length ? initialValues.bays : [""],
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLocation() {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/locations", {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          name,
          slug,
          address,
          city,
          state,
          websiteUrl,
          bookingUrl,
          simulatorProvider,
          simulatorSoftwareName,
          bays,
        }),
      });
      const data = (await response.json()) as {
        location?: { slug: string };
        error?: string;
      };

      if (!response.ok || !data.location) {
        throw new Error(data.error ?? "Could not create location.");
      }

      setMessage(
        mode === "create"
          ? "Partner created. QR codes are ready on the partner locations page."
          : "Partner updated. QR codes and accounting details are refreshed.",
      );
      window.location.href = `/admin/locations?location=${data.location.slug}`;
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : mode === "create"
            ? "Could not create location."
            : "Could not update location.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const savedSimulatorSoftwareOptions = Array.from(
    new Set(
      [
        ...defaultSimulatorSoftwareOptions,
        ...simulatorSoftwareOptions,
        initialValues.simulatorSoftwareName,
      ]
        .map((option) => option.trim())
        .filter(Boolean),
    ),
  );
  const selectedCustomSoftware =
    simulatorProvider === "OTHER" && simulatorSoftwareName.trim()
      ? simulatorSoftwareName.trim()
      : "";
  const selectedSavedCustomSoftware =
    selectedCustomSoftware &&
    savedSimulatorSoftwareOptions.includes(selectedCustomSoftware);
  const selectValue = selectedSavedCustomSoftware
    ? `CUSTOM:${selectedCustomSoftware}`
    : simulatorProvider;

  return (
    <section className="mt-10 rounded-lg border border-[#ded6c8] bg-white p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Building2 className="text-[#2f6b3f]" size={30} />
          <h2 className="mt-3 text-2xl font-black">
            {mode === "create" ? "New partner details" : "Edit partner details"}
          </h2>
        </div>
        <Link
          href="/admin/locations"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ded6c8] bg-white px-4 text-sm font-black text-[#18211f] transition hover:bg-[#f5efdf]"
        >
          <ArrowLeft size={17} /> Back
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-[#ece5d8] bg-[#fbf8f1] p-4">
        <label className="grid gap-2 text-sm font-bold text-[#53605a]">
          Simulator type
          <select
            className="h-12 rounded-md border border-[#ded6c8] bg-white px-4 text-base font-black text-[#18211f] outline-none focus:border-[#2f6b3f]"
            value={selectValue}
            onChange={(event) => {
              const nextValue = event.target.value;

              if (nextValue.startsWith("CUSTOM:")) {
                setSimulatorProvider("OTHER");
                setSimulatorSoftwareName(nextValue.replace(/^CUSTOM:/, ""));
                return;
              }

              setSimulatorProvider(nextValue as SimulatorProviderValue);
              setSimulatorSoftwareName("");
            }}
          >
            {simulatorProviders.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
            {savedSimulatorSoftwareOptions.length ? (
              <optgroup label="Saved software">
                {savedSimulatorSoftwareOptions.map((softwareName) => (
                  <option key={softwareName} value={`CUSTOM:${softwareName}`}>
                    {softwareName}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
        <p className="mt-2 text-sm font-bold leading-6 text-[#59655f]">
          {selectedCustomSoftware
            ? "Saved custom simulator software for partners using this setup."
            : simulatorProviders.find(
                (provider) => provider.value === simulatorProvider,
              )?.description}
        </p>
        {simulatorProvider === "OTHER" ? (
          <label className="mt-4 grid gap-2 text-sm font-bold text-[#53605a]">
            Software name
            <input
              className="h-12 rounded-md border border-[#ded6c8] bg-white px-4 text-base text-[#18211f] outline-none focus:border-[#2f6b3f]"
              placeholder="TrackMan, Full Swing, AboutGolf, GSPro..."
              value={simulatorSoftwareName}
              onChange={(event) => setSimulatorSoftwareName(event.target.value)}
            />
          </label>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["Location name", name, setName],
          ["Optional slug", slug, setSlug],
          ["Address", address, setAddress],
          ["City", city, setCity],
          ["State", state, setState],
          ["Website", websiteUrl, setWebsiteUrl],
          ["Booking page", bookingUrl, setBookingUrl],
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
        <Save size={18} />{" "}
        {isSubmitting
          ? mode === "create"
            ? "Creating..."
            : "Saving..."
          : mode === "create"
            ? "Create partner"
            : "Save partner"}
      </button>
    </section>
  );
}
