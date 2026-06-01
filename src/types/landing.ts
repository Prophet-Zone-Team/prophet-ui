export type LandingFlagKind = "emoji" | "england";

export interface LandingNavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface ReferralTab {
  label: string;
  href: string;
  active?: boolean;
}

export type ReferralMetricIconKind =
  | "users"
  | "dollar"
  | "us"
  | "gold-dollar"
  | "gold-claim"
  | "tier"
  | "percent"
  | "check";

export interface ReferralMetric {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: ReferralMetricIconKind;
  highlight?: boolean;
  tierProgress?: {
    targetLabel: string;
    progressPercent: number;
    successLine: string;
  };
}

export interface ReferralFormulaPart {
  label: string;
  value: string;
}

export interface ReferralActivityRow {
  user: string;
  orderId: string;
  market: string;
  orderType: string;
  orderVolume: string;
  prophetFee: string;
  kickbackRate: string;
  reward: string;
  status: string;
  time: string;
}

export interface LandingHeroStat {
  value: string;
  label: string;
}

export interface LandingTerminalSignal {
  flag: string;
  flagKind?: LandingFlagKind;
  title: string;
  copy: string;
  value: string;
  delta: string;
  deltaDown?: boolean;
}

export interface LandingTeamCard {
  rank: number;
  name: string;
  flag: string;
  flagKind?: LandingFlagKind;
  probability: string;
  delta: string;
  down?: boolean;
}

export interface LandingMovementCard {
  flag: string;
  flagKind?: LandingFlagKind;
  title: string;
  titleDown?: boolean;
  copy: string;
  copyHtml?: string;
  volume: string;
  confidence: "high" | "medium";
  score: string;
  delta?: string;
  deltaDown?: boolean;
  trending?: boolean;
}

export interface LandingMatchOdd {
  probability: string;
  label: string;
  price: string;
}

export interface LandingMatch {
  home: string;
  homeFlag: string;
  homeCode: string;
  away: string;
  awayFlag: string;
  awayCode: string;
  homeFlagKind?: LandingFlagKind;
  awayFlagKind?: LandingFlagKind;
  time: string;
  odds: [LandingMatchOdd, LandingMatchOdd, LandingMatchOdd];
}

export interface LandingWorkStep {
  number: number;
  title: string;
  copy: string;
}

export interface LandingSignalTaxonomy {
  id: string;
  label: string;
}

export interface LandingWhyItem {
  id: string;
  title: string;
  copy: string;
}

export interface LandingCategory {
  id: string;
  label: string;
}

export interface LandingReferralContent {
  title: string;
  subtitle: string;
  note: string;
  balanceLabel: string;
  balanceValue: string;
  referralLink: string;
  tabs: ReferralTab[];
  metrics: ReferralMetric[];
  formula: ReferralFormulaPart[];
  earnFootnote: string;
  activityRows: ReferralActivityRow[];
  claimMeta: string;
}

export interface LandingMarketingContent {
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleHighlight: string;
    subcopy: string;
    stats: LandingHeroStat[];
    terminal: {
      featured: LandingTerminalSignal;
      rows: LandingTerminalSignal[];
      metrics: { value: string; label: string }[];
    };
  };
  teams: LandingTeamCard[];
  moreTeamsCount: number;
  footnote: { left: string; right: string };
  movements: LandingMovementCard[];
  matches: LandingMatch[];
  workSteps: LandingWorkStep[];
  signalTaxonomy: LandingSignalTaxonomy[];
  whyItems: LandingWhyItem[];
  footerTitle: string;
  footerHighlight: string;
  categories: LandingCategory[];
}

export interface LandingPageContent {
  nav: LandingNavItem[];
  referral: LandingReferralContent;
  marketing: LandingMarketingContent;
}
