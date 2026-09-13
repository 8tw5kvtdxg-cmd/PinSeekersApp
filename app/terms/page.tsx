import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/legal-document-page";

export const metadata: Metadata = {
  title: "Terms of Use | Pin2Win",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return <LegalDocumentPage documentKey="terms" />;
}
