import { describe, expect, it } from "vitest";

import { mapRfqWsQuoteReadyToSnapshot } from "@/lib/combo/map-rfq-ws-quote";

describe("mapRfqWsQuoteReadyToSnapshot", () => {
  it("maps BUY RFQ_QUOTE_READY payload into ComboQuoteSnapshot", () => {
    const snapshot = mapRfqWsQuoteReadyToSnapshot({
      receivedAt: 1_000,
      request: {
        rfq_id: "rfq-9600c54ea61c5190cb91097c",
        leg_position_ids: ["leg-a", "leg-b"],
        yes_position_id: "yes-position",
        direction: "BUY",
        side: "YES",
        requested_size: {
          unit: "notional",
          value_e6: "1000000",
        },
      },
      quote: {
        quote_id: "quote-id",
        blended_price_e6: "255001",
        maker_amount_e6: "1009902",
        taker_amount_e6: "3921536",
        total_required_e6: "1022335",
      },
    });

    expect(snapshot.direction).toBe("BUY");
    expect(snapshot.rfqId).toBe("rfq-9600c54ea61c5190cb91097c");
    expect(snapshot.shares).toBeCloseTo(3.921536);
    expect(snapshot.estimatedToWin).toBeCloseTo(3.921536);
    expect(snapshot.expiresAt).toBe(1_000 + 10_000);
  });

  it("maps SELL RFQ_QUOTE_READY payload for cashout", () => {
    const snapshot = mapRfqWsQuoteReadyToSnapshot({
      request: {
        rfq_id: "rfq-a256327a9f7655135a8cdafd",
        leg_position_ids: ["leg-a", "leg-b"],
        yes_position_id: "1794930601635919047189039602566660291379505824272246832367393048367051309056",
        direction: "SELL",
        side: "YES",
        requested_size: {
          unit: "shares",
          value_e6: "2941176",
        },
      },
      quote: {
        quote_id: "5a89bc00cc1cb1b0eeee5fdccedbabda906c0c20112da73064859124d6906122",
        blended_price_e6: "325847",
        maker_amount_e6: "2941176",
        taker_amount_e6: "958373",
        total_required_e6: "2941176",
      },
    });

    expect(snapshot.direction).toBe("SELL");
    expect(snapshot.shares).toBeCloseTo(2.941176);
    expect(snapshot.notionalUsd).toBeCloseTo(0.958373);
    expect(snapshot.estimatedToWin).toBeCloseTo(0.958373);
  });
});
