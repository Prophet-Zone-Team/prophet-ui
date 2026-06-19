"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { ComboLogo } from "@/views/combo/combo-widget/combo-logo";

const COMBO_ENTRY_BG =
  "linear-gradient(90deg, rgba(177, 68, 255, 0.1) 0%, rgba(45, 151, 243, 0.1) 100%), #FFFFFF";
const COMBO_ENTRY_BG_HOVER =
  "linear-gradient(90deg, rgba(177, 68, 255, 0.16) 0%, rgba(45, 151, 243, 0.16) 100%), #FFFFFF";
const COMBO_ENTRY_HOME_MOBILE_BG =
  "linear-gradient(360deg, rgba(45, 151, 243, 0.1) 0%, rgba(177, 68, 255, 0.1) 100%), #FFFFFF";

export type ComboEntryProps = {
  className?: string;
  href?: string;
  variant?: "default" | "homeMobile";
};

export function ComboEntry({
  className,
  href = "/combo",
  variant = "default"
}: ComboEntryProps) {
  const t = useTranslations("combo");
  const isHomeMobile = variant === "homeMobile";
  const background = isHomeMobile ? COMBO_ENTRY_HOME_MOBILE_BG : COMBO_ENTRY_BG;

  return (
    <Link
      href={href}
      style={{ background }}
      onMouseEnter={
        isHomeMobile
          ? undefined
          : (event) => {
              event.currentTarget.style.background = COMBO_ENTRY_BG_HOVER;
            }
      }
      onMouseLeave={
        isHomeMobile
          ? undefined
          : (event) => {
              event.currentTarget.style.background = COMBO_ENTRY_BG;
            }
      }
      className={cn(
        "group flex w-full shrink-0 items-center justify-center gap-[7px] border border-[#EBEBEB] transition-all duration-200 active:scale-[0.98]",
        isHomeMobile
          ? "h-10 rounded-[20px] shadow-[0_0_10px_rgba(0,0,0,0.1)]"
          : "h-[46px] gap-2 rounded-xl hover:border-[#D4B8F8] hover:shadow-[0_2px_10px_rgba(140,53,255,0.14)]",
        className
      )}
    >
      <span
        className="inline-flex shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-hidden
      >
        <ComboLogo />
      </span>
      <span className="bg-[linear-gradient(270deg,#542099_0%,#8C35FF_100%)] bg-clip-text font-[Sora] text-base font-[500] leading-5 text-transparent transition-opacity duration-200 group-hover:opacity-90">
        {t("buildCombo")}
      </span>
    </Link>
  );
}
