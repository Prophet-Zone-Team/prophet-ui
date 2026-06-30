"use client";

import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";
import { DarkModeIcon } from "@/layout/header/wallet-menu-icons";
import { walletMenuItemClass } from "@/layout/header/wallet-menu-ui";
import {
  useConfigHydrated,
  useDarkModeEnabled,
  useSetDarkModeEnabled
} from "@/store";

interface WalletDarkModeMenuItemProps {
  variant?: "menu" | "compact";
}

export function WalletDarkModeMenuItem({
  variant = "menu"
}: WalletDarkModeMenuItemProps) {
  const t = useTranslations("wallet");
  const darkModeEnabled = useDarkModeEnabled();
  const setDarkModeEnabled = useSetDarkModeEnabled();
  const hasHydrated = useConfigHydrated();

  const switchControl = (
    <Switch
      checked={hasHydrated ? darkModeEnabled : false}
      onCheckedChange={setDarkModeEnabled}
      aria-label={t("darkMode")}
    />
  );

  if (variant === "compact") {
    return (
      <div
        className="inline-flex h-10 items-center gap-1.5 rounded-[20px] px-3 text-prophet-muted transition-colors hover:bg-prophet-base"
        onClick={(event) => event.stopPropagation()}
      >
        <DarkModeIcon />
        {switchControl}
      </div>
    );
  }

  return (
    <div
      role="menuitem"
      className={walletMenuItemClass}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <div className="w-[14px] text-prophet-muted">
          <DarkModeIcon />
        </div>
        <span>{t("darkMode")}</span>
      </div>
      <span
        className="shrink-0"
        onClick={(event) => event.stopPropagation()}
      >
        {switchControl}
      </span>
    </div>
  );
}
