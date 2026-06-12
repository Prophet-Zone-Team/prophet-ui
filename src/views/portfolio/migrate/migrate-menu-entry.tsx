"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { useMigrate } from "@/context/migrate";
import { migrateMenuBannerClass } from "@/views/portfolio/migrate/migrate-ui";

export interface MigrateMenuEntryProps {
  onOpen: () => void;
}

export function MigrateMenuEntry({ onOpen }: MigrateMenuEntryProps) {
  const t = useTranslations("portfolio.migrate");
  const { snapshot, hasMigratableBalance } = useMigrate();

  if (!hasMigratableBalance || !snapshot?.bestAccount) {
    return null;
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={migrateMenuBannerClass}
      onClick={onOpen}
    >
      <div className="relative z-[1] min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-[500] text-white">{t("migrate")}</span>
          <ChevronRight className="h-3 w-3 text-white" aria-hidden="true" />
        </div>
        <p className="mt-0.5 text-[10px] font-[400] text-[#9a9a9a]">
          {t("menuEntrySubtitle")}
        </p>
      </div>
    </button>
  );
}
