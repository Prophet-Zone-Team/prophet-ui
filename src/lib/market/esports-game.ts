export function isEsportsGameSlug(slug: string): boolean {
  return /^lol-/i.test(slug.trim());
}

/** Extract league/tournament label from esports fixture title. */
export function extractEsportsLeagueFromTitle(title: string): string | undefined {
  const dashIndex = title.lastIndexOf(" - ");

  if (dashIndex >= 0) {
    const league = title.slice(dashIndex + 3).trim();
    return league || undefined;
  }

  return undefined;
}
