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
  halftimeOdds?: ComboOddsOption[];
  bttsOdds?: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
  /** Over/under and related total markets shown in expanded view and collapsed preview. */
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
  halftimeOdds?: ComboOddsOption[];
  bttsOdds?: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
  totalOdds?: ComboOddsOption[];
  selectedOddsId?: string | null;
  onSelectOdds?: (option: ComboOddsOption) => void;
}
