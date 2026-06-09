import type { CuratedTeamEntry } from "@/data/teams/curated-team-list";

export type StrategyMetricsInput = {
  budget: number;
  teams: CuratedTeamEntry[];
  probabilities: Array<number | undefined>;
};

export type StrategyAllocation = {
  /** Sum of selected team probabilities in percentage points (e.g. 55.7). */
  totalProbabilityPercent: number;
  /** Combined probability as a decimal (e.g. 0.557). */
  totalProbability: number;
  /** Theoretical gross return when any selected team wins (B / P). */
  theoreticalReturn: number;
  /** Net profit when any selected team wins (B / P - B). */
  netProfit: number;
  /** Net profit divided by budget. */
  netRoi: number;
  /** Per-team stake keyed by team index in the strategy list. */
  stakeByIndex: Map<number, number>;
};

export const MIN_STRATEGY_LEG_STAKE = 5;

function hasValidProbability(
  probability: number | undefined
): probability is number {
  return probability !== undefined && probability > 0;
}

/** Minimum total bid so every leg stake is at least MIN_STRATEGY_LEG_STAKE. */
export function calculateMinStrategyBidAmount(
  input: Omit<StrategyMetricsInput, "budget">
): number | undefined {
  const validProbabilities = input.probabilities.filter(hasValidProbability);

  if (validProbabilities.length === 0) {
    return undefined;
  }

  const totalProbabilityPercent = validProbabilities.reduce(
    (sum, probability) => sum + probability,
    0
  );

  if (totalProbabilityPercent <= 0) {
    return undefined;
  }

  const minBudget = Math.max(
    ...validProbabilities.map(
      (probability) =>
        (MIN_STRATEGY_LEG_STAKE * totalProbabilityPercent) / probability
    )
  );

  return Math.ceil(minBudget * 100) / 100;
}

export function computeStrategyAllocation(
  input: StrategyMetricsInput
): StrategyAllocation | undefined {
  const { budget, probabilities } = input;

  if (budget <= 0) {
    return undefined;
  }

  const validEntries = probabilities
    .map((probability, index) => ({ probability, index }))
    .filter(
      (entry): entry is { probability: number; index: number } =>
        hasValidProbability(entry.probability)
    );

  if (validEntries.length === 0) {
    return undefined;
  }

  const totalProbabilityPercent = validEntries.reduce(
    (sum, { probability }) => sum + probability,
    0
  );

  if (totalProbabilityPercent <= 0) {
    return undefined;
  }

  const totalProbability = totalProbabilityPercent / 100;
  const theoreticalReturn = budget / totalProbability;
  const netProfit = theoreticalReturn - budget;
  const netRoi = netProfit / budget;
  const stakeByIndex = new Map<number, number>();

  for (const { probability, index } of validEntries) {
    stakeByIndex.set(
      index,
      (budget * probability) / totalProbabilityPercent
    );
  }

  return {
    totalProbabilityPercent,
    totalProbability,
    theoreticalReturn,
    netProfit,
    netRoi,
    stakeByIndex
  };
}


export function formatStrategyMoney(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "—";
  }

  const truncatedCents = Math.trunc(amount * 100);
  const truncated = truncatedCents / 100;
  const hasFraction = truncatedCents % 100 !== 0;

  const formatted = truncated.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0
  });

  return `$${formatted}`;
}

const STRATEGY_BUDGET_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 10
};

function formatStrategyBudgetAmount(
  amount: number,
  options?: Pick<Intl.NumberFormatOptions, "useGrouping">
): string {
  return amount.toLocaleString("en-US", {
    ...STRATEGY_BUDGET_FORMAT_OPTIONS,
    useGrouping: options?.useGrouping ?? true
  });
}

/** Bid amount input for strategy modals; preserves existing decimal places. */
export function formatStrategyBidAmountInput(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "0";
  }

  return formatStrategyBudgetAmount(amount, { useGrouping: false });
}

/** Budget label for strategy cards; preserves existing decimal places. */
export function formatStrategyBudgetLabel(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `$${formatStrategyBudgetAmount(amount)}`;
}

export function formatStrategyRoiPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** Net profit / budget for the strategy card Est. ROI field. */
export function calculateEstimatedRoiLabel(
  input: StrategyMetricsInput
): string {
  const allocation = computeStrategyAllocation(input);

  if (!allocation) {
    return "—";
  }

  return formatStrategyRoiPercent(allocation.netRoi);
}

/** Theoretical gross return (B / P) for the strategy card Hit Return field. */
export function calculateHitReturnLabel(input: StrategyMetricsInput): string {
  const allocation = computeStrategyAllocation(input);

  if (!allocation) {
    return "—";
  }

  return formatStrategyMoney(allocation.theoreticalReturn);
}

export function formatLegStakeLabel(
  allocation: StrategyAllocation | undefined,
  teamIndex: number
): string {
  const stake = allocation?.stakeByIndex.get(teamIndex);

  if (stake === undefined) {
    return "—";
  }

  return formatStrategyMoney(stake);
}

export function formatLegProfitLabel(
  allocation: StrategyAllocation | undefined,
  hasTeamProbability: boolean
): string {
  if (!allocation || !hasTeamProbability) {
    return "—";
  }

  return formatStrategyMoney(allocation.netProfit);
}
