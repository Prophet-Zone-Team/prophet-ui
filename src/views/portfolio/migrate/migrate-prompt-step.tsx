"use client";

import { useTranslations } from "next-intl";

import { getLegacyAccountLabelKey } from "@/lib/trading/migrate/polymarket-migration";
import type { LegacyMigrationAccount } from "@/lib/trading/migrate/types";
import {
  MigrateAccountCard,
} from "@/views/portfolio/migrate/migrate-account-card";
import {
  migratePrimaryButtonClass,
  migratePromptActionsClass,
  migratePromptBodyClass,
  migratePromptHeroClass,
  migrateSecondaryButtonClass,
  migrateSectionLabelClass,
} from "@/views/portfolio/migrate/migrate-ui";

export interface MigratePromptStepProps {
  account: LegacyMigrationAccount;
  onIgnore: () => void;
  onContinue: () => void;
  onClose: () => void;
}

export function MigratePromptStep({
  account,
  onIgnore,
  onContinue,
  onClose,
}: MigratePromptStepProps) {
  const t = useTranslations("portfolio.migrate");
  const accountLabel = t(getLegacyAccountLabelKey(account.type));

  return (
    <div className="flex flex-col">
      <div className={migratePromptHeroClass}>
        <img
          src="/migrate/bg-card-1.png"
          alt=""
          className="object-cover"
        />
        <div className="absolute left-[30px] top-[27px] max-w-[320px] text-white">
          <p className="text-[26px] font-[500] leading-[1.5]">{t("detectedBalanceTitle")}</p>
          <p className="text-xl font-[400] leading-[1.5]">
            {t("detectedBalanceSubtitle", { accountLabel })}
          </p>
        </div>
      </div>

      <div className={migratePromptBodyClass}>
        <p className={migrateSectionLabelClass}>{t("existingBalance")}</p>
        <div className="mt-3">
          <MigrateAccountCard account={account} />
        </div>

        <div className={`${migratePromptActionsClass} mt-6`}>
          <button type="button" className={migrateSecondaryButtonClass} onClick={onIgnore}>
            {t("ignore")}
          </button>
          <button type="button" className={migratePrimaryButtonClass} onClick={onContinue}>
            {t("migrate")}
          </button>
        </div>
      </div>
    </div>
  );
}
