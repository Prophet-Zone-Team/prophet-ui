export interface ComboOddsOption {
  id: string;
  label: string;
  price: number;
  disabled?: boolean;
  disabledTooltip?: string;
  /** Spread markets: team code shown before the line value. */
  spreadTeamCode?: string;
  /** Spread markets: signed line value such as "-2.5". */
  spreadLine?: string;
}

export interface ComboItemTeam {
  name: string;
  code: string;
  logoUrl?: string;
}

export interface ComboItemProps {
  kickoffAt?: string;
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
  /** Selected combo legs count for this market group. */
  selectedLegsCount?: number;
  /** Selected combo leg odds ids for this market group. */
  selectedOddsIds?: readonly string[];
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
  isOptionSelected: (optionId: string) => boolean;
  onSelectOdds?: (option: ComboOddsOption) => void;
}

export interface ExpandedBodyProps {
  moneylineOdds: ComboOddsOption[];
  halftimeOdds?: ComboOddsOption[];
  bttsOdds?: ComboOddsOption[];
  spreadOdds: ComboOddsOption[];
  topScoreOdds: ComboOddsOption[];
  totalOdds?: ComboOddsOption[];
  isOptionSelected: (optionId: string) => boolean;
  onSelectOdds?: (option: ComboOddsOption) => void;
}
