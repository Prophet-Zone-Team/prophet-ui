import type { ProphetNotificationData } from "@/types/prophet-notification-ws";

const MOCK_EVENT_SLUG = "world-cup-final-mock";
const MOCK_EVENT_TITLE = "World Cup Final";

/**
 * One sample notification per `notice_type`, aligned with the Prophet WS doc.
 * Timestamps are offset from `baseTimestamp` so batch enqueue passes dedupe.
 */
export function buildProphetNotificationSamples(
  baseTimestamp = Math.floor(Date.now() / 1000),
): ProphetNotificationData[] {
  return [
    {
      source: "polymarket",
      notice_type: "price",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      market_id: "market-123",
      market_name: "Winner",
      outcome: "Argentina",
      title: "Polymarket price alert: World Cup Final",
      body: "Price moved from 0.42 to 0.58.",
      timestamp: baseTimestamp,
      payload: {
        token_id: "token-123",
        baseline: "0.42",
        current: "0.58",
        change_abs: "0.16",
        threshold_abs: "0.10",
        window: "pre_match",
      },
    },
    {
      source: "polymarket",
      notice_type: "volume",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      title: "Polymarket volume alert: World Cup Final",
      body: "Volume increased from $120K to $250K.",
      timestamp: baseTimestamp + 1,
      payload: {
        previous_volume_usd: "120000",
        current_volume_usd: "250000",
        delta_usd: "130000",
        threshold_usd: "100000",
      },
    },
    {
      source: "polymarket",
      notice_type: "large_order",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      market_id: "market-123",
      market_name: "Winner",
      outcome: "Argentina",
      title: "Polymarket large order: World Cup Final",
      body: "Large BUY order detected.",
      timestamp: baseTimestamp + 2,
      payload: {
        token_id: "token-123",
        side: "BUY",
        price: "0.58",
        size: "10000",
        notional_usd: "5800",
        threshold_usd: "5000",
      },
    },
    {
      source: "polymarket",
      notice_type: "top_holders",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      title: "Polymarket top holders alert: World Cup Final",
      body: "Top holder positions changed.",
      timestamp: baseTimestamp + 3,
      payload: {
        alert_count: 2,
        threshold_shares: "10000",
        lines: [
          "0xabc increased YES by 12000 shares",
          "0xdef decreased NO by 15000 shares",
        ],
      },
    },
    {
      source: "polymarket",
      notice_type: "news",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      title: "Polymarket news: World Cup Final",
      body: "New related news detected.",
      timestamp: baseTimestamp + 4,
      payload: {
        article_id: 123,
        url: "https://example.com/news/123",
        source_name: "Example News",
        published_at: "2026-06-01T12:00:00Z",
        matched_teams: ["Argentina", "France"],
        matched_team: "Argentina",
        team_a: "Argentina",
        team_b: "France",
        category: "sports",
        score: 85,
        matched_players_json: "[]",
      },
    },
    {
      source: "polymarket",
      notice_type: "score",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      title: "Score Update: Argentina 2-1 France",
      body: "Argentina 2-1 France. Match status: live.",
      timestamp: baseTimestamp + 5,
      payload: {
        team_a_name: "Argentina",
        team_a_score: 2,
        team_b_name: "France",
        team_b_score: 1,
        match_status: "live",
        score_update: 123,
        score_source: "manual",
        score_pushed: null,
        attempt_count: 0,
      },
    },
  ];
}

/** Pre-built samples with fresh timestamps (use for one-off dev enqueue). */
export const prophetNotificationSamples = buildProphetNotificationSamples();
