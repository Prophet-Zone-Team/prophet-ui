import type { NewsSentiment } from "@/views/analytics/news/types";

export type SignalNewsDetailTextSegment =
  | { kind: "text"; value: string }
  | { kind: "link"; value: string; href: string };

export type SignalNewsDetailBodyBlock =
  | { kind: "paragraph"; segments: SignalNewsDetailTextSegment[] }
  | { kind: "subheading"; text: string };

export type SignalNewsDetail = {
  id: string;
  title: string;
  updatedAtLabel: string;
  imageUrl: string;
  imageAlt: string;
  sentiment: NewsSentiment;
  impactScore: number;
  relatedLabel: string;
  categoryLabel: string;
  body: SignalNewsDetailBodyBlock[];
};
