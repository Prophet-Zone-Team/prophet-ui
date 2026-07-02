"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  PortfolioIcon,
  LogoutIcon,
  FastBidIcon,
  NotificationIcon,
  ReferralIcon,
  AttentionIcon
} from "@/layout/header/wallet-menu-icons";
import { WalletDarkModeMenuItem } from "@/layout/header/wallet-dark-mode-menu-item";
import { WalletLanguageMenuItem } from "@/layout/header/wallet-language-menu-item";
import { WalletOutcomeDisplayMenuItem } from "@/layout/header/wallet-outcome-display-menu-item";
import { CopyIcon, RightArrowIcon } from "@/components/icons";
import { PolymarketAddressCopyButton } from "@/components/trading/polymarket-address-copy-button";
import { Switch } from "@/components/ui/switch";

import { WalletAvatar } from "@/layout/header/wallet-avatar";
import { useMigrate } from "@/context/migrate";
import { MigrateMenuEntry } from "@/views/portfolio/migrate";
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
  useFastBidAmount,
  useNotificationsEnabled,
  useSetNotificationsEnabled
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
  const t = useTranslations("wallet");
  const { openMigrateDialog } = useMigrate();
  const fastBidAmount = useFastBidAmount();
  const notificationsEnabled = useNotificationsEnabled();
  const setNotificationsEnabled = useSetNotificationsEnabled();
  const hasHydrated = useConfigHydrated();
  const fastBidDisplay = formatFastBidAmountDisplay(
    hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT
  );

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
        <span className="truncate text-[14px] font-[400] leading-[17px] text-prophet-foreground">
          {formatShortWallet(polymarketAddress)}
        </span>
        <PolymarketAddressCopyButton
          address={polymarketAddress}
          ariaLabel={t("copyPolymarketAddress")}
          className="shrink-0 border-0 bg-transparent p-0 text-prophet-muted dark:text-white transition-colors hover:text-prophet-foreground"
        >
          <CopyIcon />
        </PolymarketAddressCopyButton>
      </div>

      {
        !isPrivateMode && (
          <>
            <MigrateMenuEntry
              onOpen={() => {
                onClose();
                openMigrateDialog("setup");
              }}
            />

            <Link
              href="/portfolio"
              role="menuitem"
              className={walletMenuItemClass}
              onClick={onClose}
            >
              <div className="flex items-center gap-2">
                <div className="w-[14px] text-prophet-muted dark:text-white">
                  <PortfolioIcon />
                </div>
                <span className="flex-1">{t("portfolio")}</span>
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
                <div className="w-[14px] text-prophet-muted dark:text-white">
                  <ReferralIcon />
                </div>
                <span className="flex-1">{t("referral")}</span>
              </div>
              <RightArrowIcon />
            </Link>

            <Link
              href="/tracks"
              role="menuitem"
              className={walletMenuItemClass}
              onClick={onClose}
            >
              <div className="flex items-center gap-2">
                <div className="w-[14px]">
                  <AttentionIcon />
                </div>
                <span className="flex-1">{t("attention")}</span>
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
                <div className="w-[14px] text-prophet-muted dark:text-white">
                  <FastBidIcon />
                </div>
                <span>{t("fastBid")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-prophet-foreground">{fastBidDisplay}</span>
                <RightArrowIcon />
              </div>
            </button>

            <div
              role="menuitem"
              className={walletMenuItemClass}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <div className="w-[14px] text-prophet-muted dark:text-white">
                  <NotificationIcon />
                </div>
                <span>{t("notification")}</span>
              </div>
              <span
                className="shrink-0"
                onClick={(event) => event.stopPropagation()}
              >
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  aria-label={t("toggleNotifications")}
                />
              </span>
            </div>

            <WalletDarkModeMenuItem />
          </>
        )
      }

      <WalletOutcomeDisplayMenuItem onSelect={onClose} />
      <WalletLanguageMenuItem onSelect={onClose} />

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
