export function normalizeWhitelistEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isChinaGeo(country?: string): boolean {
  return country?.trim().toUpperCase() === "CN";
}

export function isWhitelistLoginGeoActive(
  country: string | undefined,
  configuredCount: number,
): boolean {
  return configuredCount > 0 && isChinaGeo(country);
}
