"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export interface LatestEmptyStateProps {
  className?: string;
}

export function LatestEmptyState({ className }: LatestEmptyStateProps) {
  const t = useTranslations("copyTrade.activity");

  return (
    <div className={cn(className)}>
      <p className="text-center text-[16px] leading-5 text-prophet-muted">
        {t("noRecentTrades")}
      </p>
    </div>
  );
}
