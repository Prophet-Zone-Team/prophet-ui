export const PRIVATE_TOPUP_MODAL_WIDTH = "w-[500px]" as const;

export const PRIVATE_BALANCE_REFRESH_MS = 800;

export const PRIVATE_MODE_STEPS = [
  {
    step: 1,
    title: "Use a clean wallet",
    description:
      "Avoid connecting a wallet that has direct activity with exchange accounts or publicly known addresses. For stronger privacy, create a fresh EVM wallet for Prophet.",
  },
  {
    step: 2,
    title: "Top up Balance",
    description:
      "Deposit funds into your Private Balance from any funding wallet or exchange account.",
  },
  {
    step: 3,
    title: "Withdraw only what you need",
    description:
      "Move only the amount you want to use from Private Balance to your connected wallet.",
  },
  {
    step: 4,
    title: "Trade privately",
    description:
      "Place bids through your connected wallet without publicly revealing the source of your funds.",
  },
] as const;

export { STABLEFLOW_MAX_SLIPPAGE_PERCENT } from "@/lib/funding/stableflow";
