"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  AnalyticsIcon,
  PortfolioIcon,
  StrategiesIcon,
  TracksIcon,
  WorldCupIcon
} from "@/components/mb/nav/icons";
import { useAuth } from "@/context/auth";
import { trackNavClicked } from "@/lib/analytics/tracking";
import { isNavActive, MOBILE_BOTTOM_NAV } from "@/layout/header/nav";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";

const NAV_ICON_MAP = {
  analytics: AnalyticsIcon,
  strategies: StrategiesIcon,
  worldCup: WorldCupIcon,
  tracks: TracksIcon,
  portfolio: PortfolioIcon
} as const;

const NAV_BAR_SHADOW = "0 0 10px rgba(0, 0, 0, 0.1)";

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { cash, cashStatus, hydrated, isAuthenticated, session } = useAuth();

  const isPrivateMode = useMemo(() => {
    return [/^\/private/].some((reg) => reg.test(pathname));
  }, [pathname]);

  const balanceDisplay = useMemo(() => {
    if (cashStatus === "loading") {
      return "-";
    }

    return formatNumber(cash?.available, 2, true, {
      round: 0,
      isZeroPrecision: true
    });
  }, [cash?.available, cashStatus]);

  if (isPrivateMode) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 h-[74px] md:hidden"
      aria-label={t("bottomNavigation")}
    >
      <div
        className="absolute inset-x-0 z-[2] bottom-0 h-16 bg-[#F9FAFC]"
        aria-hidden
      />
      <div
        className="pointer-events-none z-[1] absolute left-1/2 top-0 size-[74px] -translate-x-1/2 rounded-full bg-[#F9FAFC]"
        style={{ boxShadow: NAV_BAR_SHADOW }}
        aria-hidden
      />

      <div className="relative z-[3] flex h-full items-end">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = NAV_ICON_MAP[item.icon];
          const showBalance = "showBalance" in item && item.showBalance;
          const isCenterItem = "center" in item && item.center;
          const label =
            showBalance && hydrated && isAuthenticated && session
              ? `$${balanceDisplay}`
              : t(item.labelKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-[3px] pb-[7px]"
              aria-current={active ? "page" : undefined}
              onClick={() => {
                trackNavClicked({
                  target: item.href,
                  label: t(item.labelKey)
                });
              }}
            >
              <span
                className={cn(
                  "flex h-5 items-center justify-center",
                  isCenterItem && "mb-[8px]"
                )}
              >
                <Icon active={active} />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-center font-[Sora] text-[10px] leading-[13px]",
                  active ? "text-black" : "text-[#979797]",
                  showBalance && "text-right"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
