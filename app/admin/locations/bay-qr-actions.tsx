"use client";

import { useState } from "react";
import { getQrImageUrl, slugifyLocation } from "@/lib/location-utils";

export function BayQrActions({ permanentUrl, venueSlug, bayName }: { permanentUrl: string; venueSlug: string; bayName: string }) {
  const [message, setMessage] = useState("");
  async function download() {
    try {
      const response = await fetch(getQrImageUrl(permanentUrl, 1000) + "&qzone=4&format=png");
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (blob.type !== "image/png") throw new Error();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pin2win-${venueSlug}-${slugifyLocation(bayName)}-qr.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      setMessage("QR download started.");
    } catch {
      setMessage("The QR image could not be downloaded. Try again.");
    }
  }
  return <div className="mt-3 grid gap-3 text-sm">
    <button className="justify-self-start rounded bg-[#18211f] px-4 py-2 font-bold text-white" onClick={download}>Download permanent QR (PNG)</button>
    <p role="status">{message}</p>
  </div>;
}
