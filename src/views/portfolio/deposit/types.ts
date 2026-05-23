export type DepositStep = "entry" | "tokens" | "amount" | "confirm";

export interface DepositTokenOption {
  id: string;
  symbol: string;
  chainLabel: string;
  balance: number;
  balanceUsd: number;
  unsupported?: boolean;
}

export interface DepositFlowState {
  step: DepositStep;
  selectedToken: DepositTokenOption | undefined;
  amount: number;
}

/** Reserved for a future phase when wiring real bridge execution. */
export interface DepositExecuteContext {
  token: DepositTokenOption;
  amount: number;
  walletAddress: string;
}
