import {
  EventNotificationLevel,
  type ShowEventNotificationOptions,
} from "@/components/notification/event";
import { resolveTeamCode } from "@/lib/analytics/map-team-power-ranking";
import type { ProphetNotificationData } from "@/types/prophet-notification-ws";

function readDisplayText(data: ProphetNotificationData): string {
  return data.title?.trim() || data.body?.trim() || data.event_title?.trim() || "";
}

function resolveMarketTeamName(data: ProphetNotificationData): string {
  if (data.notice_type === "news") {
    const payload = data.payload;
    return (
      payload.matched_team?.trim() ||
      payload.team_a?.trim() ||
      data.event_title?.trim() ||
      "News"
    );
  }

  return (
    data.outcome?.trim() ||
    data.market_name?.trim() ||
    data.event_title?.trim() ||
    "Market"
  );
}

function resolveMarketTeamCode(data: ProphetNotificationData): string {
  const name = resolveMarketTeamName(data);
  return resolveTeamCode(name);
}

function mapMarketNoticeLevel(
  data: ProphetNotificationData,
): EventNotificationLevel | undefined {
  switch (data.notice_type) {
    case "price":
      return EventNotificationLevel.Price;
    case "volume":
      return EventNotificationLevel.Volume;
    case "large_order":
      return EventNotificationLevel.LargeOrder;
    case "top_holders":
      return EventNotificationLevel.TopHolders;
    case "news":
      return EventNotificationLevel.News;
    default:
      return undefined;
  }
}

function mapScoreNotification(
  data: ProphetNotificationData,
): ShowEventNotificationOptions | undefined {
  if (data.notice_type !== "score") {
    return undefined;
  }

  const payload = data.payload;
  const teamAName = payload.team_a_name?.trim();
  const teamBName = payload.team_b_name?.trim();

  if (!teamAName || !teamBName) {
    return undefined;
  }

  const teamAScore =
    typeof payload.team_a_score === "number"
      ? String(payload.team_a_score)
      : "0";
  const teamBScore =
    typeof payload.team_b_score === "number"
      ? String(payload.team_b_score)
      : "0";

  return {
    level: EventNotificationLevel.Goal,
    teams: [
      {
        code: resolveTeamCode(teamAName),
        name: teamAName,
        score: teamAScore,
        event: "goal",
      },
      {
        code: resolveTeamCode(teamBName),
        name: teamBName,
        score: teamBScore,
      },
    ],
  };
}

function mapSingleCardNotification(
  data: ProphetNotificationData,
): ShowEventNotificationOptions | undefined {
  const level = mapMarketNoticeLevel(data);

  if (!level) {
    return undefined;
  }

  const displayText = readDisplayText(data);

  if (!displayText) {
    return undefined;
  }

  const name = resolveMarketTeamName(data);

  return {
    level,
    teams: [
      {
        code: resolveMarketTeamCode(data),
        name,
        event: displayText,
      },
    ],
  };
}

export function mapWsNotificationToEvent(
  data: ProphetNotificationData,
): ShowEventNotificationOptions | undefined {
  if (data.notice_type === "score") {
    return mapScoreNotification(data);
  }

  return mapSingleCardNotification(data);
}

export function buildNotificationDedupeKey(data: ProphetNotificationData): string {
  return `${data.notice_type}:${data.event_slug ?? ""}:${data.timestamp ?? ""}`;
}
