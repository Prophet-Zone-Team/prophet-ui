export type ComboPickOutcomeSide = "yes" | "no";

export interface ComboLineOption {
  value: string;
  disabled?: boolean;
}

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

export interface ComboTotalPick extends ComboPickBase {
  type: "total";
  totalValue: string;
  totalOptions?: Array<string | ComboLineOption>;
  /** yes = over, no = under */
  outcomeSide: ComboPickOutcomeSide;
}

export type ComboPick = ComboMoneylinePick | ComboSpreadPick | ComboTotalPick;

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
  /** Shown when a pick's yes/no toggle is locked in the widget. */
  outcomeToggleDisabledTooltip?: string;
  onPickSpreadChange?: (pickId: string, spread: string) => void;
  onPickTotalChange?: (pickId: string, total: string) => void;
  onRemovePick?: (pickId: string) => void;
  onSubmit?: () => void;
  onInfoClick?: () => void;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  isQuoteLoading?: boolean;
  isAuthenticated?: boolean;
  loginInProgress?: boolean;
  connectWalletLabel?: string;
  connectingLabel?: string;
  submitLabel?: string;
  onConnectWallet?: () => void;
  className?: string;
}
