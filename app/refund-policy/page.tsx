import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/legal-document-page";

export const metadata: Metadata = {
  title: "Refund and Payment Issue Policy | Pin2Win",
  robots: { index: false, follow: false },
};

export default function RefundPolicyPage() {
  return <LegalDocumentPage documentKey="refund-policy" />;
}
