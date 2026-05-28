import type { ProphetAnalyticsCompetitiveness } from "@/types/prophet-api";
import type {
  GroupCompetitivenessData,
  GroupCompetitivenessEntry,
  GroupCompetitivenessSectionData,
  GroupCompetitivenessVariant
} from "@/views/analytics/group-competitiveness/types";

import { COMPETITIVENESS_SECTION_META } from "./config";

export function extractGroupId(groupName: string | undefined): string {
  if (!groupName) {
    return "";
  }

  const match = groupName.match(/([A-Za-z])\s*$/);
  return match?.[1]?.toUpperCase() ?? groupName;
}

function mapEntries(
  items: ProphetAnalyticsCompetitiveness[],
  variant: GroupCompetitivenessVariant
): GroupCompetitivenessEntry[] {
  return items
    .filter((item) => item.category === variant)
    .map((item) => ({
      groupId: extractGroupId(item.group_name),
      score: item.score ?? 0
    }))
    .filter((entry) => entry.groupId.length > 0)
    .sort((left, right) => right.score - left.score);
}

function buildSection(
  variant: GroupCompetitivenessVariant,
  entries: GroupCompetitivenessEntry[]
): GroupCompetitivenessSectionData {
  const meta = COMPETITIVENESS_SECTION_META[variant];

  return {
    variant,
    label: meta.label,
    description: meta.description,
    entries
  };
}

export function mapCompetitivenessResponse(
  items: ProphetAnalyticsCompetitiveness[] | undefined
): GroupCompetitivenessData {
  const list = items ?? [];

  return {
    deathSection: buildSection("death", mapEntries(list, "death")),
    easiestSection: buildSection("easiest", mapEntries(list, "easiest"))
  };
}
