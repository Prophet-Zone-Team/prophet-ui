"use client";

import { useTranslations } from "next-intl";

import { useLegalDocument } from "@/hooks/i18n/use-legal-document";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";

export function TermsAndConditionsPage() {
  const t = useTranslations("legal");
  const document = useLegalDocument("terms");

  return (
    <LegalDocumentPage
      document={document}
      title={t("termsTitle")}
    />
  );
}
