"use client";

import { useTranslations } from "next-intl";

import { getMarketDataSourceLabel } from "@/data/providers/source";
import type { MarketDataMeta } from "@/data/providers/types";

export interface TeamDetailFootnoteProps {
  dataStatus: MarketDataMeta;
}

export function TeamDetailFootnote({ dataStatus }: TeamDetailFootnoteProps) {
  const t = useTranslations("teamDetail");

  return (
    <footer className="mt-6 flex flex-col gap-1 border-t border-prophet-line pt-4 text-[11px] leading-relaxed text-prophet-muted">
      <span>
        {t("footnoteSource", {
          source: getMarketDataSourceLabel(dataStatus.source)
        })}
      </span>
      <span>{t("footnoteDisclaimer")}</span>
    </footer>
  );
}
