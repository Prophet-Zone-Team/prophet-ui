export interface ComboOddsOption {
  id: string;
  label: string;
  price: number;
}

export interface ComboItemTeam {
  name: string;
  code: string;
  logoUrl?: string;
}

export interface ComboItemProps {
  kickoffLabel: string;
  isLive?: boolean;
  homeTeam: ComboItemTeam;
  awayTeam: ComboItemTeam;
  moneylineOdds: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
  /** Over/under preview buttons shown in the collapsed secondary row. */
  totalOdds?: ComboOddsOption[];
  totalOddsCount?: number;
  selectedOddsId?: string | null;
  defaultSelectedOddsId?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onSelectOdds?: (option: ComboOddsOption) => void;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
}

export interface CollapsedBodyProps {
  homeTeam: ComboItemTeam;
  awayTeam: ComboItemTeam;
  moneylineOdds: ComboOddsOption[];
  previewOdds: ComboOddsOption[];
  selectedOddsId?: string | null;
  onSelectOdds?: (option: ComboOddsOption) => void;
}

export interface ExpandedBodyProps {
  moneylineOdds: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
  selectedOddsId?: string | null;
  onSelectOdds?: (option: ComboOddsOption) => void;
}
