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
const centralTime = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
function localTime(iso: string) {
    return iso ? centralTime.format(new Date(iso)).replace(" ", "T") : "";
}
function toInstant(local: string, previous: string) {
    if (!local) return "";
    if (previous && localTime(previous) === local) return previous;
    // Central daylight and standard time can both match during the fall transition.
    const matches = ["-05:00", "-06:00"].map(offset => new Date(local + offset).toISOString())
        .filter(iso => localTime(iso) === local);
    if (matches.length !== 1) throw new Error("Choose a San Antonio time outside the daylight-saving clock change.");
    return matches[0];
}
export function ChallengeAdminCard({ challenge, setting, bays }: {
    challenge: ClubhouseChallenge;
    setting: ClubhouseChallengeSettingView;
    bays: BayOption[];
}) {
    const router = useRouter();
    const [form, setForm] = useState(setting);
    const [opens, setOpens] = useState(localTime(setting.startsAt));
    const [closes, setCloses] = useState(localTime(setting.endsAt));
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    async function save() {
        setSaving(true);
        setMessage("");
        try {
            const response = await fetch(`/api/clubhouse/challenges/${challenge.slug}/event-code`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventCode: form.e6EventCode, startsAt: toInstant(opens, form.startsAt), endsAt: form.neverCloses ? null : toInstant(closes, form.endsAt), configuration: form }),
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
    <p className="my-4 text-sm">$20 entry · five shots · 15-minute play window.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1">Sales state<select className="rounded border p-3" value={form.salesState} onChange={e => setForm({ ...form, salesState: e.target.value })}>{['Draft', 'Open', 'Paused', 'Closed'].map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="grid gap-1">Simulator event code<input className="rounded border p-3" value={form.e6EventCode} onChange={e => setForm({ ...form, e6EventCode: e.target.value })}/></label>
      <label className="grid gap-1">Sales open · San Antonio<input className="rounded border p-3" type="datetime-local" value={opens} onChange={e => setOpens(e.target.value)}/></label>
      <label className="grid gap-1">Sales close · San Antonio<input className="rounded border p-3" type="datetime-local" disabled={form.neverCloses} value={form.neverCloses ? "" : closes} onChange={e => setCloses(e.target.value)}/></label>
      <label className="flex items-center gap-2 sm:col-start-2"><input type="checkbox" checked={Boolean(form.neverCloses)} onChange={e => setForm({ ...form, neverCloses: e.target.checked })}/>Never Close</label>
    </div>
    <fieldset className="my-5 grid gap-3"><legend className="mb-3 font-bold">Approved venue / bay assignments</legend>{bays.map(b => <label key={b.id} className="flex gap-3"><input type="checkbox" checked={form.bayIds.includes(b.id)} onChange={e => setForm({ ...form, bayIds: e.target.checked ? [...form.bayIds, b.id] : form.bayIds.filter(id => id !== b.id) })}/>{b.locationName} — {b.name}</label>)}{!bays.length && <p>Add an active bay in Locations before opening sales.</p>}</fieldset>
    <details className="my-5"><summary className="cursor-pointer font-bold">Operational sign-off</summary><fieldset className="mt-3 grid gap-3">{([['prizeFundingConfirmed', 'Prize funding or insurance is confirmed and documented'], ['evidenceReady', 'Simulator evidence, winner review, secure documents and prize administration are ready'], ['rehearsalCompleted', 'Supervised payment, simulator, closure and refund rehearsal is complete']] as const).map(([key, label]) => <label className="flex gap-3" key={key}><input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })}/>{label}</label>)}</fieldset></details>
    <p className="my-3 text-sm">Only mark checks complete after reviewing evidence. Saving records the authenticated administrator and time.</p>
    <button className="rounded bg-[#18211f] px-6 py-3 font-bold text-white" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save challenge'}</button>
    <p className="mt-3" role="status">{message}</p>
  </section>;
}
