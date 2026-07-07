"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { ComboLogo } from "@/views/combo/combo-widget/combo-logo";
import { comboShellBackground } from "@/views/combo/combo-ui";

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
  const background = isHomeMobile
    ? comboShellBackground("entryHomeMobile")
    : comboShellBackground("entry");

  return (
    <Link
      href={href}
      style={{ background }}
      onMouseEnter={
        isHomeMobile
          ? undefined
          : (event) => {
              event.currentTarget.style.background =
                comboShellBackground("entryHover");
            }
      }
      onMouseLeave={
        isHomeMobile
          ? undefined
          : (event) => {
              event.currentTarget.style.background = comboShellBackground("entry");
            }
      }
      className={cn(
        "group flex w-full shrink-0 items-center justify-center gap-[7px] border border-prophet-line transition-all duration-200 active:scale-[0.98]",
        isHomeMobile
          ? "h-10 rounded-[20px] shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_10px_rgba(0,0,0,0.3)]"
          : "h-[46px] gap-2 rounded-xl hover:border-[#D4B8F8] dark:hover:border-[#6b3f99] hover:shadow-[0_2px_10px_rgba(140,53,255,0.14)]",
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
