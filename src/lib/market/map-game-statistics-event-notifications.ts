import {
  EventNotificationLevel,
  type ShowEventNotificationOptions,
} from "@/components/notification/event";
import { resolveTeamCode } from "@/lib/analytics/map-team-power-ranking";
import {
  resolveGoalElapsedSeconds,
  resolveTeamSide,
} from "@/lib/market/map-game-statistics";
import type {
  ProphetGameStatisticsEvent,
  ProphetGameStatisticsPayload,
} from "@/types/prophet-api";

export type GameStatisticsEventNotification = {
  dedupeKey: string;
  options: ShowEventNotificationOptions;
};

function resolveNotificationLevel(
  event: ProphetGameStatisticsEvent,
): EventNotificationLevel | undefined {
  if (event.type === "Goal") {
    return EventNotificationLevel.Goal;
  }

  if (event.type !== "Card") {
    return undefined;
  }

  if (event.detail === "Yellow Card") {
    return EventNotificationLevel.FoulWarn;
  }

  if (event.detail === "Red Card") {
    return EventNotificationLevel.FoulAlert;
  }

  return undefined;
}

export function buildGameStatisticsEventDedupeKey(
  event: ProphetGameStatisticsEvent,
  slug: string,
): string {
  const extra = event.time.extra ?? 0;

  return `${slug}:${event.time.elapsed}:${extra}:${event.team.id}:${event.type}:${event.detail}`;
}

function sortEventsByElapsed(
  events: ProphetGameStatisticsEvent[],
): ProphetGameStatisticsEvent[] {
  return [...events].sort((left, right) => {
    const leftElapsed = resolveGoalElapsedSeconds(
      left.time.elapsed,
      left.time.extra,
    );
    const rightElapsed = resolveGoalElapsedSeconds(
      right.time.elapsed,
      right.time.extra,
    );

    return leftElapsed - rightElapsed;
  });
}

function buildTeamNotificationEntry(params: {
  code: string;
  name: string;
  score: number;
  eventMarker?: "goal" | "foul";
}) {
  return {
    code: params.code,
    name: params.name,
    score: String(params.score),
    ...(params.eventMarker ? { event: params.eventMarker } : {}),
  };
}

export function mapGameStatisticsEventNotifications(
  payload: ProphetGameStatisticsPayload | undefined,
  homeTeamName: string,
  awayTeamName: string,
  slug = "",
  options?: {
    homeApiTeamId?: number;
    awayApiTeamId?: number;
  },
): GameStatisticsEventNotification[] {
  if (!payload?.events?.length) {
    return [];
  }

  const homeCode = resolveTeamCode(homeTeamName);
  const awayCode = resolveTeamCode(awayTeamName);
  const notifications: GameStatisticsEventNotification[] = [];
  let homeScore = 0;
  let awayScore = 0;

  for (const event of sortEventsByElapsed(payload.events)) {
    const level = resolveNotificationLevel(event);

    if (!level) {
      continue;
    }

    const side = resolveTeamSide(event.team.name, homeTeamName, awayTeamName, {
      teamId: event.team.id,
      homeApiTeamId: options?.homeApiTeamId,
      awayApiTeamId: options?.awayApiTeamId,
    });

    if (!side) {
      continue;
    }

    if (level === EventNotificationLevel.Goal) {
      if (side === "home") {
        homeScore += 1;
      } else {
        awayScore += 1;
      }
    }

    notifications.push({
      dedupeKey: buildGameStatisticsEventDedupeKey(event, slug),
      options: {
        level,
        teams: [
          buildTeamNotificationEntry({
            code: homeCode,
            name: homeTeamName,
            score: homeScore,
            eventMarker:
              level === EventNotificationLevel.Goal && side === "home"
                ? "goal"
                : level !== EventNotificationLevel.Goal && side === "home"
                  ? "foul"
                  : undefined,
          }),
          buildTeamNotificationEntry({
            code: awayCode,
            name: awayTeamName,
            score: awayScore,
            eventMarker:
              level === EventNotificationLevel.Goal && side === "away"
                ? "goal"
                : level !== EventNotificationLevel.Goal && side === "away"
                  ? "foul"
                  : undefined,
          }),
        ],
      },
    });
  }

  return notifications;
}
