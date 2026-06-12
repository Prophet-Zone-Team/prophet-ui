"use client";

import { useTranslations } from "next-intl";

import type { MarketDataMeta } from "@/data/providers/types";
import { getMarketDataSourceLabel } from "@/data/providers/source";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import type { TeamMarketSnapshot } from "@/types/market";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamMiniGridClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";
import { TeamPanelMetric } from "./team-panel-metric";
import { formatChange, formatProbability, formatShortDate } from "@/lib/team/team-detail-model";
import { formatVolume } from "@/components/home/market-formatters";
import type { TeamMarketIntelligenceData } from "@/lib/analytics/map-team-market-news";

export interface TeamMarketIntelligencePanelProps {
  snapshot: TeamMarketSnapshot;
  dataStatus: MarketDataMeta;
  intelligence: TeamMarketIntelligenceData;
  isEmpty?: boolean;
  relatedNewsCount: number;
  movementNarrative: string;
}

export function TeamMarketIntelligencePanel({
  snapshot,
  dataStatus,
  intelligence,
  isEmpty = false,
  relatedNewsCount,
  movementNarrative
}: TeamMarketIntelligencePanelProps) {
  const t = useTranslations("teamDetail");
  const teamDisplayName = useLocalizedTeamName(
    snapshot.team.code,
    snapshot.team.name
  );

  return (
    <section
      className={teamPanelClass}
      aria-label={t("marketIntelligenceAria")}
    >
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("marketIntelligence")}</h2>
      </div>
      <div className="p-4">
        {isEmpty ? (
          <TeamEmptyState
            title={t("marketIntelligencePending")}
            body={t("marketIntelligencePendingBody", {
              teamName: teamDisplayName,
              source: getMarketDataSourceLabel(dataStatus.source)
            })}
          />
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <div className={teamMiniGridClass}>
              <TeamPanelMetric
                label={t("winnerProbability")}
                value={formatProbability(intelligence.probability)}
              />
              <TeamPanelMetric
                label={t("change24h")}
                value={formatChange(intelligence.change24h)}
                tone={intelligence.change24h < 0 ? "down" : "up"}
              />
              <TeamPanelMetric
                label={t("change7d")}
                value={formatChange(intelligence.change7d)}
                tone={intelligence.change7d < 0 ? "down" : "up"}
              />
              <TeamPanelMetric
                label={t("marketVolume")}
                value={formatVolume(intelligence.volume)}
              />
              <TeamPanelMetric
                label={t("liquidity")}
                value={
                  intelligence.liquidity
                    ? formatVolume(intelligence.liquidity)
                    : t("pending")
                }
              />
              <TeamPanelMetric
                label={t("newsSignals")}
                value={String(relatedNewsCount)}
              />
              <TeamPanelMetric
                label={t("updated")}
                value={formatShortDate(
                  intelligence.updatedAt ?? dataStatus.lastUpdated
                )}
              />
            </div>

            <div className="rounded-lg border border-prophet-line bg-[#fafbfc] px-3 py-2.5">
              <span className="text-[10px] font-[500] uppercase tracking-wide text-prophet-muted">
                {t("whyItMoved")}
              </span>
              <p className="m-0 mt-1 text-xs leading-relaxed text-black">
                {movementNarrative}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
