"use client";

import { useTranslations } from "next-intl";

import { sortFixtureGroupOutcomes } from "@/lib/market/build-fixture-markets-snapshot";
import type { FixtureMarketOutcome } from "@/types/market";
import { LineOutcomeButton } from "@/views/trade/game/fixture-markets/line-outcome-button";
import {
  isOutcomeBuyable,
  isOutcomeSelected,
  resolveMoneylineVariant,
  resolveOutcomeDisplayPrice,
} from "@/views/trade/game/markets/fixture-market-actions";
import { resolveFixtureOutcomeLabel } from "@/views/trade/trade-widget/trade-i18n";
import type { MoneyLineCardId } from "./types";

const buttonClassName = "h-[46px] min-w-[120px] rounded-[12px]";

function EmptyAction() {
  return (
    <LineOutcomeButton
      label="—"
      variant="draw"
      disabled
      className={buttonClassName}
    />
  );
}

export function MoneyLineCardActions({
  cardId,
  outcomes,
  selectedOutcomeId,
  selectedBinarySide,
  onSelect,
}: {
  cardId: MoneyLineCardId;
  outcomes: FixtureMarketOutcome[];
  selectedOutcomeId?: string;
  selectedBinarySide?: "yes" | "no";
  onSelect: (outcome: FixtureMarketOutcome, binarySide?: "yes" | "no") => void;
}) {
  const t = useTranslations("trade");

  if (!outcomes.length) {
    return <EmptyAction />;
  }

  if (cardId === "moneyline") {
    const sortedOutcomes = sortFixtureGroupOutcomes(outcomes, "moneyline");

    return (
      <>
        {sortedOutcomes.map((outcome) => {
          const buyable = isOutcomeBuyable(outcome, "yes");
          const displayPrice = resolveOutcomeDisplayPrice(outcome, "yes");

          return (
            <LineOutcomeButton
              key={outcome.id}
              label={resolveFixtureOutcomeLabel(t, outcome)}
              price={displayPrice}
              variant={resolveMoneylineVariant(outcome)}
              active={isOutcomeSelected(
                outcome,
                "yes",
                selectedOutcomeId,
                selectedBinarySide,
              )}
              disabled={!buyable}
              className={buttonClassName}
              onClick={buyable ? () => onSelect(outcome, "yes") : undefined}
            />
          );
        })}
      </>
    );
  }

  if (cardId === "team_to_advance") {
    const sortedOutcomes = sortFixtureGroupOutcomes(outcomes, "team_to_advance");
    let homeOutcome = sortedOutcomes.find((item) => item.side === "home");
    let awayOutcome = sortedOutcomes.find((item) => item.side === "away");

    if (!homeOutcome && !awayOutcome && sortedOutcomes.length >= 2) {
      homeOutcome = sortedOutcomes[0];
      awayOutcome = sortedOutcomes[1];
    } else if (!awayOutcome && sortedOutcomes.length >= 2) {
      awayOutcome = sortedOutcomes.find((item) => item.id !== homeOutcome?.id);
    }

    const slots = [
      { variant: "home" as const, outcome: homeOutcome },
      { variant: "away" as const, outcome: awayOutcome },
    ];

    return (
      <>
        {slots.map(({ variant, outcome }) => {
          const buyable = outcome ? isOutcomeBuyable(outcome, "yes") : false;
          const displayPrice = outcome
            ? resolveOutcomeDisplayPrice(outcome, "yes")
            : undefined;

          return (
            <LineOutcomeButton
              key={variant}
              label={outcome?.label ?? "—"}
              price={displayPrice}
              variant={variant}
              active={
                outcome
                  ? isOutcomeSelected(
                      outcome,
                      "yes",
                      selectedOutcomeId,
                      selectedBinarySide,
                    )
                  : false
              }
              disabled={!buyable}
              className={buttonClassName}
              onClick={buyable ? () => onSelect(outcome!, "yes") : undefined}
            />
          );
        })}
      </>
    );
  }

  const outcome = outcomes[0]!;

  return (
    <>
      {(["yes", "no"] as const).map((binarySide) => {
        const buyable = isOutcomeBuyable(outcome, binarySide);
        const displayPrice = resolveOutcomeDisplayPrice(outcome, binarySide);

        return (
          <LineOutcomeButton
            key={binarySide}
            label={binarySide === "yes" ? t("yes") : t("no")}
            price={displayPrice}
            variant={binarySide}
            active={isOutcomeSelected(
              outcome,
              binarySide,
              selectedOutcomeId,
              selectedBinarySide,
            )}
            disabled={!buyable}
            className={buttonClassName}
            onClick={
              buyable ? () => onSelect(outcome, binarySide) : undefined
            }
          />
        );
      })}
    </>
  );
}
