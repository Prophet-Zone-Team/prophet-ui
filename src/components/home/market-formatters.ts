import type { MarketSentiment } from "@/types/market";

export function formatProbability(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatListProbability(value: number): string {
  if (value > 0 && value < 1) {
    return "<1%";
  }

  return formatProbability(value);
}

export function formatChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}

export function formatChangePercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatChangePercentMagnitude(
  value: number,
  decimals = 0
): string {
  return `${Math.abs(value).toFixed(decimals)}%`;
}

export function formatRelativeChange(currentProbability: number, changePoints: number): string {
  return formatProbabilityChangePercent(getRelativeChangePercent(currentProbability, changePoints));
}

export function getRelativeChangePercent(currentProbability: number, changePoints: number): number {
  const previousProbability = currentProbability - changePoints;

  if (previousProbability <= 0 || !Number.isFinite(previousProbability)) {
    return changePoints;
  }

  return (changePoints / previousProbability) * 100;
}

export function formatVolume(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getChangeTone(value: number): string {
  if (value > 0) {
    return "text-terminal-green";
  }

  if (value < 0) {
    return "text-terminal-red";
  }

  return "text-terminal-muted";
}

export function getSentimentLabel(sentiment: MarketSentiment): string {
  switch (sentiment) {
    case "bullish":
      return "Bullish";
    case "bearish":
      return "Bearish";
    case "neutral":
      return "Neutral";
    case "volatile":
      return "Volatile";
  }
}

function formatProbabilityChangePercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
