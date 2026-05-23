/** Reserved for a future phase when wiring real bridge withdrawal. */
export interface WithdrawExecuteContext {
  amount: number;
  toChainId: string;
  toTokenAddress: string;
  recipientAddr: string;
}
