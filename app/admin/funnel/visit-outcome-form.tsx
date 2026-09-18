"use client";
import { useState } from "react";
export function VisitOutcomeForm({ id, status: initial = "Unknown", source = "Unknown" }: {
    id: string;
    status?: string;
    source?: string;
}) {
    const [status, setStatus] = useState(initial), [acquisitionSource, setSource] = useState(source), [evidence, setEvidence] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
    return <form className="flex flex-wrap gap-2" onSubmit={async (event) => { event.preventDefault(); setBusy(true); try {
        const response = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}/outcome`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, acquisitionSource, evidence }) });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error);
        window.location.reload();
    }
    catch (error) {
        setMessage(error instanceof Error ? error.message : "Save failed.");
    }
    finally {
        setBusy(false);
    } }}>
 <select aria-label="Visit outcome" value={status} onChange={e => setStatus(e.target.value)}>{["Unknown", "Completed", "Cancelled", "No show"].map(v => <option key={v}>{v}</option>)}</select>
 <select aria-label="Acquisition evidence" value={acquisitionSource} onChange={e => setSource(e.target.value)}>{["Unknown", "Customer reported Pin2Win", "Partner referral record"].map(v => <option key={v}>{v}</option>)}</select>
 <input aria-label="Evidence reference" placeholder="Staff / venue record reference" required minLength={10} maxLength={1000} value={evidence} onChange={e => setEvidence(e.target.value)}/><button disabled={busy}>Save outcome</button><p role="status">{message}</p></form>;
}
