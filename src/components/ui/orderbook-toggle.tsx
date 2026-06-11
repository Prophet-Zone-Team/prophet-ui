"use client";

import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

export interface OrderbookToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  variant?: "game" | "team";
  className?: string;
}

const labelVariantClass = {
  game: "text-[14px] leading-[18px] font-[400]",
  team: "text-base leading-[19px] font-[400]"
} as const;

export function OrderbookToggle({
  checked,
  onChange,
  variant = "game",
  className
}: OrderbookToggleProps) {
  const t = useTranslations("trade");

  return (
    <label className={cn("flex cursor-pointer items-center gap-2", className)}>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={t("showOrderbook")}
      />
      <span
        className={cn(
          "whitespace-nowrap text-[#909090]",
          labelVariantClass[variant]
        )}
      >
        {t("orderbook")}
      </span>
    </label>
  );
}
