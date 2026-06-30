"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { WalletAvatar } from "@/layout/header/wallet-avatar";
import {
  walletBalanceLabelClass,
  walletBalanceValueClass,
  walletConnectedBarClass,
  walletDepositButtonClass,
  walletMenuDividerClass,
  walletMenuTriggerClass
} from "@/layout/header/wallet-menu-ui";
import { cn } from "@/lib/cn";
import { useRef } from "react";
import PrivateBalance from "./private-balance";
import { useDarkModeEnabled } from "@/store";

export interface WalletConnectedBarProps {
  polymarketAddress: string;
  balanceDisplay: string;
  isMenuOpen: boolean;
  regionRestricted?: boolean;
  isPrivateMode?: boolean;
  showDepositPendingIndicator?: boolean;
  onDeposit: () => void;
  onPrivateTopup: () => void;
  onPrivateBalanceClick: () => void;
  onToggleMenu: () => void;
}

export function WalletConnectedBar({
  polymarketAddress,
  balanceDisplay,
  isMenuOpen,
  regionRestricted = false,
  onDeposit,
  onPrivateTopup,
  onPrivateBalanceClick,
  onToggleMenu,
  isPrivateMode,
  showDepositPendingIndicator = false,
}: WalletConnectedBarProps) {
  const t = useTranslations("wallet");
  const popoverRef = useRef<any>(null);

  const depositButton = (
    <button
      type="button"
      className={walletDepositButtonClass}
      onClick={() => {
        onDeposit();
        popoverRef.current?.onClose?.();
      }}
    >
      {t("deposit")}
      {showDepositPendingIndicator ? (
        <div
          className="absolute overflow-hidden z-[100] right-0.5 flex justify-center items-center border border-red-500 text-white -top-0.5 size-4 rounded-full bg-[#FF3B30]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-circle-alert-icon lucide-circle-alert"
          >
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>
      ) : null}
    </button>
  );

  if (isPrivateMode) {
    return null;
  }

  return (
    <div className={walletConnectedBarClass}>
      <RegionRestrictedControl restricted={regionRestricted}>
        <PrivateBalance
          onClick={onPrivateBalanceClick}
          className="hidden md:flex"
        />
      </RegionRestrictedControl>
      <div className="hidden md:block h-[31px] w-px shrink-0 bg-prophet-line"></div>
      <Link
        href="/portfolio"
        className="hidden md:flex flex-col justify-center items-end gap-0 cursor-pointer h-[50px] px-2.5 rounded-lg border border-prophet-panel dark:hover:border-white transition-colors hover:border-prophet-line"
        aria-label={t("openPortfolio")}
      >
        <span className={walletBalanceLabelClass}>{t("balance")}</span>
        <span className={walletBalanceValueClass}>${balanceDisplay}</span>
      </Link>

      {regionRestricted ? (
        <RegionRestrictedControl restricted>
          {depositButton}
        </RegionRestrictedControl>
      ) : (
        // <Popover
        //   ref={popoverRef}
        //   placement="BottomRight"
        //   trigger="Hover"
        //   content={
        //     <div className="w-[130px] flex flex-col items-stretch gap-1 py-1 text-prophet-foreground text-sm rounded-xl bg-prophet-panel border border-prophet-line shadow-[0_0_10px_0_rgba(0,0,0,0.10)]">
        //       <button
        //         type="button"
        //         className="w-full text-left cursor-pointer hover:bg-[#999]/10 duration-150 px-3 py-2"
        //         onClick={() => {
        //           onDeposit();
        //           popoverRef.current?.onClose?.();
        //         }}
        //       >
        //         Deposit
        //       </button>
        //       <button
        //         type="button"
        //         className="w-full text-left cursor-pointer hover:bg-[#999]/10 duration-150 px-3 py-2"
        //         onClick={() => {
        //           onPrivateTopup();
        //           popoverRef.current?.onClose?.();
        //         }}
        //       >
        //         Private Topup
        //       </button>
        //     </div>
        //   }
        // >
        depositButton
        // </Popover>
      )}

      <span className={walletMenuDividerClass} aria-hidden="true" />

      <button
        type="button"
        className={walletMenuTriggerClass}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={onToggleMenu}
      >
        <WalletAvatar address={polymarketAddress} />
        <ChevronIcon open={isMenuOpen} />
      </button>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  const darkModeEnabled = useDarkModeEnabled();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="6"
      viewBox="0 0 12 6"
      fill="none"
      className={cn("transition-transform", open ? "rotate-180" : undefined)}
    >
      <path
        d="M0.5 0.5L5.86828 4.5L11.5 0.5"
        stroke={darkModeEnabled ? "#909090" : "black"}
        strokeLinecap="round"
      />
    </svg>
  );
}
