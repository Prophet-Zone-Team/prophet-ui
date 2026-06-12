"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { privacyPolicyDocumentKeys } from "@/data/legal/privacy-keys";
import { termsAndConditionsDocumentKeys } from "@/data/legal/terms-keys";
import { resolveLegalDocument } from "@/lib/legal/resolve-legal-document";
import type { LegalDocument } from "@/types/legal";

export type LegalDocumentId = "privacy" | "terms";

const documentKeys = {
  privacy: privacyPolicyDocumentKeys,
  terms: termsAndConditionsDocumentKeys,
} as const;

export function useLegalDocument(documentId: LegalDocumentId): LegalDocument {
  const t = useTranslations(`legal.docs.${documentId}`);

  return useMemo(
    () =>
      resolveLegalDocument(documentKeys[documentId], (key) => t(key)),
    [documentId, t]
  );
}
