"use client";

import { prepareBroadcastRequest, type walletMessage } from "@defuse-protocol/internal-utils";
import { messageFactory } from "@defuse-protocol/internal-utils";
import { base64, base64urlnopad } from "@scure/base";

type Nep413Payload = { message: string; recipient: string; nonce: string; callbackUrl?: string };

const placeholderNep413: walletMessage.NEP413Message = {
  message: "",
  recipient: "",
  nonce: new Uint8Array(32),
};
const placeholderErc191: walletMessage.ERC191Message = { message: "" };
const placeholderSolana: walletMessage.SolanaMessage = { message: new Uint8Array() };
const placeholderStellar: walletMessage.StellarMessage = { message: "" };
const placeholderTron: walletMessage.TronMessage = { message: "" };
const placeholderTon: walletMessage.TonConnectMessage = {
  message: { type: "text", text: "" },
};
const placeholderWebAuthn: walletMessage.WebAuthnMessage = {
  challenge: new Uint8Array(),
  payload: "",
  parsedPayload: {
    deadline: "",
    intents: [],
    signer_id: "",
    nonce: "",
    verifying_contract: "",
  },
};

const str2bytes = (value: string) => new TextEncoder().encode(value);

function b64ToBytes(value: string) {
  try {
    return base64.decode(value);
  } catch {
    return base64urlnopad.decode(value);
  }
}

export function wrapPayloadAsWalletMessage(payload: {
  standard: string;
  payload: string | unknown;
}): walletMessage.WalletMessage {
  const empty = {
    ERC191: placeholderErc191,
    NEP413: placeholderNep413,
    SOLANA: placeholderSolana,
    STELLAR: placeholderStellar,
    WEBAUTHN: placeholderWebAuthn,
    TON_CONNECT: placeholderTon,
    TRON: placeholderTron,
  };

  switch (payload.standard) {
    case "erc191":
      return { ...empty, ERC191: { message: String(payload.payload) } };
    case "nep413": {
      const nep413 = payload.payload as Nep413Payload;
      return {
        ...empty,
        NEP413: {
          message: nep413.message,
          recipient: nep413.recipient,
          nonce: b64ToBytes(nep413.nonce),
          callbackUrl: nep413.callbackUrl ?? undefined,
        },
      };
    }
    case "raw_ed25519":
      return { ...empty, SOLANA: { message: str2bytes(String(payload.payload)) } };
    case "sep53":
      return { ...empty, STELLAR: { message: String(payload.payload) } };
    case "webauthn":
      return {
        ...empty,
        WEBAUTHN: {
          challenge: messageFactory.makeChallenge(str2bytes(String(payload.payload))),
          payload: String(payload.payload),
          parsedPayload: JSON.parse(String(payload.payload)),
        },
      };
    case "ton_connect": {
      const tonPayload = payload.payload as unknown;
      const message =
        typeof tonPayload === "object" &&
        tonPayload !== null &&
        "text" in tonPayload &&
        typeof (tonPayload as { text: unknown }).text === "string"
          ? { type: "text" as const, text: (tonPayload as { text: string }).text }
          : { type: "text" as const, text: JSON.stringify(tonPayload) };

      return { ...empty, TON_CONNECT: { message } };
    }
    case "tip191":
      return { ...empty, TRON: { message: String(payload.payload) } };
    default:
      throw new Error(`Unsupported intent standard: ${payload.standard}`);
  }
}

export function buildErc191SignatureResult(
  signedMessage: walletMessage.ERC191Message,
  signatureHex: string,
): walletMessage.WalletSignatureResult {
  return {
    type: "ERC191",
    signatureData: signatureHex,
    signedData: signedMessage,
  };
}

export function prepareConfidentialSignedData(
  signature: walletMessage.WalletSignatureResult,
  walletAddress: string,
) {
  return prepareBroadcastRequest.prepareSwapSignedData(signature, {
    userAddress: walletAddress,
    userChainType: "evm",
  });
}

export function pickErc191Message(message: walletMessage.WalletMessage) {
  return message.ERC191.message;
}
