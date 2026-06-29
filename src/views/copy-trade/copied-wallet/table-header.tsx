import { cn } from "@/lib/cn";

import { copyTradeCopiedWalletRowGridClass } from "./grid";

export interface CopyTradeCopiedWalletTableHeaderProps {
  className?: string;
}

export function CopyTradeCopiedWalletTableHeader({
  className
}: CopyTradeCopiedWalletTableHeaderProps) {
  return (
    <div
      role="row"
      className={cn(
        copyTradeCopiedWalletRowGridClass,
        "px-4 text-[14px] font-[400] leading-[17px] text-[#909090]",
        className
      )}
    >
      <span role="columnheader">Trader</span>
      <span role="columnheader">Investment</span>
      <span role="columnheader">PnL</span>
      <span role="columnheader">Status</span>
      <span role="columnheader" className="sr-only">
        Action
      </span>
    </div>
  );
}
