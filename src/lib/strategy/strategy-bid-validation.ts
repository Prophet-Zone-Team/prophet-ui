import { findCuratedTeamByName } from "@/data/teams/curated-team-list";
import {
  calculateEstimatedRoiLabel,
  computeStrategyAllocation,
  formatStrategyMoney
} from "@/lib/strategy/strategy-metrics";
import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import {
  buildTeamMarketBuyPreview,
  getTeamMarketBuyValidation
} from "@/lib/trading/team-market-buy-preview";
import type { TeamMarketSnapshot } from "@/types/market";
import {
  buildStrategyMetricsInput,
  type AvailableStrategyCardData
} from "@/views/strategy/lib/map-strategy-data";

import type { StrategyCardTeamRef } from "@/views/strategy/components/card/team-flags-stack";

export const STRATEGY_BID_INSUFFICIENT_FUNDS_MESSAGE = "Insufficient funds";

export type StrategyBidLegValidation = {
  valid: boolean;
  reason?: string;
};

export type StrategyBidLeg = {
  id: string;
  index: number;
  team: StrategyCardTeamRef;
  teamName: string;
  snapshot?: TeamMarketSnapshot;
  stake: number;
  valuedLabel: string;
  preview?: BidOrderPreview;
  validation: StrategyBidLegValidation;
  estimatedTotalCost: number;
};

export type StrategyBidValidationResult = {
  legs: StrategyBidLeg[];
  estimatedRoiLabel: string;
  toWinLabel: string;
  totalEstimatedCost: number;
  insufficientFunds: boolean;
  canProceedToSign: boolean;
};

const MARKET_DATA_UNAVAILABLE = "Market data unavailable.";

export function resolveTeamSnapshot(
  teamName: string,
  snapshots: TeamMarketSnapshot[]
): TeamMarketSnapshot | undefined {
  const curatedTeam = findCuratedTeamByName(teamName);

  if (!curatedTeam) {
    return undefined;
  }

  return snapshots.find((snapshot) => snapshot.team.id === curatedTeam.id);
}

export function isAggregateBuyInsufficientFunds(
  totalCost: number,
  availableCash: number | undefined
): boolean {
  if (!Number.isFinite(totalCost) || totalCost <= 0) {
    return false;
  }

  if (availableCash === undefined || !Number.isFinite(availableCash)) {
    return false;
  }

  return availableCash + Number.EPSILON < totalCost;
}

export function buildStrategyBidLegs(input: {
  strategy: AvailableStrategyCardData;
  snapshots: TeamMarketSnapshot[];
  bidAmount: number;
}): StrategyBidValidationResult {
  const { strategy, snapshots, bidAmount } = input;
  const metricsInput = buildStrategyMetricsInput(strategy, snapshots);
  const allocation = computeStrategyAllocation({
    ...metricsInput,
    budget: bidAmount
  });

  const estimatedRoiLabel = allocation
    ? calculateEstimatedRoiLabel({ ...metricsInput, budget: bidAmount })
    : "—";
  const toWinLabel = allocation
    ? formatStrategyMoney(allocation.netProfit)
    : "—";

  const legs: StrategyBidLeg[] = strategy.legs.map((leg, index) => {
    const snapshot = resolveTeamSnapshot(leg.teamName, snapshots);
    const stake = allocation?.stakeByIndex.get(index) ?? 0;
    const valuedLabel =
      stake > 0 ? formatStrategyMoney(stake) : stake === 0 ? "—" : "—";

    if (!snapshot) {
      return buildInvalidLeg(leg, index, valuedLabel, stake, MARKET_DATA_UNAVAILABLE);
    }

    if (stake <= 0) {
      return buildInvalidLeg(
        leg,
        index,
        valuedLabel,
        stake,
        MARKET_DATA_UNAVAILABLE
      );
    }

    const preview = buildTeamMarketBuyPreview(snapshot, stake);
    const validation = getTeamMarketBuyValidation(preview);

    return {
      id: leg.id ?? `${leg.teamName}-${index}`,
      index,
      team: leg.team,
      teamName: leg.teamName,
      snapshot,
      stake,
      valuedLabel,
      preview,
      validation,
      estimatedTotalCost: preview.estimatedTotalCost
    };
  });

  const totalEstimatedCost = legs.reduce(
    (sum, leg) => sum + (leg.validation.valid ? leg.estimatedTotalCost : 0),
    0
  );

  return {
    legs,
    estimatedRoiLabel,
    toWinLabel,
    totalEstimatedCost,
    insufficientFunds: false,
    canProceedToSign: false
  };
}

export function getStrategyBidSignableLegs(
  legs: StrategyBidLeg[],
  options?: { skipPreValidation?: boolean }
): StrategyBidLeg[] {
  if (options?.skipPreValidation) {
    return legs.filter(
      (leg) => leg.snapshot && leg.preview && leg.stake > 0
    );
  }

  return legs.filter((leg) => leg.validation.valid);
}

export function validateStrategyBid(input: {
  strategy: AvailableStrategyCardData;
  snapshots: TeamMarketSnapshot[];
  bidAmount: number;
  availableCash: number | undefined;
  riskAccepted: boolean;
  skipPreValidation?: boolean;
}): StrategyBidValidationResult {
  const result = buildStrategyBidLegs({
    strategy: input.strategy,
    snapshots: input.snapshots,
    bidAmount: input.bidAmount
  });

  const allLegsValid = result.legs.every((leg) => leg.validation.valid);
  const hasAllocation = result.toWinLabel !== "—";
  const insufficientFunds = isAggregateBuyInsufficientFunds(
    result.totalEstimatedCost,
    input.availableCash
  );
  const signableLegs = getStrategyBidSignableLegs(result.legs, {
    skipPreValidation: input.skipPreValidation
  });

  const passesPreValidation =
    input.skipPreValidation === true
      ? signableLegs.length > 0
      : allLegsValid && !insufficientFunds;

  return {
    ...result,
    insufficientFunds,
    canProceedToSign:
      input.bidAmount > 0 &&
      input.riskAccepted &&
      hasAllocation &&
      passesPreValidation
  };
}

function buildInvalidLeg(
  leg: AvailableStrategyCardData["legs"][number],
  index: number,
  valuedLabel: string,
  stake: number,
  reason: string
): StrategyBidLeg {
  return {
    id: leg.id ?? `${leg.teamName}-${index}`,
    index,
    team: leg.team,
    teamName: leg.teamName,
    stake,
    valuedLabel,
    validation: { valid: false, reason },
    estimatedTotalCost: 0
  };
}

export { STRATEGY_BID_INSUFFICIENT_FUNDS_MESSAGE as INSUFFICIENT_FUNDS_MESSAGE };
