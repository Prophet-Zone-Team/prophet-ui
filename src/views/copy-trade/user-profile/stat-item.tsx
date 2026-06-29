"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export interface StatItemProps {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
  isLoading?: boolean;
}

export function StatItem({
  label,
  value,
  valueClassName,
  className,
  isLoading = false
}: StatItemProps) {
  const tCommon = useTranslations("copyTrade.common");

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[14px] leading-[18px] text-[#909090]">{label}</span>
      {isLoading ? (
        <div
          className="h-[25px] w-24 animate-pulse rounded bg-[#EBEBEB]"
          aria-label={tCommon("loadingAria")}
        />
      ) : (
        <span
          className={cn(
            "text-[20px] font-medium leading-[25px] text-black tabular-nums",
            valueClassName
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}
