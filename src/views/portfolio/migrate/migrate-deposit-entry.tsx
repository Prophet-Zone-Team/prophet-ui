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
        <div className="relative z-[1] min-w-0 flex-1 text-left">
          <p className="mt-0.5 text-xs font-[400] text-[#a0a0a0]">
            {t("depositEntrySubtitle", { accountLabel })}
          </p>
          <p className="mt-1 text-sm font-[500] text-white/80">
            {formatShortWallet(account.address)}
          </p>
        </div>
        <p className="relative z-[1] shrink-0 text-base font-[500] leading-[1.5] text-white">
          {formatNumber(account.balanceUsd, 2, true, { prefix: "$", round: 0 })}
        </p>
      </button>
    </>
  );
}
