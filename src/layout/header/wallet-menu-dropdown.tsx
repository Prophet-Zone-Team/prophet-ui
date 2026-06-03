"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  PortfolioIcon,
  LogoutIcon,
  FastBidIcon,
  ReferralIcon
} from "@/layout/header/wallet-menu-icons";
import { CheckIcon, CopyIcon, RightArrowIcon } from "@/components/icons";

import { WalletAvatar } from "@/layout/header/wallet-avatar";
import {
  walletMenuDropdownClass,
  walletMenuItemClass,
  walletMenuLogoutClass
} from "@/layout/header/wallet-menu-ui";
import { formatShortWallet } from "@/lib/team/detail-format";
import {
  DEFAULT_FAST_BID_AMOUNT,
  formatFastBidAmountDisplay,
  useConfigHydrated,
  useFastBidAmount
} from "@/store";

const WALLET_MENU_DROPDOWN_TRANSITION = {
  type: "spring" as const,
  stiffness: 480,
  damping: 34,
  mass: 0.85
};

export interface WalletMenuDropdownProps {
  polymarketAddress: string;
  isPrivateMode?: boolean;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
  onOpenFastBid: () => void;
}

export function WalletMenuDropdown({
  polymarketAddress,
  onClose,
  onLogout,
  onOpenFastBid,
  isPrivateMode,
}: WalletMenuDropdownProps) {
  const [copied, setCopied] = useState(false);
  const fastBidAmount = useFastBidAmount();
  const hasHydrated = useConfigHydrated();
  const fastBidDisplay = formatFastBidAmountDisplay(
    hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT
  );

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
    <motion.div
      className={walletMenuDropdownClass}
      role="menu"
      initial={{ opacity: 0, scaleY: 0.88, y: -6 }}
      animate={{ opacity: 1, scaleY: 1, y: 0 }}
      exit={{ opacity: 0, scaleY: 0.88, y: -6 }}
      transition={WALLET_MENU_DROPDOWN_TRANSITION}
      style={{ transformOrigin: "top right" }}
    >
      <div className="mb-2 flex items-center gap-2 border-b border-prophet-line pb-3">
        <WalletAvatar address={polymarketAddress} />
        <span className="truncate text-[14px] font-[400] leading-[17px] text-black">
          {formatShortWallet(polymarketAddress)}
        </span>
        <button
          type="button"
          onClick={() => void copyAddress()}
          className="shrink-0 border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-black"
          aria-label={copied ? "Copied" : "Copy Polymarket address"}
          title={copied ? "Copied" : "Copy Polymarket address"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>

      {
        !isPrivateMode && (
          <>
            <Link
              href="/portfolio"
              role="menuitem"
              className={walletMenuItemClass}
              onClick={onClose}
            >
              <div className="flex items-center gap-2">
                <div className="w-[14px]">
                  <PortfolioIcon />
                </div>
                <span className="flex-1">Portfolio</span>
              </div>
              <RightArrowIcon />
            </Link>

            <Link
              href="/referral"
              role="menuitem"
              className={walletMenuItemClass}
              onClick={onClose}
            >
              <div className="flex items-center gap-2">
                <div className="w-[14px]">
                  <ReferralIcon />
                </div>
                <span className="flex-1">Referral</span>
              </div>
              <RightArrowIcon />
            </Link>

            <button
              type="button"
              role="menuitem"
              className={walletMenuItemClass}
              onClick={() => {
                onClose();
                onOpenFastBid();
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-[14px]">
                  <FastBidIcon />
                </div>
                <span>Fast Bid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-black">{fastBidDisplay}</span>
                <RightArrowIcon />
              </div>
            </button>
          </>
        )
      }

      <button
        type="button"
        role="menuitem"
        className={walletMenuLogoutClass}
        onClick={() => void onLogout()}
      >
        <LogoutIcon />
        <span>Logout</span>
      </button>
    </motion.div>
  );
}
