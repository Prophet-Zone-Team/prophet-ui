import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { privacyPolicyDocument } from "@/data/legal/privacy-policy";

export function PrivacyPolicyPage() {
  return <LegalDocumentPage document={privacyPolicyDocument} />;
}
