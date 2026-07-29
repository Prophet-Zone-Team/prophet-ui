/** FIFA World Cup fixture slugs use the `fifwc-` prefix (e.g. fifwc-usa-par-2026-06-12). */
export function isFifaWorldCupGameSlug(slug: string | undefined): boolean {
  return Boolean(slug?.trim().toLowerCase().startsWith("fifwc-"));
}
