"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useProbabilityChart } from "@/hooks/market/use-probability-chart";
import { resolveTeamOrderbookTokenId } from "@/lib/market/resolve-team-orderbook-token";
import type { TeamMarketSnapshot } from "@/types/market";
import { WinnerProbabilityChart } from "@/views/home/winner/probability-chart";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamProbabilityPanelProps {
  snapshot: TeamMarketSnapshot;
}

export function TeamProbabilityPanel({ snapshot }: TeamProbabilityPanelProps) {
  const t = useTranslations("teamDetail");
  const tCommon = useTranslations("common");
  const yesTokenId = resolveTeamOrderbookTokenId(snapshot, "yes");
  const { points, status } = useProbabilityChart({
    kind: "team",
    tokenId: yesTokenId,
    entityId: snapshot.team.id,
    pollIntervalMs: 5000,
    enabled: Boolean(yesTokenId)
  });

  const probabilityHistory = useMemo(
    () => (status === "ready" ? points : []),
    [points, status]
  );

  const teams = useMemo(() => [snapshot], [snapshot]);

  return (
    <section
      className={teamPanelClass}
      aria-label={t("winnerProbabilityAria")}
    >
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>
          {t("winnerProbabilityOverTime")}
        </h2>
      </div>
      <div className="p-4 pt-0">
        {!yesTokenId ? (
          <TeamEmptyState
            title={t("probabilityHistoryPending")}
            body={t("probabilityHistoryPendingBody")}
          />
        ) : status === "loading" ? (
          <p className="py-8 text-center text-sm text-prophet-muted">
            {tCommon("loading")}
          </p>
        ) : status === "error" ? (
          <TeamEmptyState
            title={t("unableToLoadProbabilityHistory")}
            body={t("probabilityHistoryLoadError")}
          />
        ) : (
          <WinnerProbabilityChart
            className="border-0 px-0 pb-0 pt-3 shadow-none"
            teams={teams}
            probabilityHistory={probabilityHistory}
            hideTitle
            topTeamCount={1}
            showAxisTooltip
          />
        )}
      </div>
    </section>
  );
}
