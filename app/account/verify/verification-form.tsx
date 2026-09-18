"use client";
import { useState } from "react";
export function VerificationForm({ nextPath }: {
    nextPath: string;
}) {
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    async function resend() { setBusy(true); try {
        const response = await fetch("/api/account/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ next: nextPath }) });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error || "Could not send email.");
        if (data.alreadyVerified) {
            window.location.assign(nextPath);
            return;
        }
        setMessage("Verification email sent. Check your inbox and spam folder.");
    }
    catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not send email.");
    }
    finally {
        setBusy(false);
    } }
    return <><button className="rounded bg-green-900 p-3 text-white" disabled={busy} onClick={resend}>{busy ? "Sending…" : "Send verification email"}</button><p role="status" className="mt-4">{message}</p></>;
}
