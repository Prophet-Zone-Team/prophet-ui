"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { RightArrowIcon } from "@/components/icons";
import { LogoutIcon, PortfolioIcon } from "@/layout/header/wallet-menu-icons";
import {
  walletMenuDropdownClass,
  walletMenuItemClass,
  walletMenuLogoutClass
} from "@/layout/header/wallet-menu-ui";
import { clearCopyTradeSession } from "@/lib/copy-trade/copy-trade-session";
import type { CopyWallet } from "@/types/copy-trade-api";

import {
  CopyTradeWalletIdentity
} from "./copy-trade-wallet-identity";

const MENU_DROPDOWN_TRANSITION = {
  type: "spring" as const,
  stiffness: 480,
  damping: 34,
  mass: 0.85
};

export interface ProfileHeaderProps {
  copyWallet: CopyWallet;
}

function ProfileHeaderMenu({
  depositAddress,
  onClose,
  onLogout
}: {
  depositAddress: string;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
}) {
  const t = useTranslations("wallet");

  return (
    <motion.div
      className={walletMenuDropdownClass}
      role="menu"
      initial={{ opacity: 0, scaleY: 0.88, y: -6 }}
      animate={{ opacity: 1, scaleY: 1, y: 0 }}
      exit={{ opacity: 0, scaleY: 0.88, y: -6 }}
      transition={MENU_DROPDOWN_TRANSITION}
      style={{ transformOrigin: "top right" }}
    >
      <div className="mb-2 border-b border-prophet-line pb-3">
        <CopyTradeWalletIdentity address={depositAddress} size="sm" />
      </div>

      <Link
        href="/smart-money/portfolio"
        role="menuitem"
        className={walletMenuItemClass}
        onClick={onClose}
      >
        <div className="flex items-center gap-2">
          <div className="w-[14px]">
            <PortfolioIcon />
          </div>
          <span className="flex-1">{t("portfolio")}</span>
        </div>
        <RightArrowIcon />
      </Link>

      <button
        type="button"
        role="menuitem"
        className={walletMenuLogoutClass}
        onClick={() => void onLogout()}
      >
        <LogoutIcon />
        <span>{t("logout")}</span>
      </button>
    </motion.div>
  );
}

export function ProfileHeader({ copyWallet }: ProfileHeaderProps) {
  const depositAddress = copyWallet.BridgeEVMDepositAddress;
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }

      if (
        target instanceof Element &&
        target.closest("[data-polymarket-address-copy-dialog]")
      ) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const handleLogout = useCallback(() => {
    void clearCopyTradeSession();
    setIsOpen(false);
  }, []);

  return (
    <div ref={menuRef} className="relative flex items-center gap-3">
      <CopyTradeWalletIdentity
        address={depositAddress}
        size="sm"
        className="min-w-0 flex-1"
        trailing={
          <button
            type="button"
            className="ml-auto inline-flex shrink-0 items-center justify-center p-1 text-[#909090] transition-opacity hover:opacity-70"
            aria-label="More options"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            <MoreHorizontal className="size-4" strokeWidth={2} />
          </button>
        }
      />

      <AnimatePresence>
        {isOpen ? (
          <ProfileHeaderMenu
            key="profile-header-menu"
            depositAddress={depositAddress}
            onClose={() => setIsOpen(false)}
            onLogout={handleLogout}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
