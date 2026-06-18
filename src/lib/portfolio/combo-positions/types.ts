export type ComboPositionStatus =
  | "OPEN"
  | "PARTIAL"
  | "RESOLVED_WIN"
  | "RESOLVED_LOSS";

export interface ComboPositionMarketEvent {
  event_id?: string;
  event_slug?: string;
  event_title?: string;
  event_image?: string;
}

export interface ComboPositionMarket {
  market_id?: string;
  slug?: string;
  title?: string;
  outcome?: string;
  image_url?: string;
  icon_url?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  end_date?: string;
  event?: ComboPositionMarketEvent;
}

export interface ComboPositionLeg {
  leg_index?: number;
  leg_position_id?: string;
  leg_condition_id?: string;
  leg_outcome_index?: number;
  leg_outcome_label?: string;
  leg_status?: string;
  leg_resolved_at?: string | null;
  leg_current_price?: string;
  market?: ComboPositionMarket;
}

export interface ComboPositionRecord {
  combo_condition_id?: string;
  combo_position_id?: string;
  module_id?: number;
  user_address?: string;
  shares_balance?: string;
  entry_avg_price_usdc?: string;
  entry_cost_usdc?: string;
  realized_payout_usdc?: string;
  total_cost_usdc?: string;
  status?: ComboPositionStatus;
  first_entry_at?: string;
  resolved_at?: string | null;
  legs_total?: number;
  legs_resolved?: number;
  legs_pending?: number;
  legs?: ComboPositionLeg[];
}

export interface ComboPositionsResponse {
  combos?: ComboPositionRecord[];
  pagination?: {
    limit?: number;
    offset?: number;
    has_more?: boolean;
    next_cursor?: string | null;
  };
}

export interface PortfolioComboPositionPick {
  id: string;
  matchupLabel: string;
  selectionLabel: string;
  marketTitle: string;
  legStatus?: string;
  legPrice?: number;
  team: {
    name: string;
    code: string;
    logoUrl?: string;
  };
}

export interface PortfolioComboPositionCard {
  id: string;
  picks: PortfolioComboPositionPick[];
  multiplier: number;
  stakeAmount: number;
  toWinAmount: number;
  firstEntryAt?: string;
  cashoutAmount?: number;
}
