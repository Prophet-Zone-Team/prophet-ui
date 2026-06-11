"use client";

import { useTranslations } from "next-intl";

import { useLegalDocument } from "@/hooks/i18n/use-legal-document";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";

export function PrivacyPolicyPage() {
  const t = useTranslations("legal");
  const document = useLegalDocument("privacy");

  return (
    <LegalDocumentPage
      document={document}
      title={t("privacyTitle")}
    />
  );
}
