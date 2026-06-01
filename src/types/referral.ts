export type ReferralFlagKind = "emoji" | "england";

export interface ReferralTab {
  id: string;
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

export interface ReferralHeroStat {
  value: string;
  label: string;
}

export interface ReferralTerminalSignal {
  flag: string;
  flagKind?: ReferralFlagKind;
  title: string;
  copy: string;
  value: string;
  delta: string;
  deltaDown?: boolean;
}

export interface ReferralTeamCard {
  rank: number;
  name: string;
  flag: string;
  flagKind?: ReferralFlagKind;
  probability: string;
  delta: string;
  down?: boolean;
}

export interface ReferralMovementCard {
  flag: string;
  flagKind?: ReferralFlagKind;
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

export interface ReferralMatchOdd {
  probability: string;
  label: string;
  price: string;
}

export interface ReferralMatch {
  home: string;
  homeFlag: string;
  homeCode: string;
  away: string;
  awayFlag: string;
  awayCode: string;
  homeFlagKind?: ReferralFlagKind;
  awayFlagKind?: ReferralFlagKind;
  time: string;
  odds: [ReferralMatchOdd, ReferralMatchOdd, ReferralMatchOdd];
}

export interface ReferralWorkStep {
  number: number;
  title: string;
  copy: string;
}

export interface ReferralSignalTaxonomy {
  id: string;
  label: string;
}

export interface ReferralWhyItem {
  id: string;
  title: string;
  copy: string;
}

export interface ReferralCategory {
  id: string;
  label: string;
}

export interface ReferralContent {
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

export interface ReferralMarketingContent {
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleHighlight: string;
    subcopy: string;
    stats: ReferralHeroStat[];
    terminal: {
      featured: ReferralTerminalSignal;
      rows: ReferralTerminalSignal[];
      metrics: { value: string; label: string }[];
    };
  };
  teams: ReferralTeamCard[];
  moreTeamsCount: number;
  footnote: { left: string; right: string };
  movements: ReferralMovementCard[];
  matches: ReferralMatch[];
  workSteps: ReferralWorkStep[];
  signalTaxonomy: ReferralSignalTaxonomy[];
  whyItems: ReferralWhyItem[];
  footerTitle: string;
  footerHighlight: string;
  categories: ReferralCategory[];
}

export interface ReferralPageContent {
  referral: ReferralContent;
  marketing: ReferralMarketingContent;
}
