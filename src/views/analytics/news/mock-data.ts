import type { SignalNewsImpactData } from "./types";

export const signalNewsImpactData: SignalNewsImpactData = {
  summary: {
    todaySignal: 12,
    positive: 7,
    negative: 3,
  },
  items: [
    {
      id: "mbappe-training",
      teamCode: "FRA",
      teamName: "France",
      sentiment: "positive",
      headline: "Mbappé returns to full training",
      summary:
        "Mbappé has rejoined full team sessions and is expected back soon.",
      publishedAtLabel: "Just Now",
      impactScore: 7.2,
      thumbnailAlt: "Kylian Mbappé",
      highlighted: true
    },
    {
      id: "vinicius-ankle",
      teamCode: "BRA",
      teamName: "Brazil",
      sentiment: "negative",
      headline: "Vinicius suffers minor ankle issue",
      summary:
        "A training knock raises questions for the next knockout match.",
      publishedAtLabel: "2 hours ago",
      impactScore: -2.3,
      thumbnailAlt: "Vinicius Jr."
    },
    {
      id: "kane-form",
      teamCode: "ENG",
      teamName: "England",
      sentiment: "positive",
      headline: "Kane's form is improving",
      summary:
        "3 goal involvements in 2 matches, finishing confidence rising.",
      publishedAtLabel: "2 hours ago",
      impactScore: 3.2,
      thumbnailAlt: "Harry Kane"
    }
  ]
};
