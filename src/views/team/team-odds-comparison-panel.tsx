"use client";

import { useTranslations } from "next-intl";

import type { MarketDataMeta } from "@/data/providers/types";
import type { NormalizedBookmakerOdds } from "@/data/odds/types";
import {
  formatChange,
  formatProbability
} from "@/components/home/market-formatters";
import type {
  ApiFootballOddContext,
  TeamMarketSnapshot
} from "@/types/market";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import { TeamPanelMetric } from "@/views/team/team-panel-metric";
import {
  teamMiniGridClass,
  teamPanelBadgeClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamOddsComparisonPanelProps {
  snapshot: TeamMarketSnapshot;
  fixtureOdds: ApiFootballOddContext[];
  outrightOdds: NormalizedBookmakerOdds[];
  dataStatus: MarketDataMeta;
}

export function TeamOddsComparisonPanel({
  snapshot,
  fixtureOdds,
  outrightOdds,
  dataStatus
}: TeamOddsComparisonPanelProps) {
  const t = useTranslations("teamDetail");
  const visibleFixtureOdds = fixtureOdds.slice(0, 6);
  const visibleOutrightOdds = outrightOdds.slice(0, 5);
  const spread =
    snapshot.market.probability - snapshot.market.bookmakerImpliedProbability;
  const impliedValues = outrightOdds
    .map((item) => item.impliedProbability)
    .sort((a, b) => a - b);
  const min = impliedValues[0];
  const max = impliedValues.at(-1);

  return (
    <section className={teamPanelClass} aria-label={t("oddsComparisonAria")}>
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("oddsComparison")}</h2>
        <span className={teamPanelBadgeClass}>
          {dataStatus.odds?.source === "the-odds-api"
            ? t("theOddsApi")
            : t("oddsPending")}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className={teamMiniGridClass}>
          <TeamPanelMetric
            label={t("outrightOddsImplied")}
            value={formatProbability(
              snapshot.market.bookmakerImpliedProbability
            )}
          />
          <TeamPanelMetric
            label={t("marketProbability")}
            value={formatProbability(snapshot.market.probability)}
          />
          <TeamPanelMetric
            label={t("difference")}
            value={formatChange(spread)}
            tone={spread < 0 ? "down" : spread > 0 ? "up" : undefined}
          />
          <TeamPanelMetric
            label={t("bookmakerSpread")}
            value={
              min !== undefined && max !== undefined
                ? `${formatProbability(min)} - ${formatProbability(max)}`
                : t("unavailable")
            }
          />
        </div>

        <div className="grid gap-1.5">
          {visibleOutrightOdds.length > 0 ? (
            visibleOutrightOdds.map((item) => (
              <div
                key={`${item.bookmaker}-${item.teamId}-${item.decimalOdds}`}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-2 rounded-md border border-prophet-line px-3 py-2 text-xs"
              >
                <span className="text-prophet-muted">{item.bookmaker}</span>
                <strong className="font-[500] text-prophet-foreground">
                  {t("winnerOutright")}
                </strong>
                <b className="font-[500] text-prophet-foreground">
                  {formatProbability(item.impliedProbability)}
                </b>
              </div>
            ))
          ) : visibleFixtureOdds.length > 0 ? (
            visibleFixtureOdds.map((item) => (
              <div
                key={`${item.fixtureId}-${item.bookmaker ?? "book"}-${item.marketName ?? "market"}-${item.selectionName ?? "selection"}`}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-2 rounded-md border border-prophet-line px-3 py-2 text-xs"
              >
                <span className="text-prophet-muted">
                  {item.bookmaker ?? t("bookmaker")}
                </span>
                <strong className="font-[500] text-prophet-foreground">
                  {item.selectionName ?? item.marketName ?? t("fixtureOdds")}
                </strong>
                <b className="font-[500] text-prophet-foreground">
                  {item.odd ?? t("pending")}
                </b>
              </div>
            ))
          ) : (
            <TeamEmptyState
              title={t("fixtureOddsPending")}
              body={t("fixtureOddsPendingBody")}
            />
          )}
        </div>

        <p className="m-0 text-[11px] leading-relaxed text-prophet-muted">
          {t("oddsComparisonFootnote")}
        </p>
      </div>
    </section>
  );
}
