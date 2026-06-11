"use client";

import { useTranslations } from "next-intl";

import { LegalDocumentPage } from "@/components/legal/legal-document-page";
import { privacyPolicyDocument } from "@/data/legal/privacy-policy";

export function PrivacyPolicyPage() {
  const t = useTranslations("legal");

  return (
    <LegalDocumentPage
      document={privacyPolicyDocument}
      title={t("privacyTitle")}
    />
  );
}
