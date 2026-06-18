export interface ComboRfqWsAuthPayload {
  auth: {
    apiKey: string;
    secret: string;
    passphrase: string;
  };
  identity: {
    signer_address: string;
    maker_address: string;
    signature_type: number;
  };
}

export interface ComboRfqWsRequestedSize {
  unit: "notional" | "shares";
  value_e6: string;
}

export interface ComboRfqWsRequestPayload {
  rfq_id?: string;
  maker_address?: string;
  requestor_public_id?: string;
  leg_position_ids: string[];
  condition_id?: string;
  yes_position_id?: string;
  no_position_id?: string;
  direction: "BUY" | "SELL";
  side: "YES" | "NO";
  requested_size: ComboRfqWsRequestedSize;
  created_at?: number;
}

export interface ComboRfqWsQuotePayload {
  quote_id: string;
  blended_price_e6: string;
  maker_amount_e6: string;
  taker_amount_e6: string;
  total_required_e6: string;
}

export interface ComboRfqWsSignedOrderPayload {
  salt: string;
  maker: string;
  signer: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  side: "BUY" | "SELL" | 0 | 1;
  signatureType: number;
  metadata: string;
  builder: string;
  timestamp: string;
  expiration?: string;
  signature: string;
}

export type ComboRfqWsClientMessage =
  | {
      type: "auth";
      auth: ComboRfqWsAuthPayload["auth"];
      identity: ComboRfqWsAuthPayload["identity"];
    }
  | {
      type: "RFQ_CREATE";
      leg_position_ids: string[];
      direction: "BUY" | "SELL";
      side: "YES";
      requested_size: ComboRfqWsRequestedSize;
    }
  | {
      type: "RFQ_ACCEPT";
      rfq_id: string;
      quote_id: string;
      signed_order: ComboRfqWsSignedOrderPayload;
    };

export type ComboRfqWsServerMessage =
  | {
      type: "auth";
      success: boolean;
      address?: string;
      error?: string;
    }
  | {
      type: "ACK_RFQ_CREATE";
      request: ComboRfqWsRequestPayload;
      status: string;
    }
  | {
      type: "RFQ_STATUS_UPDATE";
      rfq_id: string;
      status: string;
      code?: string;
    }
  | {
      type: "RFQ_QUOTE_READY";
      request: ComboRfqWsRequestPayload;
      quote: ComboRfqWsQuotePayload;
    }
  | {
      type: "ACK_RFQ_ACCEPT";
      rfq_id: string;
      quote: ComboRfqWsQuotePayload;
    }
  | {
      type: "RFQ_EXECUTION_UPDATE";
      rfq_id: string;
      status: string;
      tx_hash?: string;
    }
  | {
      type: "RFQ_ERROR";
      request_type?: string;
      rfq_id?: string;
      quote_id?: string;
      code?: string;
      error?: string;
    };
