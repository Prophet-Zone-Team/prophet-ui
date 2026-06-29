"use client";

import { CopyIcon } from "@/components/icons";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import { cn } from "@/lib/cn";
import {
  formatTeamDetailMoney,
  formatShortWallet
} from "@/lib/team/detail-format";
import { getWalletAvatarGradient } from "@/lib/wallet/avatar-gradient";
import type { CopyTarget } from "@/types/copy-trade-api";

import { copyTradeCopiedWalletRowGridClass } from "./grid";

export interface CopyTradeCopiedWalletItemProps {
  target: CopyTarget;
  onManage?: (target: CopyTarget) => void;
  className?: string;
}

function TraderAvatar({ wallet }: { wallet: string }) {
  return (
    <div
      className="size-9 shrink-0 rounded-full"
      style={{ background: getWalletAvatarGradient(wallet) }}
      aria-hidden="true"
    />
  );
}

export function CopyTradeCopiedWalletItem({
  target,
  onManage,
  className
}: CopyTradeCopiedWalletItemProps) {
  const { copy } = useCopyWithToast();
  const walletLabel = formatShortWallet(target.Wallet);

  return (
    <article
      className={cn(
        "box-border h-[74px] rounded-xl border border-[#EBEBEB] bg-white px-4",
        copyTradeCopiedWalletRowGridClass,
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <TraderAvatar wallet={target.Wallet} />
        <div className="min-w-0">
          <p className="truncate text-[16px] leading-5 text-black">
            {walletLabel}
          </p>
          <div className="mt-px flex min-w-0 items-center gap-1">
            <span className="truncate text-[12px] leading-[15px] text-[#909090]">
              Used {formatTeamDetailMoney(target.UsedUSDTotal)}
            </span>
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center p-0.5 text-[#909090] transition-opacity hover:opacity-70"
              aria-label="Copy wallet address"
              onClick={() => void copy(target.Wallet)}
            >
              <CopyIcon />
            </button>
          </div>
        </div>
      </div>

      <span className="text-[16px] leading-5 text-black tabular-nums">
        {formatTeamDetailMoney(target.MaxUSDTotal)}
      </span>
      <span className="text-[16px] leading-5 text-[#909090] tabular-nums">
        —
      </span>
      <span
        className={cn(
          "text-[16px] leading-5 tabular-nums",
          target.Enabled ? "text-[#65AF14]" : "text-[#909090]"
        )}
      >
        {target.Enabled ? "Active" : "Paused"}
      </span>

      <button
        type="button"
        className={cn(
          "inline-flex h-10 w-[84px] shrink-0 items-center justify-center rounded-lg",
          "border border-[#909090] bg-white text-[16px] leading-5 text-black transition-opacity hover:opacity-90"
        )}
        onClick={() => onManage?.(target)}
      >
        Manage
      </button>
    </article>
  );
}
