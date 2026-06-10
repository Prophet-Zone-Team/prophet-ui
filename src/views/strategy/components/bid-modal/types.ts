import type { AvailableStrategyCardData } from "@/views/strategy/lib/map-strategy-data";
import type { TeamMarketSnapshot } from "@/types/market";

import type { StrategyCardTeamRef } from "../card/team-flags-stack";
import type { StrategyBidLeg, StrategyBidValidationResult } from "@/lib/strategy/strategy-bid-validation";
import type { SignedStrategyBidLeg } from "@/lib/strategy/run-strategy-bid";

export type StrategyBidModalProps = {
  open: boolean;
  onClose: () => void;
  strategy: AvailableStrategyCardData | null;
  snapshots: TeamMarketSnapshot[];
};

export type StrategyBidStep = "confirm" | "sign";

export type StrategyBidMarketRow = {
  id: string;
  team: StrategyCardTeamRef;
  teamName: string;
  tradedLabel: string;
  invalid?: boolean;
  invalidReason?: string;
};

export type StrategyBidPreview = StrategyBidValidationResult & {
  marketRows: StrategyBidMarketRow[];
};

export type LegSignStatus =
  | "pending"
  | "signing"
  | "signed"
  | "sign_failed"
  | "submit_failed";

export type StrategyBidSignLegState = {
  leg: StrategyBidLeg;
  status: LegSignStatus;
  errorMessage?: string;
  signed?: SignedStrategyBidLeg;
  /** True once this leg has completed at least one successful signature. */
  hasSignedOnce?: boolean;
};

export type StrategyBidSignState = {
  legs: StrategyBidSignLegState[];
  isSubmitting: boolean;
  submitError?: string;
};
