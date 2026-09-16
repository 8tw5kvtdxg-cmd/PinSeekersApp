import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/legal-document-page";

export const metadata: Metadata = {
  title: "Terms of Use | Pin2Win",
};

export default function TermsPage() {
  return <LegalDocumentPage documentKey="terms" />;
}
