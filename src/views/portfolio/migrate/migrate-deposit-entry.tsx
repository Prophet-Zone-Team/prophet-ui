"use client";

import { useTranslations } from "next-intl";

import { useMigrate } from "@/context/migrate";
import { getLegacyAccountLabelKey } from "@/lib/trading/migrate/polymarket-migration";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import { migrateDepositEntryClass } from "@/views/portfolio/migrate/migrate-ui";

export interface MigrateDepositEntryProps {
  onOpen: () => void;
}

export function MigrateDepositEntry({ onOpen }: MigrateDepositEntryProps) {
  const t = useTranslations("portfolio.migrate");
  const { snapshot, hasMigratableBalance } = useMigrate();
  const account = snapshot?.bestAccount;

  if (!hasMigratableBalance || !account) {
    return null;
  }

  const accountLabel = t(getLegacyAccountLabelKey(account.type));

  return (
    <>
      <p className="text-sm font-[500] leading-[17px] text-black">
        {t("depositEntryTitle")}
      </p>
      <button type="button" className={migrateDepositEntryClass} onClick={onOpen}>
        <div className="text-base font-[500] text-[#ffffff] relative z-[1] text-left flex justify-between items-center gap-1 w-full">
          <p className="">
            {accountLabel?.replace(/\(.*\)$/, "")} {formatShortWallet(account.address)}
          </p>
          <p className="">
            {formatNumber(account.balanceUsd, 2, true, { prefix: "$", round: 0 })}
          </p>
        </div>
        <div className="text-[#A0A0A0] text-xs font-[400] w-full">
          {t("depositEntrySubtitle", { accountLabel })}
        </div>
      </button>
    </>
  );
}
