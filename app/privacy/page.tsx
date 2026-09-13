import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/legal-document-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Pin2Win",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return <LegalDocumentPage documentKey="privacy" />;
}
