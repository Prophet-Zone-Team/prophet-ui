"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export interface TracksEmptyStateProps {
  className?: string;
  disabled?: boolean;
  onImport?: () => void;
}

export function TracksEmptyState({
  className,
  disabled = false,
  onImport
}: TracksEmptyStateProps) {
  const t = useTranslations("copyTrade.activity");
  const tCommon = useTranslations("copyTrade.common");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      <p className="text-center text-[16px] leading-5 text-[#909090]">
        {t("noTrackedWallet")}
      </p>

      <button
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex h-10 w-[96px] items-center justify-center rounded-lg text-[16px] leading-5 text-white transition-opacity",
          disabled
            ? "cursor-not-allowed bg-black/30"
            : "bg-black hover:opacity-90"
        )}
        onClick={onImport}
      >
        {tCommon("import")}
      </button>
    </div>
  );
}
