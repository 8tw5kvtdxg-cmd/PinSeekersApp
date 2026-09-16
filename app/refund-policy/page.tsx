import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/legal-document-page";

export const metadata: Metadata = {
  title: "Refund and Payment Issue Policy | Pin2Win",
};

export default function RefundPolicyPage() {
  return <LegalDocumentPage documentKey="refund-policy" />;
}
