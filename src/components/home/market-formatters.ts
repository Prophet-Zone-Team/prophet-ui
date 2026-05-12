import type { MarketSentiment } from "../../types/market";

export function formatProbability(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
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
