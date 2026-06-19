import {
  estimateMultiplierFromBlendedPrice,
  parseE6Value,
  toE6String,
} from "@/lib/combo/estimate-preview";
import { REQUESTER_ACCEPT_WINDOW_MS } from "@/lib/combo/rfq-timing";
import type {
  ComboRfqWsQuotePayload,
  ComboRfqWsRequestPayload,
} from "@/types/combo-rfq-ws";
import type { ComboQuoteSnapshot, ComboRfqDirection } from "@/types/combo";

export function buildComboRfqParamsFingerprint(input: {
  legPositionIds: string[];
  direction: ComboRfqDirection;
  size: number;
}): string {
  const sortedLegs = [...input.legPositionIds].sort();
  const valueE6 = toE6String(input.size);

  return JSON.stringify({
    leg_position_ids: sortedLegs,
    direction: input.direction,
    side: "YES",
    requested_size:
      input.direction === "SELL"
        ? {
            unit: "shares",
            value_e6: valueE6,
          }
        : {
            unit: "notional",
            value_e6: valueE6,
          },
  });
}

export function matchesComboRfqParamsFingerprint(
  request: ComboRfqWsRequestPayload,
  fingerprint: string,
): boolean {
  const direction = request.direction ?? "BUY";
  const size = parseE6Value(request.requested_size.value_e6);

  return (
    buildComboRfqParamsFingerprint({
      legPositionIds: request.leg_position_ids,
      direction,
      size,
    }) === fingerprint
  );
}

export function mapRfqWsQuoteReadyToSnapshot(input: {
  request: ComboRfqWsRequestPayload;
  quote: ComboRfqWsQuotePayload;
  receivedAt?: number;
}): ComboQuoteSnapshot {
  const { request, quote } = input;
  const direction = request.direction ?? "BUY";
  const rfqId = request.rfq_id;
  const quoteId = quote.quote_id;
  const yesPositionId = request.yes_position_id;
  const blendedPrice = parseE6Value(quote.blended_price_e6);
  const makerAmount = parseE6Value(quote.maker_amount_e6);
  const takerAmount = parseE6Value(quote.taker_amount_e6);

  const shares = direction === "SELL" ? makerAmount : takerAmount;
  const notionalUsd = direction === "SELL" ? takerAmount : makerAmount;
  const estimatedToWin = direction === "SELL" ? takerAmount : shares;

  if (!rfqId || !quoteId || !yesPositionId || blendedPrice <= 0 || shares <= 0) {
    throw new Error("Combo RFQ WebSocket returned an incomplete executable quote.");
  }

  const receivedAt = input.receivedAt ?? Date.now();

  return {
    rfqId,
    quoteId,
    status: "AWAITING_REQUESTER_ACCEPTANCE",
    direction,
    blendedPrice,
    shares,
    notionalUsd,
    multiplier: estimateMultiplierFromBlendedPrice(blendedPrice),
    estimatedToWin,
    yesPositionId,
    legPositionIds: request.leg_position_ids,
    expiresAt: receivedAt + REQUESTER_ACCEPT_WINDOW_MS,
    makerAmountBaseUnits: quote.maker_amount_e6,
    takerAmountBaseUnits: quote.taker_amount_e6,
    totalRequiredBaseUnits: quote.total_required_e6,
  };
}
