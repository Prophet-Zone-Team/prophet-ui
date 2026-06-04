import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { termsAndConditionsDocument } from "@/data/legal/terms-and-conditions";

export function TermsAndConditionsPage() {
  return <LegalDocumentPage document={termsAndConditionsDocument} />;
}
