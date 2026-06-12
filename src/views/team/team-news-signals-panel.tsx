"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import type { TeamMarketSnapshot } from "@/types/market";
import { NewsList } from "@/views/analytics/news/news-list";
import type { NewsImpactItem } from "@/views/analytics/news/types";
import {
  buildSignalNewsDetailFromImpactItem,
  getSignalNewsDetail
} from "@/views/signal/news-detail/format";
import { SignalNewsDetailDrawer } from "@/views/signal/news-detail/drawer";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamNewsSignalsPanelProps {
  items: NewsImpactItem[];
  snapshot: TeamMarketSnapshot;
}

export function TeamNewsSignalsPanel({
  items,
  snapshot
}: TeamNewsSignalsPanelProps) {
  const t = useTranslations("teamDetail");
  const teamDisplayName = useLocalizedTeamName(
    snapshot.team.code,
    snapshot.team.name
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const selectedDetail = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    return (
      buildSignalNewsDetailFromImpactItem(selectedItem) ??
      getSignalNewsDetail(selectedItem.id, selectedItem)
    );
  }, [selectedItem]);

  const handleItemSelect = (item: NewsImpactItem) => {
    setSelectedItemId(item.id);
  };

  return (
    <>
      <section className={teamPanelClass} aria-label={t("newsSignalsAria")}>
        <div className={teamPanelHeadClass}>
          <h2 className={teamPanelTitleClass}>{t("newsToMarketSignals")}</h2>
        </div>
        <div className="p-4">
          {items.length > 0 ? (
            <NewsList items={items} onItemSelect={handleItemSelect} />
          ) : (
            <TeamEmptyState
              title={t("noRelatedNews")}
              body={t("noRelatedNewsBody", { teamName: teamDisplayName })}
            />
          )}
        </div>
      </section>

      <SignalNewsDetailDrawer
        open={selectedItemId !== null}
        detail={selectedDetail}
        onClose={() => setSelectedItemId(null)}
      />
    </>
  );
}
