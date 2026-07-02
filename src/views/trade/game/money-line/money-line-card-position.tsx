"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { evaluateGamePositionSellReadiness } from "@/lib/portfolio/evaluate-position-sell-readiness";
import {
  formatPnlSubline,
  formatSharePrice,
  getOutcomeToneClass
} from "@/lib/portfolio/portfolio-format";
import { resolvePositionGameSellContext } from "@/lib/portfolio/resolve-position-game-sell-context";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { useTradeTicketStore } from "@/store/trade-ticket-store";
import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  UserPositionRecord
} from "@/types/market";
import { PortfolioPositionSellDialog } from "@/views/portfolio/portfolio-position-sell-dialog";

import {
  resolveFixtureOutcomeForPosition,
  sumPositionCurrentValue
} from "./resolve-card-positions";

function formatPositionMarketPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  }).format(price);
}

function buildOutcomeParts(
  position: UserPositionRecord,
  fixtureOutcome?: FixtureMarketOutcome
) {
  const teamLabel = fixtureOutcome?.label?.trim() || position.title.trim();

  return {
    teamLabel,
    outcome: position.outcome.trim(),
    priceLabel: formatPositionMarketPrice(position.curPrice)
  };
}

const POSITION_TABLE_GRID =
  "grid-cols-[minmax(0,1.35fr)_minmax(4.5rem,0.75fr)_minmax(4.5rem,0.75fr)_minmax(4.5rem,0.75fr)_minmax(5rem,0.85fr)_3.5rem]";

function PositionOutcomeLabel({
  teamLabel,
  outcome,
  priceLabel,
  outcomeTone
}: {
  teamLabel: string;
  outcome: string;
  priceLabel: string;
  outcomeTone: string;
}) {
  return (
    <p className="m-0 truncate text-[14px] leading-[18px] text-prophet-foreground">
      <span>{teamLabel}</span> <span className={outcomeTone}>{outcome}</span>{" "}
      <span className={outcomeTone}>{priceLabel}</span>
    </p>
  );
}

function PositionDesktopTableRow({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "col-span-full grid grid-cols-subgrid items-center gap-x-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MoneyLineCardPosition({
  positions,
  cardOutcomes,
  gameSnapshot,
  fixtureMarkets,
  onPositionsChange
}: {
  positions: UserPositionRecord[];
  cardOutcomes: FixtureMarketOutcome[];
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  onPositionsChange?: () => void;
}) {
  const t = useTranslations("trade");
  const [expanded, setExpanded] = useState(false);
  const [sellPosition, setSellPosition] = useState<UserPositionRecord | null>(
    null
  );
  const [actionLoadingAsset, setActionLoadingAsset] = useState<string | null>(
    null
  );
  const {
    isAuthenticated,
    session,
    readiness,
    isRegionBlocked,
    isBuyRestricted,
    isRegionCloseOnly
  } = useAuth();

  if (!positions.length) {
    return null;
  }

  const totalCurrentValue = sumPositionCurrentValue(positions);
  const sellReadinessInput = {
    isAuthenticated,
    session,
    authReadiness: readiness,
    isRegionBlocked,
    isBuyRestricted,
    isRegionCloseOnly
  };

  const handleSell = async (position: UserPositionRecord) => {
    if (isRegionBlocked || actionLoadingAsset) {
      return;
    }

    setActionLoadingAsset(position.asset);

    try {
      const context = resolvePositionGameSellContext(
        position,
        gameSnapshot,
        fixtureMarkets
      );

      if (!context) {
        toast.error(t("marketDataUnavailable"));
        return;
      }

      const readinessResult = await evaluateGamePositionSellReadiness(context, {
        position,
        ...sellReadinessInput
      });

      if (!readinessResult.ok) {
        toast.error(readinessResult.message ?? t("positionNotAvailableToSell"));
        return;
      }

      useTradeTicketStore.getState().syncForGamePositionSell(context, position);
      setSellPosition(position);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("marketDataUnavailable")
      );
    } finally {
      setActionLoadingAsset(null);
    }
  };

  const sellContext =
    sellPosition &&
    resolvePositionGameSellContext(sellPosition, gameSnapshot, fixtureMarkets);

  return (
    <>
      <div className="border-t border-prophet-line bg-prophet-action-panel">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          <span className="flex items-center gap-1 text-[14px] font-[500] leading-[18px] text-prophet-muted">
            {t("position")}
            <ChevronDown
              className={cn(
                "size-3 text-prophet-muted transition-transform",
                expanded && "rotate-180"
              )}
              aria-hidden
            />
          </span>
          <span className="text-[14px] font-[400] leading-[18px] text-prophet-foreground">
            {formatTeamDetailMoney(totalCurrentValue)}
          </span>
        </button>

        {expanded ? (
          <div className="border-t border-prophet-line px-4 pb-4 pt-3">
            <div className="hidden overflow-x-auto md:block">
              <div
                className={cn(
                  "grid min-w-[640px] gap-x-3 gap-y-3",
                  POSITION_TABLE_GRID
                )}
              >
                <PositionDesktopTableRow>
                  <span className="text-[12px] leading-[15px] text-prophet-muted">
                    {t("positionOutcome")}
                  </span>
                  <span className="text-[12px] leading-[15px] text-prophet-muted">
                    {t("positionAvg")}
                  </span>
                  <span className="text-[12px] leading-[15px] text-prophet-muted">
                    {t("positionCost")}
                  </span>
                  <span className="text-[12px] leading-[15px] text-prophet-muted">
                    {t("toWin")}
                  </span>
                  <span className="text-[12px] leading-[15px] text-prophet-muted">
                    {t("positionCurrent")}
                  </span>
                  <span className="sr-only">{t("sell")}</span>
                </PositionDesktopTableRow>

                {positions.map((position) => {
                  const fixtureOutcome = resolveFixtureOutcomeForPosition(
                    position,
                    cardOutcomes
                  );
                  const outcomeParts = buildOutcomeParts(
                    position,
                    fixtureOutcome
                  );
                  const outcomeTone = getOutcomeToneClass(position.outcome);
                  const pnlTone =
                    position.cashPnl >= 0
                      ? "text-[#65AF14]"
                      : "text-prophet-red";
                  const isLoading = actionLoadingAsset === position.asset;

                  return (
                    <PositionDesktopTableRow
                      key={`${position.conditionId}:${position.asset}`}
                    >
                      <div className="min-w-0">
                        <PositionOutcomeLabel
                          teamLabel={outcomeParts.teamLabel}
                          outcome={outcomeParts.outcome}
                          priceLabel={outcomeParts.priceLabel}
                          outcomeTone={outcomeTone}
                        />
                      </div>

                      <p className="m-0 text-[14px] leading-[18px] text-prophet-foreground">
                        {formatSharePrice(position.avgPrice)}
                      </p>

                      <p className="m-0 text-[14px] leading-[18px] text-prophet-foreground">
                        {formatTeamDetailMoney(position.initialValue)}
                      </p>

                      <p className="m-0 text-[14px] leading-[18px] text-prophet-foreground">
                        {formatTeamDetailMoney(position.size)}
                      </p>

                      <div className="min-w-0">
                        <p className="m-0 text-[14px] leading-[18px] text-prophet-foreground">
                          {formatTeamDetailMoney(position.currentValue)}
                        </p>
                        <p
                          className={cn(
                            "m-0 text-[12px] leading-[15px]",
                            pnlTone
                          )}
                        >
                          {formatPnlSubline(
                            position.cashPnl,
                            position.percentPnl
                          )}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <RegionRestrictedControl restricted={isRegionBlocked}>
                          <button
                            type="button"
                            className="inline-flex h-[30px] min-w-[54px] items-center justify-center rounded-[6px] bg-prophet-primary px-3 text-[14px] leading-[18px] text-prophet-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isLoading || position.size <= 0}
                            onClick={() => void handleSell(position)}
                          >
                            {isLoading ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              t("sell")
                            )}
                          </button>
                        </RegionRestrictedControl>
                      </div>
                    </PositionDesktopTableRow>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3 md:hidden">
              {positions.map((position) => {
                const fixtureOutcome = resolveFixtureOutcomeForPosition(
                  position,
                  cardOutcomes
                );
                const outcomeParts = buildOutcomeParts(
                  position,
                  fixtureOutcome
                );
                const outcomeTone = getOutcomeToneClass(position.outcome);
                const pnlTone =
                  position.cashPnl >= 0 ? "text-[#65AF14]" : "text-prophet-red";
                const isLoading = actionLoadingAsset === position.asset;

                return (
                  <div
                    key={`${position.conditionId}:${position.asset}`}
                    className="grid gap-3 border-t border-prophet-line pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="m-0 text-[12px] leading-[15px] text-prophet-muted">
                        {t("positionOutcome")}
                      </p>
                      <PositionOutcomeLabel
                        teamLabel={outcomeParts.teamLabel}
                        outcome={outcomeParts.outcome}
                        priceLabel={outcomeParts.priceLabel}
                        outcomeTone={outcomeTone}
                      />
                    </div>

                    <div>
                      <p className="m-0 text-[12px] leading-[15px] text-prophet-muted">
                        {t("positionAvg")}
                      </p>
                      <p className="m-0 text-[14px] leading-[18px] text-prophet-foreground">
                        {formatSharePrice(position.avgPrice)}
                      </p>
                    </div>

                    <div>
                      <p className="m-0 text-[12px] leading-[15px] text-prophet-muted">
                        {t("positionCost")}
                      </p>
                      <p className="m-0 text-[14px] leading-[18px] text-prophet-foreground">
                        {formatTeamDetailMoney(position.initialValue)}
                      </p>
                    </div>

                    <div>
                      <p className="m-0 text-[12px] leading-[15px] text-prophet-muted">
                        {t("toWin")}
                      </p>
                      <p className="m-0 text-[14px] leading-[18px] text-prophet-foreground">
                        {formatTeamDetailMoney(position.size)}
                      </p>
                    </div>

                    <div>
                      <p className="m-0 text-[12px] leading-[15px] text-prophet-muted">
                        {t("positionCurrent")}
                      </p>
                      <p className="m-0 text-[14px] leading-[18px] text-prophet-foreground">
                        {formatTeamDetailMoney(position.currentValue)}
                      </p>
                      <p
                        className={cn(
                          "m-0 text-[12px] leading-[15px]",
                          pnlTone
                        )}
                      >
                        {formatPnlSubline(
                          position.cashPnl,
                          position.percentPnl
                        )}
                      </p>
                    </div>

                    <div className="flex">
                      <RegionRestrictedControl restricted={isRegionBlocked}>
                        <button
                          type="button"
                          className="inline-flex h-[30px] min-w-[54px] items-center justify-center rounded-[6px] bg-prophet-primary px-3 text-[14px] leading-[18px] text-prophet-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isLoading || position.size <= 0}
                          onClick={() => void handleSell(position)}
                        >
                          {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            t("sell")
                          )}
                        </button>
                      </RegionRestrictedControl>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {sellPosition && sellContext ? (
        <PortfolioPositionSellDialog
          open
          variant="game"
          position={sellPosition}
          context={sellContext}
          onClose={() => {
            setSellPosition(null);
            onPositionsChange?.();
          }}
        />
      ) : null}
    </>
  );
}
