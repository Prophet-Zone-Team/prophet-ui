"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { WalletAvatar } from "@/layout/header/wallet-avatar";
import { getLegacyAccountLabelKey } from "@/lib/trading/migrate/polymarket-migration";
import type { LegacyMigrationAccount } from "@/lib/trading/migrate/types";
import { formatNumber } from "@/utils";
import {
  migrateAccountAddressClass,
  migrateAccountBalanceClass,
  migrateAccountCardClass,
  migrateAccountLabelClass,
  migrateAccountMetaClass,
} from "@/views/portfolio/migrate/migrate-ui";

export interface MigrateAccountCardProps {
  account: LegacyMigrationAccount;
  balanceUsd?: number;
}

export function MigrateAccountCard({ account, balanceUsd }: MigrateAccountCardProps) {
  const t = useTranslations("portfolio.migrate");
  const labelKey = getLegacyAccountLabelKey(account.type);
  const displayBalance = balanceUsd ?? account.balanceUsd;

  return (
    <div className={migrateAccountCardClass}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <WalletAvatar address={account.address} size="sm" />
        <div className={migrateAccountMetaClass}>
          <p className={migrateAccountLabelClass}>{t(labelKey)}</p>
          <p className={migrateAccountAddressClass}>{account.address}</p>
        </div>
      </div>
      <p className={migrateAccountBalanceClass}>
        {formatNumber(displayBalance, 2, true, { prefix: "$", round: 0 })}
      </p>
    </div>
  );
}

export interface MigrateDestinationCardProps {
  address: string;
  balanceUsd?: number;
}

export function MigrateDestinationCard({ address, balanceUsd }: MigrateDestinationCardProps) {
  const t = useTranslations("portfolio.migrate");

  return (
    <div className={migrateAccountCardClass}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <WalletAvatar address={address} size="sm" />
        <div className={migrateAccountMetaClass}>
          <p className={migrateAccountLabelClass}>{t("prophetAccount")}</p>
          <p className={migrateAccountAddressClass}>{address}</p>
        </div>
      </div>
      <p className={`${migrateAccountBalanceClass} ${balanceUsd === undefined ? "opacity-30" : ""}`}>
        {formatNumber(balanceUsd ?? 0, 2, true, { prefix: "$", round: 0 })}
      </p>
    </div>
  );
}

export function MigrateInfoIcon() {
  return (
    <Image
      src="/icons/icon-info.svg"
      alt=""
      width={16}
      height={16}
      className="shrink-0"
      aria-hidden="true"
    />
  );
}
