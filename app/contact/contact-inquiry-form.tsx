"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type FormState = {
  email: string;
  message: string;
  name: string;
  phone: string;
  venueName: string;
};

const initialForm: FormState = {
  email: "",
  message: "",
  name: "",
  phone: "",
  venueName: "",
};

export function ContactInquiryForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"error" | "success" | "">("");

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setStatus("");

    try {
      const response = await fetch("/api/contact/inquiry", {
        body: JSON.stringify(form),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not send inquiry.");
      }

      setForm(initialForm);
      setStatus("success");
      setMessage("Inquiry sent. We will follow up soon.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Could not send inquiry.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={submitInquiry}>
      <label className="grid gap-2 text-sm font-bold text-[#51615b]">
        Name
        <input
          className="h-12 rounded-md border border-[#dfe6df] px-4 text-base text-[#13201c] outline-none focus:border-[#2f6b3f]"
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Your name"
          required
          value={form.name}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[#51615b]">
        Email
        <input
          className="h-12 rounded-md border border-[#dfe6df] px-4 text-base text-[#13201c] outline-none focus:border-[#2f6b3f]"
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={form.email}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[#51615b]">
        Venue
        <input
          className="h-12 rounded-md border border-[#dfe6df] px-4 text-base text-[#13201c] outline-none focus:border-[#2f6b3f]"
          onChange={(event) => updateField("venueName", event.target.value)}
          placeholder="Simulator location name"
          value={form.venueName}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[#51615b]">
        Phone
        <input
          className="h-12 rounded-md border border-[#dfe6df] px-4 text-base text-[#13201c] outline-none focus:border-[#2f6b3f]"
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="Best contact number"
          type="tel"
          value={form.phone}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[#51615b]">
        Message
        <textarea
          className="min-h-32 rounded-md border border-[#dfe6df] px-4 py-3 text-base text-[#13201c] outline-none focus:border-[#2f6b3f]"
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Tell us about your venue or support request."
          required
          value={form.message}
        />
      </label>
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#13201c] px-6 text-sm font-black text-white transition hover:bg-[#243630] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending..." : "Send inquiry"} <ArrowRight size={18} />
      </button>
      {message ? (
        <p
          className={`inline-flex items-center gap-2 rounded-md px-4 py-3 text-sm font-bold ${
            status === "success"
              ? "bg-[#eef7e9] text-[#2f6b3f]"
              : "bg-[#fff0ed] text-[#9f341f]"
          }`}
        >
          {status === "success" ? <CheckCircle2 size={16} /> : null}
          {message}
        </p>
      ) : null}
    </form>
  );
}
