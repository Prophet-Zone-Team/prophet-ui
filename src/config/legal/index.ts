export const legalMeta = {
  lastUpdated: "[Month Day, Year]",
  legalEntityName: "[Legal Entity Name]",
  principalAddress: "[Address]",
  entityJurisdiction: "[jurisdiction/entity type]",
  privacyEmail: "[privacy@prophet.zone]",
  legalEmail: "[legal@prophet.zone]",
  dpoContact: "[DPO or Representative Contact]",
  governingLawJurisdiction: "[Governing Law Jurisdiction]",
  arbitrationProvider: "[arbitration provider]",
  arbitrationSeatLanguage: "[location/language]",
} as const;

export type LegalMeta = typeof legalMeta;
