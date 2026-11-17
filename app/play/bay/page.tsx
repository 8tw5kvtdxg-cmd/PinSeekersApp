import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveBayEntry } from "@/lib/bay-entry";

export default async function BayEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const result = typeof id === "string" && id ? await resolveBayEntry(id) : null;
  if (result?.current) redirect(result.current.path);
  if (result?.bay) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="text-3xl font-black">{result.bay.location.name} — {result.bay.name}</h1>
        <p className="my-6">No Pin2Win challenge is open for this bay right now. Scan this same QR code when entry opens.</p>
        <Link href="/rent" className="font-bold underline">Book simulator time</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-3xl font-black">Bay entry unavailable</h1>
      <p className="my-6">Ask venue staff for the current Pin2Win bay QR code.</p>
    </main>
  );
}
