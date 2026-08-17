"use client";

import Drawer from "@/components/drawer";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import PrivateBalance from "./private-balance";
import { WalletLanguageMenuItem } from "./wallet-language-menu-item";
import { WalletOutcomeDisplayMenuItem } from "./wallet-outcome-display-menu-item";
import { walletBalanceLabelClass, walletBalanceValueClass } from "./wallet-menu-ui";
import NavBar from "./navigation-bar";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useAuth } from "@/context/auth";
import { useTranslations } from "next-intl";

function MobileDrawer(props: any) {
  const {
    open,
    onClose,
    regionRestricted,
    onPrivateBalanceClick,
    balanceDisplay,
  } = props;

  const t = useTranslations("wallet");

  const {
    session,
    hydrated,
    isAuthenticated,
  } = useAuth();

  const isLogin = hydrated && isAuthenticated && session;

  return (
    <Drawer
      title={(
        <Link
          href="/matches"
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <img
            src="/logo.svg"
            alt=""
            width={29}
            height={27}
            className="block"
            aria-hidden
          />
          PROPHET
        </Link>
      )}
      open={open}
      onClose={onClose}
      direction="top"
    >
      <div className="">
        {
          isLogin && (
            <div className="px-4 flex justify-between items-center gap-5">
              <RegionRestrictedControl restricted={regionRestricted}>
                <PrivateBalance
                  onClick={() => {
                    onPrivateBalanceClick?.();
                    onClose?.();
                  }}
                  className="!items-start"
                />
              </RegionRestrictedControl>
              <div className="flex flex-col justify-center items-start gap-0 rounded-lg border border-prophet-line h-[50px] px-2.5 min-w-[150px]">
                <span className={walletBalanceLabelClass}>{t("balance")}</span>
                <span className={cn(walletBalanceValueClass, "!text-base")}>${balanceDisplay}</span>
              </div>
            </div>
          )
        }
        <NavBar
          className="flex flex-col items-stretch gap-0 mt-5"
          navClassName="border-b border-prophet-line !rounded-none justify-center last:border-b-0 h-[60px]"
          activeClassName="!rounded-none"
          onClick={onClose}
        />
        <div className="mt-4 flex flex-col gap-3 px-4 pb-4">
          <WalletOutcomeDisplayMenuItem onSelect={onClose} />
          <WalletLanguageMenuItem onSelect={onClose} />
        </div>
      </div>
    </Drawer>
  );
};

export default MobileDrawer;
