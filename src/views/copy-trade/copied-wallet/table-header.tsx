import { cn } from "@/lib/cn";

import {
  copyTradeCopiedWalletColActionClass,
  copyTradeCopiedWalletColDataClass,
  copyTradeCopiedWalletColWalletClass,
  copyTradeCopiedWalletGridStyle,
  copyTradeCopiedWalletRowGridClass
} from "./grid";

export interface CopyTradeCopiedWalletTableHeaderProps {
  className?: string;
}

export function CopyTradeCopiedWalletTableHeader({
  className
}: CopyTradeCopiedWalletTableHeaderProps) {
  return (
    <div
      role="row"
      style={copyTradeCopiedWalletGridStyle}
      className={cn(
        copyTradeCopiedWalletRowGridClass,
        "px-4 text-[14px] font-[400] leading-[17px] text-[#909090]",
        className
      )}
    >
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColWalletClass}
      >
        Copied/Wallet
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        Total Buy
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        Total Sell
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        Buy/Sell
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        PnL
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColDataClass}
      >
        Last trade
      </span>
      <span
        role="columnheader"
        className={copyTradeCopiedWalletColActionClass}
      >
        Action
      </span>
    </div>
  );
}
