"use client";

import { useTranslations } from "next-intl";

import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { useGroupMatches } from "@/hooks/market/use-group-matches";
import { cn } from "@/lib/cn";
import type { TeamMarketSnapshot } from "@/types/market";
import { RelatedGameCard } from "@/views/trade/related-games/card";
import {
  tradePanelClass,
  tradeSectionClass,
  tradePanelTitleClass
} from "@/views/trade/trade-widget/trade-ui";

export interface GroupMatchesPanelProps {
  group: WorldCup2026Group;
  snapshots: TeamMarketSnapshot[];
  highlightTeamId: string;
}

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#ebebeb]/80 ${className ?? "h-4 w-full"}`}
      aria-hidden
    />
  );
}

function GroupMatchesLoading() {
  return (
    <div className="flex flex-col gap-3 px-3" aria-hidden>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border border-[#EBEBEB] bg-white p-3"
        >
          <LoadingBlock className="mb-2 h-4 w-24" />
          <LoadingBlock className="h-14 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function GroupMatchesPanel({
  group,
  snapshots,
  highlightTeamId
}: GroupMatchesPanelProps) {
  const t = useTranslations("trade");
  const { matches, isLoading, isError } = useGroupMatches({ groupCode: group });

  return (
    <section
      className={cn(tradePanelClass, tradeSectionClass)}
      aria-label={t("groupMatchesAria")}
    >
      <h2 className={`${tradePanelTitleClass} px-4 py-3`}>{t("groupMatches")}</h2>

      {isLoading ? (
        <GroupMatchesLoading />
      ) : isError ? (
        <p className="px-4 py-8 text-center text-sm text-prophet-muted">
          {t("groupMatchesUnavailable")}
        </p>
      ) : matches.length > 0 ? (
        <div className="flex flex-col gap-3 px-3 pb-3">
          {matches.map((match) => (
            <RelatedGameCard
              key={match.id}
              match={match}
              snapshots={snapshots}
              highlightTeamId={highlightTeamId}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-prophet-muted">
          {t("noGroupMatches")}
        </p>
      )}
    </section>
  );
}
