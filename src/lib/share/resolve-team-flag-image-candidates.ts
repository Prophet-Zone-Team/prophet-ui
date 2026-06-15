import teams from "@/data/teams";
import {
  findCuratedTeamByCode,
  findCuratedTeamById,
} from "@/data/teams/curated-team-list";
import type { ResolvedMatchTeam } from "@/lib/market/schedule-match";
import type { Team } from "@/types/market";

const POLYMARKET_FLAG_BASE =
  "https://polymarket-upload.s3.us-east-2.amazonaws.com/country-flags";

function isHttpUrl(value?: string): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function appendCandidate(candidates: string[], value?: string): void {
  if (isHttpUrl(value)) {
    candidates.push(value);
  }
}

export function resolveTeamFlagImageCandidates(
  side: ResolvedMatchTeam,
  teamId?: Team["id"],
): string[] {
  const candidates: string[] = [];

  appendCandidate(candidates, side.logoUrl);

  if (teamId) {
    appendCandidate(candidates, findCuratedTeamById(teamId)?.logoUrl);
  }

  if (side.code) {
    appendCandidate(candidates, findCuratedTeamByCode(side.code)?.logoUrl);
  }

  const teamEntry = teams[side.name as keyof typeof teams];
  const iso2 = teamEntry?.logo?.trim().toLowerCase();
  const abbrev = teamEntry?.abbreviation?.trim().toLowerCase();
  const code = side.code?.trim().toLowerCase();

  if (abbrev) {
    candidates.push(`${POLYMARKET_FLAG_BASE}/${abbrev}.png`);
  }

  if (iso2) {
    candidates.push(`${POLYMARKET_FLAG_BASE}/${iso2}.png`);
    candidates.push(`https://flagcdn.com/w640/${iso2}.png`);
    candidates.push(`https://flagcdn.com/w320/${iso2}.png`);
  }

  if (code && code !== abbrev && code !== iso2) {
    candidates.push(`${POLYMARKET_FLAG_BASE}/${code}.png`);
  }

  return [...new Set(candidates)];
}
