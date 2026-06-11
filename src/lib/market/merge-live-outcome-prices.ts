import { mergeFixtureOutcomeLiveAsks } from "@/lib/market/fixture-ask-liquidity";
import type { LiveOutcomePrices } from "@/lib/market/fixture-live-prices";
import type {
  FixtureMarketOutcome,
  GameMarketOutcome,
} from "@/types/market";

function probabilityFromAsk(ask: number | undefined): number | undefined {
  if (ask === undefined || ask <= 0 || ask >= 1) {
    return undefined;
  }

  return Math.round(ask * 1000) / 10;
}

export function shouldUseNoAskForOutcomeProbability(
  outcome: Pick<FixtureMarketOutcome, "id" | "side">,
): boolean {
  return outcome.side === "under" || outcome.id.endsWith(":no");
}

export function resolveFixtureOutcomeDisplayProbability(
  outcome:
    | Pick<
        FixtureMarketOutcome,
        "id" | "side" | "yesAsk" | "noAsk" | "probability"
      >
    | undefined,
): number {
  if (!outcome) {
    return 0;
  }

  const useNoAsk = shouldUseNoAskForOutcomeProbability(outcome);
  const fromAsk = probabilityFromAsk(
    useNoAsk ? outcome.noAsk : outcome.yesAsk,
  );

  return fromAsk ?? outcome.probability ?? 0;
}

export function mergeLivePricesIntoFixtureOutcome(
  outcome: FixtureMarketOutcome,
  livePrices: LiveOutcomePrices | undefined,
): FixtureMarketOutcome {
  if (!livePrices) {
    return outcome;
  }

  const merged = mergeFixtureOutcomeLiveAsks(outcome, livePrices);
  const useNoAsk = shouldUseNoAskForOutcomeProbability(outcome);
  const displayAsk = useNoAsk ? merged.noAsk : merged.yesAsk;
  const nextProbability = probabilityFromAsk(displayAsk);

  return {
    ...merged,
    probability: nextProbability ?? merged.probability,
    price:
      displayAsk !== undefined && displayAsk > 0 && displayAsk < 1
        ? displayAsk
        : merged.price,
  };
}

export function mergeLivePricesIntoFixtureOutcomes(
  outcomes: FixtureMarketOutcome[],
  pricesByOutcomeId: Record<string, LiveOutcomePrices>,
): FixtureMarketOutcome[] {
  return outcomes.map((outcome) =>
    mergeLivePricesIntoFixtureOutcome(outcome, pricesByOutcomeId[outcome.id]),
  );
}

export function mergeLivePricesIntoGameOutcomes(
  outcomes: GameMarketOutcome[],
  fixtureOutcomes: FixtureMarketOutcome[],
  pricesByOutcomeId: Record<string, LiveOutcomePrices>,
): GameMarketOutcome[] {
  return outcomes.map((outcome) => {
    const fixtureOutcome = fixtureOutcomes.find((item) => item.side === outcome.side);
    const livePrices = fixtureOutcome
      ? pricesByOutcomeId[fixtureOutcome.id]
      : undefined;

    if (!livePrices) {
      return outcome;
    }

    const nextProbability = probabilityFromAsk(livePrices.yesAsk);

    return {
      ...outcome,
      yesAsk: livePrices.yesAsk ?? outcome.yesAsk,
      yesBid: livePrices.yesBid ?? outcome.yesBid,
      noAsk: livePrices.noAsk ?? outcome.noAsk,
      noBid: livePrices.noBid ?? outcome.noBid,
      probability: nextProbability ?? outcome.probability,
    };
  });
}
