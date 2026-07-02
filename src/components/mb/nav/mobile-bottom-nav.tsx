"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  PortfolioIcon,
  StrategiesIcon,
  WorldCupIcon
} from "@/components/mb/nav/icons";
import { useAuth } from "@/context/auth";
import { trackNavClicked } from "@/lib/analytics/tracking";
import {
  isNavActive,
  MOBILE_BOTTOM_NAV,
  shouldHideMobileBottomNav
} from "@/layout/header/nav";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";

const NAV_ICON_MAP = {
  strategies: StrategiesIcon,
  worldCup: WorldCupIcon,
  portfolio: PortfolioIcon
} as const;

const NAV_SVG_WIDTH = 410;
const NAV_SVG_HEIGHT = 94;
const NAV_BAR_TOP = 20;
const NAV_BUMP_TOP = 10;
const NAV_SHADOW_FILTER_PAD = 20;

function buildMobileNavBarPath(centerX: number) {
  const rightBar = centerX + 25.295;
  const leftBar = centerX - 25.295;

  return [
    `M${centerX} ${NAV_BUMP_TOP}`,
    `C${centerX + 9.784} ${NAV_BUMP_TOP} ${centerX + 18.679} 13.799 ${rightBar} ${NAV_BAR_TOP}`,
    `H${NAV_SVG_WIDTH}`,
    `V${NAV_SVG_HEIGHT}`,
    `H0`,
    `V${NAV_BAR_TOP}`,
    `H${leftBar}`,
    `C${centerX - 18.679} 13.799 ${centerX - 9.784} ${NAV_BUMP_TOP} ${centerX} ${NAV_BUMP_TOP}`,
    "Z"
  ].join("");
}

function buildFlatMobileNavBarPath() {
  return `M0 ${NAV_BAR_TOP}H${NAV_SVG_WIDTH}V${NAV_SVG_HEIGHT}H0V${NAV_BAR_TOP}Z`;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { cash, cashStatus, hydrated, isAuthenticated, session } = useAuth();

  const hideBottomNav = useMemo(
    () => shouldHideMobileBottomNav(pathname),
    [pathname]
  );

  const balanceDisplay = useMemo(() => {
    if (cashStatus === "loading") {
      return "-";
    }

    return formatNumber(cash?.available, 2, true, {
      round: 0,
      isZeroPrecision: true
    });
  }, [cash?.available, cashStatus]);

  const shadowFilterId = useId().replace(/:/g, "");

  const activeIndex = useMemo(
    () =>
      MOBILE_BOTTOM_NAV.findIndex((item) => isNavActive(pathname, item.href)),
    [pathname]
  );

  const navBarPath = useMemo(() => {
    if (activeIndex < 0) {
      return buildFlatMobileNavBarPath();
    }

    const centerX =
      ((activeIndex + 0.5) / MOBILE_BOTTOM_NAV.length) * NAV_SVG_WIDTH;

    return buildMobileNavBarPath(centerX);
  }, [activeIndex]);

  if (hideBottomNav) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-[100vw] md:hidden"
      style={{
        height: "calc(74px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
      aria-label={t("bottomNavigation")}
    >
      <svg
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
        viewBox={`0 0 ${NAV_SVG_WIDTH} ${NAV_SVG_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter
            id={shadowFilterId}
            x={-NAV_SHADOW_FILTER_PAD}
            y={-NAV_SHADOW_FILTER_PAD}
            width={NAV_SVG_WIDTH + NAV_SHADOW_FILTER_PAD * 2}
            height={NAV_SVG_HEIGHT + NAV_SHADOW_FILTER_PAD * 2}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow"
              result="shape"
            />
          </filter>
        </defs>
        <g filter={`url(#${shadowFilterId})`}>
          <path d={navBarPath} fill="var(--prophet-bg-base)" />
        </g>
      </svg>

      <div className="relative z-[3] flex h-[74px] w-full items-end">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = NAV_ICON_MAP[item.icon];
          const showBalance = "showBalance" in item && item.showBalance;
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
              <span className="flex h-[33px] items-end justify-center">
                <Icon active={active} />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-center font-[Sora] text-[10px] leading-[13px]",
                  active ? "text-prophet-foreground" : "text-prophet-muted",
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
