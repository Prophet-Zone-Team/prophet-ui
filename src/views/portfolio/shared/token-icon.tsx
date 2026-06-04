"use client";

import LazyImage from "@/components/lazy-image";
import { getStoredTradingWalletInfo } from "@/components/trading/trading-wallet-session";
import { cn } from "@/lib/cn";
import { getWalletAvatarGradient } from "@/lib/wallet/avatar-gradient";

export interface TokenIconProps {
  symbol: string;
  chainLabel?: string;
  size?: "sm" | "md";
  className?: string;
  icon?: string;
  chainIcon?: string;
  dimmed?: boolean;
  chainOnly?: boolean;
}

export function TokenIcon({
  symbol,
  chainLabel,
  size = "md",
  className,
  icon,
  chainIcon,
  dimmed = false,
  chainOnly = false,
}: TokenIconProps) {
  const iconSize = size === "sm" ? "size-[23px] text-[8px]" : "size-[30px] text-[10px]";
  const badgeSize = size === "sm" ? "size-[14px] text-[7px]" : "size-4 text-[8px]";

  if (chainOnly) {
    return (
      <div
        className={cn("relative shrink-0", dimmed && "opacity-30", className)}
      >
        {chainIcon ? (
          <LazyImage
            src={chainIcon}
            alt={chainLabel}
            containerClassName={cn(
              "rounded-[4px] border border-white font-[500] text-white",
              iconSize
            )}
            width={size === "sm" ? 23 : 30}
            height={size === "sm" ? 23 : 30}
          />
        ) : chainLabel ? (
          <div
            className={cn(
              "rounded-[4px] border border-white font-[500] text-white",
              iconSize,
              "bg-[#909090]"
            )}
            aria-hidden="true"
          >
            {chainLabel.slice(0, 1)}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0", dimmed && "opacity-30", className)}>
      {icon ? (
        <LazyImage
          src={icon}
          alt={symbol}
          containerClassName={cn(iconSize)}
          width={size === "sm" ? 23 : 30}
          height={size === "sm" ? 23 : 30}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full font-[500] text-white",
            iconSize,
            "bg-[#909090]"
          )}
          aria-hidden="true"
        >
          {symbol.slice(0, 1)}
        </div>
      )}
      {chainIcon ? (
        <LazyImage
          src={chainIcon}
          alt={chainLabel}
          containerClassName={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-[4px] border border-white font-[500] text-white",
            badgeSize
          )}
          containerStyle={{
            position: "absolute"
          }}
          width={size === "sm" ? 14 : 16}
          height={size === "sm" ? 14 : 16}
        />
      ) : chainLabel ? (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-[4px] border border-white font-[500] text-white",
            badgeSize,
            "bg-[#909090]"
          )}
          aria-hidden="true"
        >
          {chainLabel.slice(0, 1)}
        </div>
      ) : null}
    </div>
  );
}

export function WalletAvatarIcon({ className, address }: { className?: string; address?: string; }) {
  const walletKind = getStoredTradingWalletInfo(address);

  if (walletKind.logo) {
    return (
      <img
        src={walletKind.logo}
        alt=""
        className={cn(
          "size-5 shrink-0 rounded object-center object-contain",
          className
        )}
      />
    );
  }

  const gradient = address ? getWalletAvatarGradient(address) : "radial-gradient(100% 100% at 50% 0%, #FF6BBA 0%, #4DA0FF 65.38%, #59FFA1 100%)";

  return (
    <div
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded",
        className
      )}
      style={{ background: gradient }}
    >

    </div>
  );
}
