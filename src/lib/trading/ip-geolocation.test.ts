import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isPrivateOrLocalIp,
  parseIpWhoResponse,
} from "@/lib/trading/ip-geolocation";

describe("isPrivateOrLocalIp", () => {
  it("detects local and private IPv4 addresses", () => {
    assert.equal(isPrivateOrLocalIp("127.0.0.1"), true);
    assert.equal(isPrivateOrLocalIp("10.0.0.8"), true);
    assert.equal(isPrivateOrLocalIp("192.168.1.4"), true);
    assert.equal(isPrivateOrLocalIp("8.8.8.8"), false);
  });
});

describe("parseIpWhoResponse", () => {
  it("maps ipwho.is country and region codes", () => {
    const result = parseIpWhoResponse({
      success: true,
      country_code: "US",
      region_code: "NY",
    });

    assert.deepEqual(result, { country: "US", region: "NY" });
  });

  it("returns undefined for failed lookups", () => {
    assert.equal(parseIpWhoResponse({ success: false }), undefined);
  });
});
