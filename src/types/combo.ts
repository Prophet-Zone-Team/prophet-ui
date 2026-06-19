export type ComboOutcomeSide = "yes" | "no";

export type ComboRfqDirection = "BUY" | "SELL";

export type ComboRfqStatus =
  | "CREATED"
  | "COLLECTING_QUOTES"
  | "AWAITING_REQUESTER_ACCEPTANCE"
  | "AWAITING_MAKER_CONFIRMATION"
  | "EXECUTING"
  | "FILLED"
  | "FAILED"
  | "EXPIRED"
  | "CANCELED"
  | "REJECTED";

export type ComboExecutionStatus =
  | "PENDING"
  | "MATCHED"
  | "MINED"
  | "CONFIRMED"
  | "FAILED";

export interface ComboMarketRecord {
  id: string;
  conditionId: string;
  positionIds: [string, string];
  slug: string;
  title: string;
  outcomes: [string, string];
  outcomePrices: [string, string];
  image?: string;
  volume?: number;
  tags?: string[];
}

export interface ComboGameTeam {
  name: string;
  code: string;
  logoUrl?: string;
}

export interface ComboGameGroup {
  slug: string;
  title: string;
  kickoffAt?: string;
  kickoffLabel: string;
  image?: string;
  homeTeam: ComboGameTeam;
  awayTeam: ComboGameTeam;
  markets: ComboMarketRecord[];
}

export type ComboMarketsDay = "all" | "today" | "tomorrow";

export interface ComboMarketsDaySnapshot {
  groups: ComboGameGroup[];
  markets: ComboMarketRecord[];
  nextCursor?: string | null;
  /** Calendar date (YYYY-MM-DD) in the request timezone when this snapshot was fetched. */
  cachedOnDate: string;
  /** IANA timezone used for the API request, e.g. Asia/Shanghai. */
  timezone: string;
}

export interface ComboMarketsResponse {
  groups: ComboGameGroup[];
  markets: ComboMarketRecord[];
  nextCursor?: string | null;
}

export interface ComboTicketLeg {
  id: string;
  legPositionId: string;
  outcomeSide: ComboOutcomeSide;
  referencePrice: number;
}

export interface ComboQuoteSnapshot {
  rfqId: string;
  quoteId: string;
  status: ComboRfqStatus;
  direction: ComboRfqDirection;
  blendedPrice: number;
  shares: number;
  notionalUsd: number;
  multiplier: number;
  estimatedToWin: number;
  yesPositionId: string;
  legPositionIds: string[];
  expiresAt: number;
  makerAmountBaseUnits: string;
  takerAmountBaseUnits: string;
  /** Total spend including fees, from RFQ gateway quote (e6 string). */
  totalRequiredBaseUnits?: string;
}

export interface ComboExchangeV3Order {
  salt: string;
  maker: string;
  signer: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  side: 0 | 1;
  signatureType: number;
  timestamp: string;
  metadata: string;
  builder: string;
  signature: string;
  expiration?: string;
}

export interface SignedComboAcceptOrder {
  rfqId: string;
  quoteId: string;
  signedOrder: ComboExchangeV3Order;
}

export interface ComboSubmitResult {
  rfqId: string;
  executionStatus: ComboExecutionStatus;
  txHash?: string;
  error?: string;
}

export type ComboQuoteSource = "estimated" | "rfq";

export type ComboTicketStatus =
  | "idle"
  | "quoting"
  | "signing"
  | "submitting"
  | "success"
  | "error";
