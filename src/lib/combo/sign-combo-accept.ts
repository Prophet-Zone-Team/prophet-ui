"use client";

import type { Hex } from "viem";
import { encodeAbiParameters, keccak256, toHex } from "viem";

import { signTypedData } from "@/lib/trading/wallet-typed-data-sign";
import type {
  ComboExchangeV3Order,
  ComboQuoteSnapshot,
  SignedComboAcceptOrder,
} from "@/types/combo";

const POLYGON_CHAIN_ID = 137;
const BYTES32_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
const COMBO_EXCHANGE_V3 = "0xe3333700ca9d93003f00f0f71f8515005f6c00aa" as const;
const CTF_EXCHANGE_V3_DOMAIN_NAME = "Polymarket CTF Exchange";
const CTF_EXCHANGE_V3_DOMAIN_VERSION = "3";
const SIGNATURE_TYPE_POLY_1271 = 3;
const ORDER_TYPE_STRING =
  "Order(uint256 salt,address maker,address signer,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint8 side,uint8 signatureType,uint256 timestamp,bytes32 metadata,bytes32 builder)";
const ORDER_TYPE_HASH = keccak256(toHex(ORDER_TYPE_STRING));
const DOMAIN_TYPE_HASH = keccak256(toHex("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));
const CTF_EXCHANGE_NAME_HASH = keccak256(toHex(CTF_EXCHANGE_V3_DOMAIN_NAME));
const CTF_EXCHANGE_VERSION_HASH = keccak256(toHex(CTF_EXCHANGE_V3_DOMAIN_VERSION));

const TYPED_DATA_SIGN_TYPES = {
  TypedDataSign: [
    { name: "contents", type: "Order" },
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
    { name: "salt", type: "bytes32" },
  ],
  Order: [
    { name: "salt", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "signer", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "side", type: "uint8" },
    { name: "signatureType", type: "uint8" },
    { name: "timestamp", type: "uint256" },
    { name: "metadata", type: "bytes32" },
    { name: "builder", type: "bytes32" },
  ],
} as const;

export async function signComboAcceptOrder(input: {
  quote: ComboQuoteSnapshot;
  walletAddress: string;
  funderAddress: string;
}): Promise<SignedComboAcceptOrder> {
  const exchangeOrder = buildComboExchangeOrder({
    quote: input.quote,
    funderAddress: input.funderAddress,
  });
  const walletTypedData = buildComboWalletTypedData(exchangeOrder);
  const rawSignature = (await signTypedData(
    input.walletAddress,
    walletTypedData,
  )) as Hex;
  const wrappedSignature = finalizePoly1271Signature({
    signature: rawSignature,
    order: exchangeOrder,
  });

  return {
    rfqId: input.quote.rfqId,
    quoteId: input.quote.quoteId,
    signedOrder: {
      ...exchangeOrder,
      signature: wrappedSignature,
    },
  };
}

function buildComboExchangeOrder(input: {
  quote: ComboQuoteSnapshot;
  funderAddress: string;
}): ComboExchangeV3Order {
  return {
    salt: createSalt(),
    maker: input.funderAddress,
    signer: input.funderAddress,
    tokenId: input.quote.yesPositionId,
    makerAmount: input.quote.makerAmountBaseUnits,
    takerAmount: input.quote.takerAmountBaseUnits,
    side: 0,
    signatureType: SIGNATURE_TYPE_POLY_1271,
    timestamp: Date.now().toString(),
    metadata: BYTES32_ZERO,
    builder: BYTES32_ZERO,
    signature: "",
  };
}

function buildComboWalletTypedData(order: ComboExchangeV3Order) {
  return {
    domain: {
      name: CTF_EXCHANGE_V3_DOMAIN_NAME,
      version: CTF_EXCHANGE_V3_DOMAIN_VERSION,
      chainId: POLYGON_CHAIN_ID,
      verifyingContract: COMBO_EXCHANGE_V3,
    },
    types: TYPED_DATA_SIGN_TYPES,
    primaryType: "TypedDataSign" as const,
    message: {
      contents: {
        salt: order.salt,
        maker: order.maker,
        signer: order.signer,
        tokenId: order.tokenId,
        makerAmount: order.makerAmount,
        takerAmount: order.takerAmount,
        side: order.side,
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
    },
  };
}

function createOrderContentsHash(order: ComboExchangeV3Order) {
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
        order.side,
        order.signatureType,
        BigInt(order.timestamp),
        order.metadata as `0x${string}`,
        order.builder as `0x${string}`,
      ],
    ),
  );
}

function finalizePoly1271Signature({
  signature,
  order,
}: {
  signature: Hex;
  order: ComboExchangeV3Order;
}): Hex {
  const appDomainSeparator = keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        DOMAIN_TYPE_HASH,
        CTF_EXCHANGE_NAME_HASH,
        CTF_EXCHANGE_VERSION_HASH,
        BigInt(POLYGON_CHAIN_ID),
        COMBO_EXCHANGE_V3,
      ],
    ),
  );
  const contentsHash = createOrderContentsHash(order);
  const orderTypeStringHex = toHex(ORDER_TYPE_STRING).slice(2);
  const lengthHex = (186).toString(16).padStart(4, "0");

  return `0x${signature.slice(2)}${appDomainSeparator.slice(2)}${contentsHash.slice(2)}${orderTypeStringHex}${lengthHex}`;
}

function createSalt() {
  const entropy = new Uint32Array(1);
  crypto.getRandomValues(entropy);
  const random = entropy[0] / 0xffffffff;

  return Math.max(1, Math.round(random * Date.now())).toString();
}
