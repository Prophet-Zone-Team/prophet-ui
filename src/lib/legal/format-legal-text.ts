import { legalMeta } from "@/config/legal";
import type { LegalListItem, LegalTextSegment } from "@/types/legal";

const TOKEN_MAP: Record<string, string> = {
  legalEntityName: legalMeta.legalEntityName,
  principalAddress: legalMeta.principalAddress,
  entityJurisdiction: legalMeta.entityJurisdiction,
  privacyEmail: legalMeta.privacyEmail,
  legalEmail: legalMeta.legalEmail,
  dpoContact: legalMeta.dpoContact,
  governingLawJurisdiction: legalMeta.governingLawJurisdiction,
  arbitrationProvider: legalMeta.arbitrationProvider,
  arbitrationSeatLanguage: legalMeta.arbitrationSeatLanguage,
  lastUpdated: legalMeta.lastUpdated,
};

export function formatLegalString(input: string): string {
  return input.replace(/\{(\w+)\}/g, (match, key: string) => {
    return TOKEN_MAP[key] ?? match;
  });
}

export function formatLegalSegments(
  segments: LegalTextSegment[]
): LegalTextSegment[] {
  return segments.map((segment) => {
    if (segment.kind === "link") {
      return {
        kind: "link",
        label: formatLegalString(segment.label),
        href: segment.href,
      };
    }

    return {
      kind: "text",
      value: formatLegalString(segment.value),
    };
  });
}

export function formatLegalListItem(item: LegalListItem): LegalListItem {
  if (typeof item === "string") {
    return formatLegalString(item);
  }

  return formatLegalSegments(item);
}
