"use client";

import { useTranslations } from "next-intl";

import { HomeHeroTitleIconCycle } from "@/views/home/header/home-hero-title-icon-cycle";
import { useDarkModeEnabled } from "@/store";

export function UefaHero() {
  const t = useTranslations("home");
  const darkModeEnabled = useDarkModeEnabled();

  return (
    <section className="flex items-start gap-4 md:gap-5 py-4 md:py-8 px-3 md:px-0">
      {/* <img
        src={
          darkModeEnabled ? "/home/uefa/logo-light.png" : "/home/uefa/logo.png"
        }
        alt=""
        className="w-[64px] md:w-[100px] object-contain shrink-0"
        aria-hidden
      /> */}
      <div className="min-w-0 flex-1">
        <h1 className="flex flex-col md:flex-row md:flex-wrap items-start md:items-center gap-[8px] text-[26px] md:text-[52px] font-[600] leading-[1.05] text-prophet-foreground">
          <span className="whitespace-nowrap">{t("heroTaglineBefore")} </span>
          <span className="flex items-center gap-[8px]">
            <span className="whitespace-nowrap">{t("heroTaglineMoves")}</span>
            <HomeHeroTitleIconCycle className="w-[40px] h-[40px] md:w-[56px] md:h-[56px]" />
          </span>
        </h1>
        {/* <p className="mt-[8px] text-[16px] md:text-[20px] font-[600] leading-normal text-prophet-foreground">
          {t("uefaConferenceLeague")}
        </p> */}
      </div>
    </section>
  );
}
