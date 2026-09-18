"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClubhouseChallenge } from "@/lib/clubhouse";
import type { ClubhouseChallengeSettingView } from "@/lib/clubhouse-challenge-settings";
type BayOption = {
    id: string;
    name: string;
    locationName: string;
};
export function ChallengeAdminCard({ challenge, setting, bays }: {
    challenge: ClubhouseChallenge;
    setting: ClubhouseChallengeSettingView;
    bays: BayOption[];
}) {
    const router = useRouter();
    const [form, setForm] = useState(setting);
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    async function save() {
        setSaving(true);
        setMessage("");
        try {
            const response = await fetch(`/api/clubhouse/challenges/${challenge.slug}/event-code`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventCode: form.e6EventCode, startsAt: form.startsAt, endsAt: form.endsAt, configuration: form }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || "Could not save challenge.");
            setForm(data);
            setMessage("Challenge settings saved.");
            router.refresh();
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not save challenge.");
        }
        finally {
            setSaving(false);
        }
    }
    return <section className="rounded-lg border border-[#ded6c8] bg-white p-6">
    <h2 className="text-2xl font-black">{challenge.name}</h2>
    <p className="my-4 text-sm">$20 entry · five shots · 15-minute play window. Save incomplete work as Draft. Open requires the completed readiness record and an assigned bay.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1">Sales state<select className="rounded border p-3" value={form.salesState} onChange={e => setForm({ ...form, salesState: e.target.value })}>{['Draft', 'Open', 'Paused', 'Closed'].map(s => <option key={s}>{s}</option>)}</select></label>
      {([['e6EventCode', 'Simulator event code'], ['courseName', 'Course'], ['teeName', 'Tee'], ['pinPosition', 'Pin position'], ['simulatorSettings', 'Simulator settings (including aids, mulligans, wind and shot limits)'], ['readinessReference', 'Rehearsal / funding / evidence record reference']] as const).map(([key, label]) => <label className="grid gap-1" key={key}>{label}<input className="rounded border p-3" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}/></label>)}
      {([['holeNumber', 'Hole (1–18)'], ['distanceYards', 'Target distance (yards)']] as const).map(([key, label]) => <label className="grid gap-1" key={key}>{label}<input className="rounded border p-3" type="number" min="1" max={key === 'holeNumber' ? 18 : 1000} value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value ? Number(e.target.value) : null })}/></label>)}
      {([['startsAt', 'Sales open (UTC)'], ['endsAt', 'Sales close (UTC)']] as const).map(([key, label]) => <label className="grid gap-1" key={key}>{label}<input className="rounded border p-3" type="datetime-local" value={form[key]?.slice(0, 16) || ''} onChange={e => setForm({ ...form, [key]: e.target.value ? `${e.target.value}:00.000Z` : '' })}/></label>)}
    </div>
    <fieldset className="my-5 grid gap-3"><legend className="mb-3 font-bold">Approved venue / bay assignments</legend>{bays.map(b => <label key={b.id} className="flex gap-3"><input type="checkbox" checked={form.bayIds.includes(b.id)} onChange={e => setForm({ ...form, bayIds: e.target.checked ? [...form.bayIds, b.id] : form.bayIds.filter(id => id !== b.id) })}/>{b.locationName} — {b.name}</label>)}{!bays.length && <p>Add an active bay in Locations before opening sales.</p>}</fieldset>
    <fieldset className="my-5 grid gap-3"><legend className="mb-3 font-bold">Operational sign-off</legend>{([['prizeFundingConfirmed', 'Prize funding or insurance is confirmed and documented'], ['evidenceReady', 'Simulator evidence, winner review, secure documents and prize administration are ready'], ['rehearsalCompleted', 'Supervised payment, simulator, closure and refund rehearsal is complete']] as const).map(([key, label]) => <label className="flex gap-3" key={key}><input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })}/>{label}</label>)}</fieldset>
    <p className="my-3 text-sm">Only mark checks complete after reviewing evidence. Saving records the authenticated administrator and time. Dates above are UTC.</p>
    <button className="rounded bg-[#18211f] px-6 py-3 font-bold text-white" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save challenge'}</button>
    <p className="mt-3" role="status">{message}</p>
  </section>;
}
