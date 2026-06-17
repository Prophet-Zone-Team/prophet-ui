import type {
  KeyPlayerView,
  NextMatchView,
  RecentMatchView,
  StrengthMetric
} from "@/lib/team/team-detail-model";
import { formatShortDate } from "@/lib/team/team-detail-model";
import type {
  ProphetGetTeamDetailData,
  ProphetGetTeamDetailKeyStar,
  ProphetGetTeamDetailMatch,
  ProphetGetTeamDetailNextMatch,
  ProphetGetTeamDetailPeer
} from "@/types/prophet-api";
import { buildTeamDetailHref } from "../routes/team";

export interface TeamDetailGroupPeer {
  code: string;
  name: string;
  fifaRank: number;
  logo?: string;
  link?: string;
}

export interface TeamDetailHeaderData {
  name: string;
  logo?: string;
  bestFinish?: string;
  fifaRank?: number;
  groupName?: string;
  titles?: number;
  marketValue?: string;
}

export interface TeamDetailViewModel {
  header: TeamDetailHeaderData;
  formResults: string[];
  latestLabel?: string;
  recentMatches: RecentMatchView[];
  groupLabel?: string;
  groupPeers: TeamDetailGroupPeer[];
  keyStars: KeyPlayerView[];
  strengthMetrics: StrengthMetric[];
  strengthScore?: number;
  nextMatch?: NextMatchView;
  titles: number;
}

function normalizeTeamName(value: string): string {
  return value.trim().toLowerCase();
}

function resolveMatchResult(
  teamName: string,
  match: ProphetGetTeamDetailMatch
): "W" | "D" | "L" {
  const isHome =
    normalizeTeamName(match.home_team_name) === normalizeTeamName(teamName);
  const goalsFor = isHome ? match.home_goals : match.away_goals;
  const goalsAgainst = isHome ? match.away_goals : match.home_goals;

  if (goalsFor > goalsAgainst) {
    return "W";
  }

  if (goalsFor < goalsAgainst) {
    return "L";
  }

  return "D";
}

function resolveOpponentName(
  teamName: string,
  match: ProphetGetTeamDetailMatch
): string {
  const isHome =
    normalizeTeamName(match.home_team_name) === normalizeTeamName(teamName);

  return isHome ? match.away_team_name : match.home_team_name;
}

export function mapRecentMatches(
  teamName: string,
  matches: ProphetGetTeamDetailMatch[] | undefined
): RecentMatchView[] {
  return (matches ?? [])
    .slice()
    .sort((a, b) => b.fixture_timestamp - a.fixture_timestamp)
    .slice(0, 5)
    .map((match) => ({
      id: String(match.id),
      date: formatShortDate(match.fixture_date),
      opponent: resolveOpponentName(teamName, match),
      status: match.status_short ?? "FT",
      result: resolveMatchResult(teamName, match),
      score: `${match.home_goals}-${match.away_goals}`,
      note: match.league_name ?? "Match"
    }));
}

export function mapNextMatch(
  match: ProphetGetTeamDetailNextMatch | null | undefined
): NextMatchView | undefined {
  if (!match) {
    return undefined;
  }

  return {
    id: match.id,
    slug: match.slug?.trim() || undefined,
    apiFixtureId: match.api_fixture_id,
    referee: match.referee,
    timezone: match.timezone,
    fixtureDate: match.fixture_date,
    fixtureTimestamp: match.fixture_timestamp,
    statusLong: match.status_long,
    statusShort: match.status_short,
    statusElapsed: match.status_elapsed,
    leagueId: match.league_id,
    leagueName: match.league_name,
    leagueCountry: match.league_country,
    season: match.season,
    round: match.round,
    homeTeamId: match.home_team_id,
    homeTeamName: match.home_team_name,
    awayTeamId: match.away_team_id,
    awayTeamName: match.away_team_name,
    homeGoals: match.home_goals,
    awayGoals: match.away_goals,
    updatedAt: match.updated_at,
  };
}

export function mapKeyStars(
  stars: ProphetGetTeamDetailKeyStar[] | undefined
): KeyPlayerView[] {
  return (stars ?? []).map((star) => ({
    name: star.name,
    position: star.position,
    club: star.club_name,
    logo: star.logo || undefined,
    expectedMinutes: parseFloat(star.expected_minutes) || 0,
    squadProbability: parseFloat(star.squad_probability) || 0,
    formScore: parseFloat(star.form_score) || 0,
    injuryStatus: star.injury_status === 0 ? "Fit" : "Risk",
    topMarket: star.club_name
  }));
}

export function mapTeamStrength(data: ProphetGetTeamDetailData): {
  metrics: StrengthMetric[];
  score?: number;
} {
  const dimensions = data.team_strength?.dimensions ?? [];

  return {
    metrics: dimensions.map((dimension) => ({
      label: dimension.label,
      value: dimension.score
    })),
    score: data.team_strength?.score
  };
}

export function mapGroupPeers(
  peers: ProphetGetTeamDetailPeer[] | undefined,
  teamName: string
): TeamDetailGroupPeer[] {
  return (peers ?? []).map((peer) => {
    const teamLink = buildTeamDetailHref(peer.name);

    return {
      code: peer.code,
      name: peer.name,
      fifaRank: peer.fifaRank,
      logo: peer.logo || undefined,
      link: teamName === peer.name ? undefined : teamLink,
    };
  });
}

export function mapTeamDetailResponse(
  data: ProphetGetTeamDetailData
): TeamDetailViewModel {
  const { metrics, score } = mapTeamStrength(data);

  return {
    header: {
      name: data.name,
      logo: data.logo || undefined,
      bestFinish: data.best_finish || undefined,
      fifaRank: data.fifa_rank,
      groupName: data.group_name || undefined,
      titles: data.titles,
      marketValue: data.market_value,
    },
    formResults: data.recent_form?.result ?? [],
    latestLabel: data.recent_form?.latest || undefined,
    recentMatches: mapRecentMatches(data.name, data.recent_form?.matches),
    groupLabel: data.group_name || undefined,
    groupPeers: mapGroupPeers(data.team_peers, data.name),
    keyStars: mapKeyStars(data.team_key_stars),
    strengthMetrics: metrics,
    strengthScore: score,
    titles: data.titles,
    nextMatch: mapNextMatch(data.next_match),
  };
}
