"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { ComboLogo } from "@/views/combo/combo-widget/combo-logo";

const COMBO_ENTRY_BG =
  "linear-gradient(90deg, rgba(177, 68, 255, 0.1) 0%, rgba(45, 151, 243, 0.1) 100%), #FFFFFF";
const COMBO_ENTRY_BG_HOVER =
  "linear-gradient(90deg, rgba(177, 68, 255, 0.16) 0%, rgba(45, 151, 243, 0.16) 100%), #FFFFFF";

export type ComboEntryProps = {
  className?: string;
  href?: string;
};

export function ComboEntry({ className, href = "/combo" }: ComboEntryProps) {
  const t = useTranslations("combo");

  return (
    <Link
      href={href}
      style={{ background: COMBO_ENTRY_BG }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = COMBO_ENTRY_BG_HOVER;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = COMBO_ENTRY_BG;
      }}
      className={cn(
        "group flex h-[46px] w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#EBEBEB] transition-all duration-200 hover:border-[#D4B8F8] hover:shadow-[0_2px_10px_rgba(140,53,255,0.14)] active:scale-[0.98]",
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
