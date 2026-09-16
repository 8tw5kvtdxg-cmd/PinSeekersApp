import type { Metadata } from "next";
import { LegalDocumentPage } from "@/app/components/legal-document-page";

export const metadata: Metadata = {
  title: "Official Hole-in-One Challenge Rules | Pin2Win",
};

export default function OfficialRulesPage() {
  return <LegalDocumentPage documentKey="official-rules" />;
}
