"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  PortfolioIcon,
  LogoutIcon,
  FastBidIcon
} from "@/layout/header/wallet-menu-icons";
import { RightArrowIcon, CheckIcon, CopyIcon } from "@/components/icons";

import { WalletAvatar } from "@/layout/header/wallet-avatar";
import {
  walletMenuDropdownClass,
  walletMenuItemClass,
  walletMenuLogoutClass
} from "@/layout/header/wallet-menu-ui";
import { formatShortWallet } from "@/lib/team/detail-format";

export interface WalletMenuDropdownProps {
  polymarketAddress: string;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
}

export function WalletMenuDropdown({
  polymarketAddress,
  onClose,
  onLogout
}: WalletMenuDropdownProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(polymarketAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [polymarketAddress]);

  return (
    <div className={walletMenuDropdownClass} role="menu">
      <div className="mb-2 flex items-center gap-2 border-b border-prophet-line pb-3">
        <WalletAvatar address={polymarketAddress} />
        <span className="min-w-0 truncate text-sm font-[556] leading-[17px] text-black">
          {formatShortWallet(polymarketAddress)}
        </span>
        <button
          type="button"
          onClick={() => void copyAddress()}
          className="ml-auto shrink-0 border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-black"
          aria-label={copied ? "Copied" : "Copy Polymarket address"}
          title={copied ? "Copied" : "Copy Polymarket address"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>

      <Link
        href="/portfolio"
        role="menuitem"
        className={walletMenuItemClass}
        onClick={onClose}
      >
        <PortfolioIcon />
        <span className="flex-1">Portfolio</span>
        <RightArrowIcon />
      </Link>

      <button
        type="button"
        role="menuitem"
        className={walletMenuItemClass}
        onClick={() => {}}
      >
        <span className="flex items-center gap-2">
          <FastBidIcon />
          <span>Fast Bid</span>
        </span>
        <span className="shrink-0">
          <RightArrowIcon />
        </span>
      </button>

      <button
        type="button"
        role="menuitem"
        className={walletMenuLogoutClass}
        onClick={() => void onLogout()}
      >
        <LogoutIcon />
        <span>Logout</span>
      </button>
    </div>
  );
}
