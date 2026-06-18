"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export const STRATEGY_SECTIONS = [
  { href: "/strategy/available", labelKey: "available" },
  { href: "/strategy/ended", labelKey: "ended" }
] as const;

const PILL_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85
};

function isSectionActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StrategySectionNav() {
  const t = useTranslations("strategy");
  const pathname = usePathname();
  const router = useRouter();
  const pillLayoutId = `${useId()}-strategy-section-pill`;

  const activeHref =
    STRATEGY_SECTIONS.find((section) => isSectionActive(pathname, section.href))
      ?.href ?? STRATEGY_SECTIONS[0].href;

  return (
    <nav aria-label={t("strategyViews")} className="flex justify-center">
      <div
        role="tablist"
        className="flex h-[46px] w-full max-w-[279px] items-center rounded-[12px] bg-[#F4F4F4] p-[5px]"
      >
        {STRATEGY_SECTIONS.map((section) => {
          const isActive = section.href === activeHref;

          return (
            <button
              key={section.href}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => router.push(section.href)}
              className="relative flex h-[36px] flex-1 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
            >
              {isActive ? (
                <motion.span
                  layoutId={pillLayoutId}
                  aria-hidden="true"
                  className="absolute inset-y-0 w-full rounded-[8px] border border-[#EBEBEB] bg-white"
                  transition={PILL_TRANSITION}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 font-[Sora] text-base leading-5 text-black",
                  isActive ? "font-medium" : "font-normal"
                )}
              >
                {t(section.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
