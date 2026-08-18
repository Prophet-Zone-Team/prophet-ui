export interface MarketOddsOption {
  id: string;
  label: string;
  price: number;
}

export interface MarketItemTeam {
  name: string;
  code: string;
  logoUrl?: string;
}

export interface MarketItemProps {
  kickoffLabel: string;
  isLive?: boolean;
  homeTeam: MarketItemTeam;
  awayTeam: MarketItemTeam;
  moneylineOdds: MarketOddsOption[];
  spreadOdds: MarketOddsOption[];
  topScoreOdds: MarketOddsOption[];
  totalOdds?: MarketOddsOption[];
  totalOddsCount?: number;
  selectedOddsId?: string | null;
  defaultSelectedOddsId?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onSelectOdds?: (option: MarketOddsOption) => void;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
}

export interface CollapsedBodyProps {
  homeTeam: MarketItemTeam;
  awayTeam: MarketItemTeam;
  moneylineOdds: MarketOddsOption[];
  previewOdds: MarketOddsOption[];
  selectedOddsId?: string | null;
  onSelectOdds?: (option: MarketOddsOption) => void;
}

export interface ExpandedBodyProps {
  moneylineOdds: MarketOddsOption[];
  spreadOdds: MarketOddsOption[];
  topScoreOdds: MarketOddsOption[];
  selectedOddsId?: string | null;
  onSelectOdds?: (option: MarketOddsOption) => void;
}
