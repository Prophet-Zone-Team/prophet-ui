import { formatTime, formatTimeFromIso } from "@/lib/formatters/datetime";

export function formatMatchScore(
  homeScore?: number,
  awayScore?: number
): string {
  if (homeScore === undefined || awayScore === undefined) {
    return "—";
  }

  return `${homeScore}-${awayScore}`;
}

export function formatTeamWinLossRecord(
  wins?: number,
  losses?: number
): string {
  if (wins === undefined && losses === undefined) {
    return "—";
  }

  return `${wins ?? 0}-${losses ?? 0}`;
}

export function formatElapsedDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

export function formatLiveClockLabel(totalSeconds: number): string {
  return `Lasts ${formatElapsedDuration(totalSeconds)}`;
}

export function formatGoalEventTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");

  return `${minutes}'${paddedSeconds}''`;
}

export function formatMatchMinuteAxisLabel(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);

  if (minutes === 45) {
    return "Half";
  }

  return `${minutes}'`;
}

export function formatChartTimestampClockLabel(timestamp: string): string {
  return formatTimeFromIso(timestamp);
}

export function formatLiveChartClockLabel(
  kickoffAt: string | undefined,
  elapsedSeconds: number,
): string {
  if (!kickoffAt) {
    return "—";
  }

  const kickoffMs = Date.parse(kickoffAt);

  if (Number.isNaN(kickoffMs)) {
    return "—";
  }

  return formatTime(
    new Date(kickoffMs + Math.max(0, Math.floor(elapsedSeconds)) * 1000),
  );
}
