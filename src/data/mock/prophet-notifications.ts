import type { ProphetNotificationData } from "@/types/prophet-notification-ws";

const MOCK_EVENT_SLUG = "world-cup-winner";
const MOCK_EVENT_TITLE = "World Cup Winner";

/**
 * One sample notification per WS toast `notice_type`, aligned with the Prophet WS doc.
 * Timestamps are offset from `baseTimestamp` so batch enqueue passes dedupe.
 */
export function buildProphetNotificationSamples(
  baseTimestamp = Math.floor(Date.now() / 1000),
): ProphetNotificationData[] {
  return [
    {
      source: "polymarket",
      notice_type: "match_preview",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      title: "Match Preview · World Cup Winner",
      body: "Kickoff: 17:00 UTC",
      timestamp: baseTimestamp,
      payload: {
        team_a: "Brazil",
        team_b: "Argentina",
        match_start: "2026-06-11T17:00:00Z",
        match_end: "2026-06-11T20:00:00Z",
        markets: [
          {
            market_id: "sample-market-brazil",
            market_name: "Brazil",
            odds: [
              { outcome: "Yes", price: "0.45" },
              { outcome: "No", price: "0.55" },
            ],
          },
          {
            market_id: "sample-market-draw",
            market_name: "Draw",
            odds: [
              { outcome: "Yes", price: "0.25" },
              { outcome: "No", price: "0.75" },
            ],
          },
          {
            market_id: "sample-market-argentina",
            market_name: "Argentina",
            odds: [
              { outcome: "Yes", price: "0.30" },
              { outcome: "No", price: "0.70" },
            ],
          },
        ],
      },
    },
    {
      source: "polymarket",
      notice_type: "price",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      market_id: "sample-market-argentina",
      market_name: "Argentina",
      outcome: "YES",
      title: "Price · Argentina",
      body: "YES 42% → 58% (+16pp)",
      timestamp: baseTimestamp + 1,
      payload: {
        baseline: "0.42",
        baseline_display: "42%",
        change_abs: "0.16",
        change_abs_display: "+16pp",
        change_pct: "38.10",
        current: "0.58",
        current_display: "58%",
        threshold_abs: "0.10",
        threshold_abs_display: "10%",
        token_id: "sample-token-arg-yes",
        window: "in_match",
      },
    },
    {
      source: "polymarket",
      notice_type: "volume",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      title: "Volume · World Cup Winner",
      body: "+130K (120K → 250K)",
      timestamp: baseTimestamp + 2,
      payload: {
        change_pct: "108.33",
        current_volume_usd: "250000",
        current_volume_usd_display: "250K",
        delta_usd: "130000",
        delta_usd_display: "130K",
        previous_volume_usd: "120000",
        previous_volume_usd_display: "120K",
        threshold_usd: "100000",
        threshold_usd_display: "100K",
      },
    },
    {
      source: "polymarket",
      notice_type: "large_order",
      event_slug: MOCK_EVENT_SLUG,
      event_title: MOCK_EVENT_TITLE,
      market_id: "sample-market-brazil",
      market_name: "Brazil",
      outcome: "YES",
      title: "Large Order · Brazil",
      body: "YES · BUY 5.8K @ 0.58",
      timestamp: baseTimestamp + 3,
      payload: {
        notional_usd: "5800",
        notional_usd_display: "5.8K",
        price: "0.58",
        side: "BUY",
        size: "10000",
        threshold_usd: "5000",
        threshold_usd_display: "5K",
        token_id: "sample-token-bra-yes",
      },
    },
  ];
}

/** Pre-built samples with fresh timestamps (use for one-off dev enqueue). */
export const prophetNotificationSamples = buildProphetNotificationSamples();
