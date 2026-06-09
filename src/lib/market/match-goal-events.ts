import type { GameMatchChartEvent } from "@/types/market";

export interface ApplyScoreChangeToGoalEventsInput {
  trackedHomeScore: number;
  trackedAwayScore: number;
  homeScore: number;
  awayScore: number;
  elapsedSeconds: number;
  existingEvents?: GameMatchChartEvent[];
}

export interface ApplyScoreChangeToGoalEventsResult {
  events: GameMatchChartEvent[];
  trackedHomeScore: number;
  trackedAwayScore: number;
  addedEvents: GameMatchChartEvent[];
}

export function applyScoreChangeToGoalEvents({
  trackedHomeScore,
  trackedAwayScore,
  homeScore,
  awayScore,
  elapsedSeconds,
  existingEvents = [],
}: ApplyScoreChangeToGoalEventsInput): ApplyScoreChangeToGoalEventsResult {
  const events = [...existingEvents];
  const addedEvents: GameMatchChartEvent[] = [];

  const homeDelta = Math.max(0, homeScore - trackedHomeScore);
  const awayDelta = Math.max(0, awayScore - trackedAwayScore);

  for (let index = 0; index < homeDelta; index += 1) {
    const event: GameMatchChartEvent = {
      elapsedSeconds,
      side: "home",
      type: "goal",
    };
    events.push(event);
    addedEvents.push(event);
  }

  for (let index = 0; index < awayDelta; index += 1) {
    const event: GameMatchChartEvent = {
      elapsedSeconds,
      side: "away",
      type: "goal",
    };
    events.push(event);
    addedEvents.push(event);
  }

  events.sort((left, right) => left.elapsedSeconds - right.elapsedSeconds);

  return {
    events,
    trackedHomeScore: homeScore,
    trackedAwayScore: awayScore,
    addedEvents,
  };
}
