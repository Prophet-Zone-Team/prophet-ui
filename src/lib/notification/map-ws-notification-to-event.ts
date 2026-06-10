import {
  EventNotificationLevel,
  type ShowEventNotificationOptions,
} from "@/components/notification/event";
import { resolveTeamCode } from "@/lib/analytics/map-team-power-ranking";
import type { ProphetNotificationData } from "@/types/prophet-notification-ws";

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

export function mapWsNotificationToEvent(
  data: ProphetNotificationData,
): ShowEventNotificationOptions | undefined {
  return mapScoreNotification(data);
}

export function buildNotificationDedupeKey(data: ProphetNotificationData): string {
  return `${data.notice_type}:${data.event_slug ?? ""}:${data.timestamp ?? ""}`;
}
