import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/legal-document-page";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Pin2Win",
};

export default function PrivacyPage() {
  return <><LegalDocumentPage documentKey="privacy" /><div className="bg-[#f8f4ec] px-5 pb-10 text-center text-sm"><Link href="/privacy-request" className="font-semibold underline">Submit a privacy request without an account</Link></div></>;
}
