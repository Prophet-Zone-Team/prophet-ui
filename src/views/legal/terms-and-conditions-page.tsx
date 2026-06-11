"use client";

import { useTranslations } from "next-intl";

import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { termsAndConditionsDocument } from "@/data/legal/terms-and-conditions";

export function TermsAndConditionsPage() {
  const t = useTranslations("legal");

  return (
    <LegalDocumentPage
      document={termsAndConditionsDocument}
      title={t("termsTitle")}
    />
  );
}
