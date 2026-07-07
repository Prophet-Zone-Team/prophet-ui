"use client";

import { useTranslations } from "next-intl";

import { PageBack } from "@/components/ui/page-back";
import { cn } from "@/lib/cn";

import { translateKnockoutMethod } from "./lib/method-keys";
import type { KnockoutMethodKey } from "./lib/method-keys";

export function RoadToFinalPageShell({
  knockoutMethod,
  onRandomFill,
  onFifaFill,
  onValueFill,
  onClear
}: {
  knockoutMethod: KnockoutMethodKey;
  onRandomFill: () => void;
  onFifaFill: () => void;
  onValueFill: () => void;
  onClear: () => void;
}) {
  const t = useTranslations("roadToFinal");

  return (
    <div className="relative overflow-hidden bg-[#0B1020] px-[16px] pb-[24px] pt-[10px] md:px-[24px]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)"
        }}
      />

      <div className="relative z-[1]">
        <div className="pb-[10px]">
          <PageBack className="text-white [&_a]:text-white [&_button]:text-white" />
        </div>

        <header className="mx-auto max-w-[760px] text-center">
          <p className="m-0 text-[18px] font-[500] capitalize text-white">
            {t("pageEyebrow")}
          </p>
          <h1 className="m-0 mt-[8px] text-[clamp(22px,4vw,26px)] font-[500] capitalize leading-[1.2] text-white">
            {t("pageTitle")}
          </h1>
          <p className="m-0 mt-[12px] text-[14px] leading-[1.55] text-white/70">
            {t("pageDescription")}
          </p>
        </header>

        <div className="relative z-[1] mt-[20px] flex flex-wrap items-center justify-center gap-[8px]">
          <ShortcutPill
            label={t("randomFill")}
            active={knockoutMethod === "randomFill"}
            onClick={onRandomFill}
          />
          <ShortcutPill
            label={t("byFifaRank")}
            active={knockoutMethod === "fifaRank"}
            onClick={onFifaFill}
          />
          <ShortcutPill
            label={t("byValue")}
            active={knockoutMethod === "squadValueRanking"}
            onClick={onValueFill}
          />
          <button
            type="button"
            className="rounded-[18px] px-[14px] py-[7px] text-[14px] text-[#FF674B] transition hover:text-[#ff826b]"
            onClick={onClear}
          >
            {t("clear")}
          </button>
        </div>

        <p className="m-0 mt-[8px] text-center text-[11px] text-white/40">
          {t("shortcutBasis")}: {translateKnockoutMethod(knockoutMethod, t)}
        </p>
      </div>
    </div>
  );
}

function ShortcutPill({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-[18px] border px-[14px] py-[7px] text-[14px] transition",
        active
          ? "border-prophet-line bg-prophet-panel text-prophet-foreground"
          : "border-white/40 bg-transparent text-white hover:border-white/70"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
