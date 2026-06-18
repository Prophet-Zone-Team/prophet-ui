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

export interface ComboMarketsResponse {
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
