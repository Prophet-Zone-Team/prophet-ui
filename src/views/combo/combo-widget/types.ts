export type ComboPickOutcomeSide = "yes" | "no";

export interface ComboPickTeam {
  name: string;
  code: string;
  logoUrl?: string;
}

interface ComboPickBase {
  id: string;
  matchupLabel: string;
  team: ComboPickTeam;
  selectionLabel: string;
  /** Underlying RFQ leg position ID used when submitting the combo ticket. */
  legPositionId?: string;
  /** Catalog reference price for local multiplier preview before RFQ returns. */
  referencePrice?: number;
}

export interface ComboMoneylinePick extends ComboPickBase {
  type: "moneyline";
  outcomeSide: ComboPickOutcomeSide;
}

export interface ComboSpreadPick extends ComboPickBase {
  type: "spread";
  spreadValue: string;
  spreadOptions?: string[];
}

export type ComboPick = ComboMoneylinePick | ComboSpreadPick;

export interface ComboWidgetProps {
  picks: ComboPick[];
  multiplier: number;
  bidAmount?: number;
  defaultBidAmount?: number;
  balance: number;
  toWinAmount?: number;
  onBidAmountChange?: (amount: number) => void;
  onApplyBalanceFraction?: (fraction: number) => void;
  onPickOutcomeChange?: (pickId: string, side: ComboPickOutcomeSide) => void;
  onPickSpreadChange?: (pickId: string, spread: string) => void;
  onRemovePick?: (pickId: string) => void;
  onSubmit?: () => void;
  onInfoClick?: () => void;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  className?: string;
}
