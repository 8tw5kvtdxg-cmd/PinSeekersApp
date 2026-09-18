import Link from "next/link";
import { getCurrentPlayer } from "@/lib/player-auth";
import { verificationReturnPath } from "@/lib/verification-return-path";
import { VerificationForm } from "./verification-form";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: {
    searchParams: Promise<{
        next?: string;
    }>;
}) {
    const next = verificationReturnPath((await searchParams).next);
    const player = await getCurrentPlayer();
    return <main className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-black">Verify your email</h1>
 {player ? player.emailVerifiedAt ? <Link href={next}>Email verified. Continue</Link> : <><p className="my-6">Verify {player.email} before purchasing a challenge entry. Open the verification link in your inbox or request one below. Your challenge location and bay will be preserved. If it did not arrive, check spam or request a new link below.</p><VerificationForm nextPath={next}/></> : <Link href={next === "/account" ? next : next.includes("?") ? next.replace("?", "/account?") : `${next}/account`}>Log in to continue</Link>}
 </main>;
}
