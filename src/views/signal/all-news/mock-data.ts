import type { SignalAllNewsItem } from "./types";

export const signalAllNewsItems: SignalAllNewsItem[] = [
  {
    id: "mbappe-training",
    teamCode: "FRA",
    teamName: "France",
    sentiment: "positive",
    headline: "Mbappé returns to full training",
    summary: "Mbappé has rejoined full team sessions and is expected back soon.",
    publishedAtLabel: "Just Now",
    publishedAtOrder: 0,
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
    summary: "A training knock raises questions for the next knockout match.",
    publishedAtLabel: "2 hours ago",
    publishedAtOrder: 2,
    impactScore: -2.3,
    thumbnailAlt: "Vinicius Jr."
  },
  {
    id: "kane-form",
    teamCode: "ENG",
    teamName: "England",
    sentiment: "positive",
    headline: "Kane's form is improving",
    summary: "3 goal involvements in 2 matches, finishing confidence rising.",
    publishedAtLabel: "2 hours ago",
    publishedAtOrder: 2,
    impactScore: 3.2,
    thumbnailAlt: "Harry Kane"
  },
  {
    id: "messi-fitness",
    teamCode: "ARG",
    teamName: "Argentina",
    sentiment: "positive",
    headline: "Messi completes full session without restrictions",
    summary: "Argentina staff report no load limits ahead of the quarterfinal.",
    publishedAtLabel: "5 hours ago",
    publishedAtOrder: 5,
    impactScore: 4.8,
    thumbnailAlt: "Lionel Messi"
  },
  {
    id: "yamal-fitness",
    teamCode: "ESP",
    teamName: "Spain",
    sentiment: "negative",
    headline: "Yamal misses portion of tactical rehearsal",
    summary: "Spain monitor a light muscle complaint before the next fixture.",
    publishedAtLabel: "8 hours ago",
    publishedAtOrder: 8,
    impactScore: -1.6,
    thumbnailAlt: "Lamine Yamal"
  },
  {
    id: "kimmich-suspension",
    teamCode: "GER",
    teamName: "Germany",
    sentiment: "negative",
    headline: "Kimmich accumulation risk flagged",
    summary: "Germany may rotate midfield if the yellow-card threshold is reached.",
    publishedAtLabel: "1 day ago",
    publishedAtOrder: 24,
    impactScore: -3.4,
    thumbnailAlt: "Joshua Kimmich"
  }
];
