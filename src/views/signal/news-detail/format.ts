import type { NewsImpactItem } from "@/views/analytics/news/types";

import { signalNewsDetailsById } from "./mock-data";
import type { SignalNewsDetail, SignalNewsDetailBodyBlock } from "./types";

export function getSignalNewsDetail(
  id: string,
  listItem?: NewsImpactItem
): SignalNewsDetail | null {
  const detail = signalNewsDetailsById[id];

  if (detail) {
    return detail;
  }

  if (!listItem) {
    return null;
  }

  return buildFallbackDetail(listItem);
}

function buildFallbackDetail(item: NewsImpactItem): SignalNewsDetail {
  const relatedParts = [item.teamName, item.thumbnailAlt.split(" ")[0]].filter(
    Boolean
  );

  return {
    id: item.id,
    title: item.headline,
    updatedAtLabel: item.publishedAtLabel,
    imageUrl: item.thumbnailUrl ?? "",
    imageAlt: item.thumbnailAlt,
    sentiment: item.sentiment,
    impactScore: item.impactScore,
    relatedLabel: relatedParts.join(", "),
    categoryLabel: "General",
    body: [
      {
        kind: "paragraph",
        segments: [{ kind: "text", value: item.summary }]
      }
    ] satisfies SignalNewsDetailBodyBlock[]
  };
}
