"use client";

import { useCopyTradeFundingStore } from "@/store/copy-trade-funding-store";
import { CopyTradeDepositDialog } from "@/views/copy-trade/funding/copy-trade-deposit-dialog";
import { CopyTradeWithdrawDialog } from "@/views/copy-trade/funding/copy-trade-withdraw-dialog";

export function CopyTradeFundingHost() {
  const depositOpen = useCopyTradeFundingStore((state) => state.depositOpen);
  const withdrawOpen = useCopyTradeFundingStore((state) => state.withdrawOpen);
  const closeDeposit = useCopyTradeFundingStore((state) => state.closeDeposit);
  const closeWithdraw = useCopyTradeFundingStore(
    (state) => state.closeWithdraw,
  );

  return (
    <>
      <CopyTradeDepositDialog open={depositOpen} onClose={closeDeposit} />
      <CopyTradeWithdrawDialog open={withdrawOpen} onClose={closeWithdraw} />
    </>
  );
}
