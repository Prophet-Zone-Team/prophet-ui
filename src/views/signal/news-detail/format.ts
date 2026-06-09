import type { NewsImpactItem } from "@/views/analytics/news/types";

import { signalNewsDetailsById } from "./mock-data";
import type { SignalNewsDetail, SignalNewsDetailBodyBlock } from "./types";

export function buildSignalNewsDetailFromImpactItem(
  item: NewsImpactItem
): SignalNewsDetail {
  const relatedParts = [
    ...(item.matchedTeams ?? []),
    ...(item.matchedPlayers ?? []),
    item.teamName
  ].filter(Boolean);

  const uniqueRelated = [...new Set(relatedParts)];

  const body: SignalNewsDetailBodyBlock[] = [
    {
      kind: "paragraph",
      segments: [{ kind: "text", value: item.summary }]
    }
  ];

  if (item.sourceUrl) {
    body.push({
      kind: "paragraph",
      segments: [
        { kind: "text", value: "Read original source: " },
        { kind: "link", value: "Source", href: item.sourceUrl }
      ]
    });
  }

  return {
    id: item.id,
    title: item.headline,
    updatedAtLabel: item.publishedAtLabel,
    imageUrl: item.thumbnailUrl ?? "",
    imageAlt: item.thumbnailAlt,
    sentiment: item.sentiment,
    impactScore: item.impactScore,
    relatedLabel:
      uniqueRelated.length > 1 ? "World Cup" : uniqueRelated[0],
    categoryLabel: item.category
      ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
      : "General",
    body
  };
}

export function getSignalNewsDetail(
  id: string,
  listItem?: NewsImpactItem
): SignalNewsDetail | null {
  if (listItem) {
    return buildSignalNewsDetailFromImpactItem(listItem);
  }

  const detail = signalNewsDetailsById[id];

  if (detail) {
    return detail;
  }

  return null;
}
