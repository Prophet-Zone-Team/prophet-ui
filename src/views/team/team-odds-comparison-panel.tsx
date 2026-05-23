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
    <section className={teamPanelClass} aria-label="Odds comparison">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Odds Comparison</h2>
        <span className={teamPanelBadgeClass}>
          {dataStatus.odds?.source === "the-odds-api"
            ? "The Odds API"
            : "Odds pending"}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className={teamMiniGridClass}>
          <TeamPanelMetric
            label="Outright odds implied"
            value={formatProbability(snapshot.market.bookmakerImpliedProbability)}
          />
          <TeamPanelMetric
            label="Market probability"
            value={formatProbability(snapshot.market.probability)}
          />
          <TeamPanelMetric
            label="Difference"
            value={formatChange(spread)}
            tone={spread < 0 ? "down" : spread > 0 ? "up" : undefined}
          />
          <TeamPanelMetric
            label="Bookmaker spread"
            value={
              min !== undefined && max !== undefined
                ? `${formatProbability(min)} - ${formatProbability(max)}`
                : "Unavailable"
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
                <strong className="font-[556] text-black">Winner outright</strong>
                <b className="font-[556] text-black">
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
                  {item.bookmaker ?? "Bookmaker"}
                </span>
                <strong className="font-[556] text-black">
                  {item.selectionName ?? item.marketName ?? "Fixture odds"}
                </strong>
                <b className="font-[556] text-black">{item.odd ?? "Pending"}</b>
              </div>
            ))
          ) : (
            <TeamEmptyState
              title="Fixture odds pending"
              body="API-Football fixture odds are only shown when a priced upcoming match is available."
            />
          )}
        </div>

        <p className="m-0 text-[11px] leading-relaxed text-prophet-muted">
          Outright odds are third-party context. Fixture odds depend on available
          scheduled matches and bookmaker coverage.
        </p>
      </div>
    </section>
  );
}
