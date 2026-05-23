import { encodeAbiParameters, keccak256, parseUnits, recoverTypedDataAddress, toHex } from "viem";
import type { Hex, TypedDataDomain, TypedDataParameter } from "viem";

import type { BidTradeSide, TradingOrderType } from "../../types/market";
import type { BidOrderPreview } from "./polymarket-order";

type SupportedOrderType = TradingOrderType;

const BYTES32_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
const CTF_EXCHANGE_V2_DOMAIN_NAME = "Polymarket CTF Exchange";
const CTF_EXCHANGE_V2_DOMAIN_VERSION = "2";
const POLYGON_CHAIN_ID = 137;
const EXCHANGE_V2 = "0xE111180000d2663C0091e4f400237545B87B996B";
const NEG_RISK_EXCHANGE_V2 = "0xe2222d279d744050d28e00520010520000310F59";
const ORDER_TYPE_STRING =
  "Order(uint256 salt,address maker,address signer,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint8 side,uint8 signatureType,uint256 timestamp,bytes32 metadata,bytes32 builder)";
const ORDER_TYPE_HASH = keccak256(toHex(ORDER_TYPE_STRING));
const DOMAIN_TYPE_HASH = keccak256(toHex("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));
const CTF_EXCHANGE_NAME_HASH = keccak256(toHex(CTF_EXCHANGE_V2_DOMAIN_NAME));
const CTF_EXCHANGE_VERSION_HASH = keccak256(toHex(CTF_EXCHANGE_V2_DOMAIN_VERSION));
const SIGNATURE_TYPE_POLY_1271 = 3;
const CONDITIONAL_TOKEN_DECIMALS = 6;

export interface UserOrderSignablePayload {
  order: {
    salt: string;
    maker: string;
    signer: string;
    taker: string;
    tokenId: string;
    makerAmount: string;
    takerAmount: string;
    side: string;
    signatureType: number;
    timestamp: string;
    expiration: string;
    metadata: Hex;
    builder: Hex;
  };
  domain: TypedDataDomain;
  types: Record<string, TypedDataParameter[]>;
  primaryType: "TypedDataSign";
  message: Record<string, unknown>;
  orderType: SupportedOrderType;
  postOnly: boolean;
  deferExec: boolean;
}

export interface SignedUserOrderPayload {
  order: UserOrderSignablePayload["order"] & {
    signature: Hex;
  };
  orderType: SupportedOrderType;
  postOnly: boolean;
  deferExec: boolean;
}

export function buildUserOrderSignablePayload({
  preview,
  walletAddress,
  funderAddress,
  orderType,
  builderCode,
}: {
  preview: BidOrderPreview;
  walletAddress: string;
  funderAddress: string;
  orderType: SupportedOrderType;
  builderCode?: string;
}): UserOrderSignablePayload {
  const verifyingContract = preview.negRisk ? NEG_RISK_EXCHANGE_V2 : EXCHANGE_V2;
  const order = buildOrder({
    preview,
    walletAddress,
    funderAddress,
    builderCode,
  });
  const domain = {
    name: CTF_EXCHANGE_V2_DOMAIN_NAME,
    version: CTF_EXCHANGE_V2_DOMAIN_VERSION,
    chainId: POLYGON_CHAIN_ID,
    verifyingContract: verifyingContract as `0x${string}`,
  };
  const message = {
    contents: {
      salt: order.salt,
      maker: order.maker,
      signer: order.signer,
      tokenId: order.tokenId,
      makerAmount: order.makerAmount,
      takerAmount: order.takerAmount,
      side: order.side === "BUY" ? 0 : 1,
      signatureType: order.signatureType,
      timestamp: order.timestamp,
      metadata: order.metadata,
      builder: order.builder,
    },
    name: "DepositWallet",
    version: "1",
    chainId: POLYGON_CHAIN_ID,
    verifyingContract: order.signer,
    salt: BYTES32_ZERO,
  };

  return {
    order,
    domain,
    types: {
      EIP712Domain: [
        {
          name: "name",
          type: "string",
        },
        {
          name: "version",
          type: "string",
        },
        {
          name: "chainId",
          type: "uint256",
        },
        {
          name: "verifyingContract",
          type: "address",
        },
      ],
      TypedDataSign: [
        {
          name: "contents",
          type: "Order",
        },
        {
          name: "name",
          type: "string",
        },
        {
          name: "version",
          type: "string",
        },
        {
          name: "chainId",
          type: "uint256",
        },
        {
          name: "verifyingContract",
          type: "address",
        },
        {
          name: "salt",
          type: "bytes32",
        },
      ],
      Order: [
        {
          name: "salt",
          type: "uint256",
        },
        {
          name: "maker",
          type: "address",
        },
        {
          name: "signer",
          type: "address",
        },
        {
          name: "tokenId",
          type: "uint256",
        },
        {
          name: "makerAmount",
          type: "uint256",
        },
        {
          name: "takerAmount",
          type: "uint256",
        },
        {
          name: "side",
          type: "uint8",
        },
        {
          name: "signatureType",
          type: "uint8",
        },
        {
          name: "timestamp",
          type: "uint256",
        },
        {
          name: "metadata",
          type: "bytes32",
        },
        {
          name: "builder",
          type: "bytes32",
        },
      ],
    },
    primaryType: "TypedDataSign",
    message,
    orderType,
    postOnly: false,
    deferExec: false,
  };
}

export function attachUserOrderSignature({
  signable,
  signature,
}: {
  signable: UserOrderSignablePayload;
  signature: Hex;
}): SignedUserOrderPayload {
  return {
    order: {
      ...signable.order,
      signature: finalizePoly1271Signature({
        signature,
        signable,
      }),
    },
    orderType: signable.orderType,
    postOnly: signable.postOnly,
    deferExec: signable.deferExec,
  };
}

export async function recoverUserOrderSignerAddress({
  signable,
  signature,
}: {
  signable: UserOrderSignablePayload;
  signature: Hex;
}) {
  return recoverTypedDataAddress({
    domain: signable.domain,
    types: signable.types,
    primaryType: signable.primaryType,
    message: signable.message,
    signature,
  });
}

function buildOrder({
  preview,
  walletAddress,
  funderAddress,
  builderCode,
}: {
  preview: BidOrderPreview;
  walletAddress: string;
  funderAddress: string;
  builderCode?: string;
}): UserOrderSignablePayload["order"] {
  const amounts = getRawAmounts({
    tradeSide: preview.tradeSide,
    orderType: preview.orderType,
    amount: preview.estimatedCost,
    size: preview.shareSize,
    price: preview.sidePrice,
    tickSize: preview.tickSize ?? "0.01",
  });

  if (!preview.tokenId) {
    throw new Error("A real Polymarket token ID is required before signing an order.");
  }

  return {
    salt: createSalt(),
    maker: funderAddress,
    signer: funderAddress,
    taker: "0x0000000000000000000000000000000000000000",
    tokenId: preview.tokenId,
    makerAmount: parseUnits(amounts.rawMakerAmount.toString(), CONDITIONAL_TOKEN_DECIMALS).toString(),
    takerAmount: parseUnits(amounts.rawTakerAmount.toString(), CONDITIONAL_TOKEN_DECIMALS).toString(),
    side: preview.tradeSide === "buy" ? "BUY" : "SELL",
    signatureType: SIGNATURE_TYPE_POLY_1271,
    timestamp: Date.now().toString(),
    expiration: "0",
    metadata: BYTES32_ZERO,
    builder: normalizeBuilderCode(builderCode),
  };
}

function createOrderContentsHash(order: UserOrderSignablePayload["order"]) {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint256" },
        { type: "bytes32" },
        { type: "bytes32" },
      ],
      [
        ORDER_TYPE_HASH,
        BigInt(order.salt),
        order.maker as `0x${string}`,
        order.signer as `0x${string}`,
        BigInt(order.tokenId),
        BigInt(order.makerAmount),
        BigInt(order.takerAmount),
        order.side === "BUY" ? 0 : 1,
        order.signatureType,
        BigInt(order.timestamp),
        order.metadata,
        order.builder,
      ],
    ),
  );
}

function finalizePoly1271Signature({
  signature,
  signable,
}: {
  signature: Hex;
  signable: UserOrderSignablePayload;
}): Hex {
  const verifyingContract = signable.domain.verifyingContract;

  if (typeof verifyingContract !== "string") {
    throw new Error("Missing order verifying contract.");
  }

  const appDomainSeparator = keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes32" }, { type: "bytes32" }, { type: "uint256" }, { type: "address" }],
      [
        DOMAIN_TYPE_HASH,
        CTF_EXCHANGE_NAME_HASH,
        CTF_EXCHANGE_VERSION_HASH,
        BigInt(POLYGON_CHAIN_ID),
        verifyingContract as `0x${string}`,
      ],
    ),
  );
  const contentsHash = createOrderContentsHash(signable.order);
  const orderTypeStringHex = toHex(ORDER_TYPE_STRING).slice(2);
  const lengthHex = (186).toString(16).padStart(4, "0");

  return `0x${signature.slice(2)}${appDomainSeparator.slice(2)}${contentsHash.slice(2)}${orderTypeStringHex}${lengthHex}`;
}

function getRawAmounts({
  tradeSide,
  orderType,
  amount,
  size,
  price,
  tickSize,
}: {
  tradeSide: BidTradeSide;
  orderType: SupportedOrderType;
  amount: number;
  size: number;
  price: number;
  tickSize: NonNullable<BidOrderPreview["tickSize"]>;
}) {
  if (orderType === "FAK" || orderType === "FOK") {
    return getMarketRawAmounts(tradeSide, amount, price, tickSize);
  }

  return getLimitRawAmounts(tradeSide, size, price, tickSize);
}

function getLimitRawAmounts(side: BidTradeSide, size: number, price: number, tickSize: NonNullable<BidOrderPreview["tickSize"]>) {
  const config = getRoundingConfig(tickSize);
  const rawPrice = roundNormal(price, config.price);

  if (side === "buy") {
    const rawTakerAmount = roundDown(size, config.size);
    const rawMakerAmount = roundAmount(rawTakerAmount * rawPrice, config.amount);

    return {
      rawMakerAmount,
      rawTakerAmount,
    };
  }

  const rawMakerAmount = roundDown(size, config.size);
  const rawTakerAmount = roundAmount(rawMakerAmount * rawPrice, config.amount);

  return {
    rawMakerAmount,
    rawTakerAmount,
  };
}

function getMarketRawAmounts(side: BidTradeSide, amount: number, price: number, tickSize: NonNullable<BidOrderPreview["tickSize"]>) {
  const config = getRoundingConfig(tickSize);
  const rawPrice = roundDown(price, config.price);
  const rawMakerAmount = roundDown(amount, config.size);
  let rawTakerAmount = side === "buy" ? rawMakerAmount / rawPrice : rawMakerAmount * rawPrice;

  if (decimalPlaces(rawTakerAmount) > config.amount) {
    rawTakerAmount = roundUp(rawTakerAmount, config.amount + 4);

    if (decimalPlaces(rawTakerAmount) > config.amount) {
      rawTakerAmount = roundDown(rawTakerAmount, config.amount);
    }
  }

  return {
    rawMakerAmount,
    rawTakerAmount,
  };
}

function getRoundingConfig(tickSize: NonNullable<BidOrderPreview["tickSize"]>) {
  switch (tickSize) {
    case "0.1":
      return {
        price: 1,
        size: 2,
        amount: 3,
      };
    case "0.001":
      return {
        price: 3,
        size: 2,
        amount: 5,
      };
    case "0.0001":
      return {
        price: 4,
        size: 2,
        amount: 6,
      };
    case "0.01":
    default:
      return {
        price: 2,
        size: 2,
        amount: 4,
      };
  }
}

function roundAmount(value: number, decimals: number) {
  if (decimalPlaces(value) <= decimals) {
    return value;
  }

  const roundedUp = roundUp(value, decimals + 4);

  if (decimalPlaces(roundedUp) <= decimals) {
    return roundedUp;
  }

  return roundDown(roundedUp, decimals);
}

function roundNormal(value: number, decimals: number) {
  if (decimalPlaces(value) <= decimals) {
    return value;
  }

  return Math.round((value + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;
}

function roundDown(value: number, decimals: number) {
  if (decimalPlaces(value) <= decimals) {
    return value;
  }

  return Math.floor(value * 10 ** decimals) / 10 ** decimals;
}

function roundUp(value: number, decimals: number) {
  if (decimalPlaces(value) <= decimals) {
    return value;
  }

  return Math.ceil(value * 10 ** decimals) / 10 ** decimals;
}

function decimalPlaces(value: number) {
  if (Number.isInteger(value)) {
    return 0;
  }

  const parts = value.toString().split(".");

  return parts[1]?.length ?? 0;
}

function normalizeBuilderCode(builderCode: string | undefined): Hex {
  if (builderCode && /^0x[a-fA-F0-9]{64}$/.test(builderCode)) {
    return builderCode as Hex;
  }

  return BYTES32_ZERO;
}

function createSalt() {
  const entropy = new Uint32Array(1);
  crypto.getRandomValues(entropy);
  const random = entropy[0] / 0xffffffff;

  return Math.max(1, Math.round(random * Date.now())).toString();
}
