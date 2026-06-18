import { fetchJson } from "@/lib/team/client-fetch";
import type {
  ComboQuoteSnapshot,
  ComboRfqAcceptRequest,
  ComboRfqQuoteRequest,
  ComboSubmitResult,
  ComboTicketLeg,
} from "@/types/combo";

export interface ComboRfqClient {
  requestQuote(input: {
    legs: ComboTicketLeg[];
    bidAmountUsd: number;
    signal?: AbortSignal;
  }): Promise<ComboQuoteSnapshot>;

  acceptQuote(input: {
    quote: ComboQuoteSnapshot;
    signedOrder: ComboRfqAcceptRequest["signedOrder"];
    signal?: AbortSignal;
  }): Promise<ComboSubmitResult>;

  pollExecution(input: {
    rfqId: string;
    signal?: AbortSignal;
  }): Promise<ComboSubmitResult>;
}

export const backendComboRfqClient: ComboRfqClient = {
  requestQuote,
  acceptQuote,
  pollExecution,
};

async function requestQuote(input: {
  legs: ComboTicketLeg[];
  bidAmountUsd: number;
  signal?: AbortSignal;
}): Promise<ComboQuoteSnapshot> {
  const payload = await fetchJson<{ quote: ComboQuoteSnapshot }>("/api/combo/rfq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      legs: input.legs.map((leg) => ({
        legPositionId: leg.legPositionId,
        outcomeSide: leg.outcomeSide,
      })),
      bidAmountUsd: input.bidAmountUsd,
    } satisfies ComboRfqQuoteRequest),
    signal: input.signal,
  });

  if (!payload.quote) {
    throw new Error("Combo RFQ quote response was empty.");
  }

  return payload.quote;
}

async function acceptQuote(input: {
  quote: ComboQuoteSnapshot;
  signedOrder: ComboRfqAcceptRequest["signedOrder"];
  signal?: AbortSignal;
}): Promise<ComboSubmitResult> {
  const payload = await fetchJson<{ result: ComboSubmitResult }>("/api/combo/rfq/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rfqId: input.quote.rfqId,
      quoteId: input.quote.quoteId,
      signedOrder: input.signedOrder,
    } satisfies ComboRfqAcceptRequest),
    signal: input.signal,
  });

  if (!payload.result) {
    throw new Error("Combo RFQ accept response was empty.");
  }

  return payload.result;
}

async function pollExecution(input: {
  rfqId: string;
  signal?: AbortSignal;
}): Promise<ComboSubmitResult> {
  const params = new URLSearchParams({ rfqId: input.rfqId });
  const payload = await fetchJson<{ result: ComboSubmitResult }>(
    `/api/combo/rfq?${params.toString()}`,
    { signal: input.signal },
  );

  if (!payload.result) {
    throw new Error("Combo RFQ execution response was empty.");
  }

  return payload.result;
}
