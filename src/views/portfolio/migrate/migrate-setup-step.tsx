"use client";

import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";

import type { LegacyMigrationAccount } from "@/lib/trading/migrate/types";
import {
  MigrateAccountCard,
  MigrateDestinationCard,
  MigrateInfoIcon,
} from "@/views/portfolio/migrate/migrate-account-card";
import {
  migrateInfoBannerClass,
  migrateMinimumNoticeClass,
  migrateMinimumNoticeTextClass,
  migratePrimaryButtonClass,
  migrateSectionLabelClass,
  migrateSetupBodyClass,
} from "@/views/portfolio/migrate/migrate-ui";
import { MIN_MIGRATION_USD } from "@/lib/trading/migrate/polymarket-migration";

export interface MigrateSetupStepProps {
  sourceAccount: LegacyMigrationAccount;
  destinationAddress: string;
  destinationBalanceUsd?: number;
  onContinue: () => void;
}

export function MigrateSetupStep({
  sourceAccount,
  destinationAddress,
  destinationBalanceUsd,
  onContinue,
}: MigrateSetupStepProps) {
  const t = useTranslations("portfolio.migrate");

  return (
    <div className={migrateSetupBodyClass}>
      <div className={migrateInfoBannerClass}>{t("upgradeInfo")}</div>

      <div className="mt-5">
        <p className={migrateSectionLabelClass}>{t("sourceAccount")}</p>
        <div className="mt-2.5">
          <MigrateAccountCard account={sourceAccount} />
        </div>
      </div>

      <div className={`${migrateMinimumNoticeClass} mt-5`}>
        <MigrateInfoIcon />
        <p className={migrateMinimumNoticeTextClass}>{t("minimumMigrationValue", { amount: MIN_MIGRATION_USD })}</p>
      </div>

      <div className="my-4 flex justify-center">
        <ArrowDown className="h-4 w-4 text-black" aria-hidden="true" />
      </div>

      <div>
        <p className={migrateSectionLabelClass}>{t("destinationAccount")}</p>
        <div className="mt-2.5">
          <MigrateDestinationCard
            address={destinationAddress}
            balanceUsd={destinationBalanceUsd}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <button type="button" className={migratePrimaryButtonClass} onClick={onContinue}>
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
