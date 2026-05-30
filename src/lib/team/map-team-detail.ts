import { NEWS_HIGH_IMPACT_THRESHOLD } from "@/lib/analytics/config";
import { formatRelativeTime } from "@/lib/analytics/format-relative-time";
import {
  computeImpactScore,
  parseJsonArrayField
} from "@/lib/analytics/map-news";
import type {
  KeyPlayerView,
  NextMatchView,
  RecentMatchView,
  StrengthMetric
} from "@/lib/team/team-detail-model";
import { formatShortDate } from "@/lib/team/team-detail-model";
import type { Team } from "@/types/market";
import type { NewsImpactItem } from "@/views/analytics/news/types";
import type {
  ProphetGetTeamDetailData,
  ProphetGetTeamDetailKeyStar,
  ProphetGetTeamDetailMatch,
  ProphetGetTeamDetailNews,
  ProphetGetTeamDetailNextMatch,
  ProphetGetTeamDetailPeer
} from "@/types/prophet-api";
import { formatNumber } from "@/utils";

export interface TeamDetailGroupPeer {
  code: string;
  name: string;
  fifaRank: number;
  logo?: string;
}

export interface TeamDetailHeaderData {
  name: string;
  logo?: string;
  bestFinish?: string;
  fifaRank?: number;
  groupName?: string;
  titles?: number;
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
  newsItems: NewsImpactItem[];
  nextMatch: NextMatchView;
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
  match: ProphetGetTeamDetailNextMatch
): NextMatchView {
  return {
    id: match.id,
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
  peers: ProphetGetTeamDetailPeer[] | undefined
): TeamDetailGroupPeer[] {
  return (peers ?? []).map((peer) => ({
    code: peer.code,
    name: peer.name,
    fifaRank: peer.fifaRank,
    logo: peer.logo || undefined
  }));
}

function buildThumbnailAlt(matchedPlayers: string[], title: string): string {
  if (matchedPlayers[0]) {
    return matchedPlayers[0];
  }

  return title.split(/\s+/).slice(0, 2).join(" ") || "News";
}

export function mapTeamDetailNewsToImpactItems(
  teamName: string,
  teamCode: Team["code"],
  news: ProphetGetTeamDetailNews[] | undefined
): NewsImpactItem[] {
  return [...(news ?? [])]
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .map((article, index) => {
      const matchedTeams = parseJsonArrayField(article.matched_teams_json);
      const matchedPlayers = parseJsonArrayField(article.matched_players_json);
      const reasons = parseJsonArrayField(article.reasons_json);
      const apiScore = article.score ?? 0;
      const { impactScore, sentiment } = computeImpactScore(apiScore);

      return {
        id: String(article.id),
        teamCode,
        teamName,
        sentiment,
        headline: article.title,
        summary: article.description,
        publishedAtLabel: formatRelativeTime(article.published_at),
        impactScore,
        thumbnailUrl: article.url_to_image || undefined,
        thumbnailAlt: buildThumbnailAlt(matchedPlayers, article.title),
        highlighted:
          index === 0 || apiScore >= NEWS_HIGH_IMPACT_THRESHOLD,
        publishedAt: article.published_at,
        sourceUrl: article.url,
        category: article.category,
        matchedTeams,
        matchedPlayers,
        reasons
      };
    });
}

export function mapTeamDetailResponse(
  data: ProphetGetTeamDetailData,
  teamCode: Team["code"]
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
    },
    formResults: data.recent_form?.result ?? [],
    latestLabel: data.recent_form?.latest || undefined,
    recentMatches: mapRecentMatches(data.name, data.recent_form?.matches),
    groupLabel: data.group_name || undefined,
    groupPeers: mapGroupPeers(data.team_peers),
    keyStars: mapKeyStars(data.team_key_stars),
    strengthMetrics: metrics,
    strengthScore: score,
    newsItems: mapTeamDetailNewsToImpactItems(data.name, teamCode, data.news),
    titles: data.titles,
    nextMatch: mapNextMatch(data.next_match),
  };
}
