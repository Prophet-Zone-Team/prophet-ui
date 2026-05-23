import type { WithdrawChainOption, WithdrawTokenOption } from "@/views/portfolio/withdraw/types";

export const MOCK_WITHDRAW_MAX_AMOUNT = 23.45;

export const WITHDRAW_CHAIN_OPTIONS: WithdrawChainOption[] = [
  { id: "polygon", label: "Polygon" }
];

export const WITHDRAW_TOKEN_OPTIONS: WithdrawTokenOption[] = [
  { id: "usdc", symbol: "USDC" }
];

export const WITHDRAW_SOURCE_TOKEN_LABEL = "pUSD";

export const WITHDRAW_ESTIMATE_RATE = 0.99;

export const WITHDRAW_MODAL_WIDTH = "w-[500px]";
