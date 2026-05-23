"use client";

import { cn } from "@/lib/cn";

export interface TokenIconProps {
  symbol: string;
  chainLabel?: string;
  size?: "sm" | "md";
  className?: string;
  icon?: string;
  chainIcon?: string;
  dimmed?: boolean;
}

export function TokenIcon({
  symbol,
  chainLabel,
  size = "md",
  className,
  icon,
  chainIcon,
  dimmed = false
}: TokenIconProps) {
  const iconSize = size === "sm" ? "size-[23px] text-[8px]" : "size-[30px] text-[10px]";
  const badgeSize = size === "sm" ? "size-[14px] text-[7px]" : "size-4 text-[8px]";

  return (
    <div className={cn("relative shrink-0", dimmed && "opacity-30", className)}>
      {
        icon ? (
          <img
            src={icon}
            alt={symbol}
            className={cn(iconSize)}
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-full font-[556] text-white",
              iconSize,
              "bg-[#909090]"
            )}
            aria-hidden="true"
          >
            {symbol.slice(0, 1)}
          </div>
        )
      }
      {
        chainIcon ? (
          <img
            src={chainIcon}
            alt={chainLabel}
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-[4px] border border-white font-[556] text-white",
              badgeSize,
            )}
          />
        ) : (
          chainLabel ? (
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-[4px] border border-white font-[556] text-white",
                badgeSize,
                "bg-[#909090]"
              )}
              aria-hidden="true"
            >
              {chainLabel.slice(0, 1)}
            </div>
          ) : null
        )
      }
    </div>
  );
}

export function WalletAvatarIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded bg-black",
        className
      )}
      aria-hidden="true"
    >
      <span className="grid grid-cols-2 gap-0.5 p-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="size-1 rounded-[1px] bg-white" />
        ))}
      </span>
    </div>
  );
}
