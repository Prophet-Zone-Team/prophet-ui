import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

/** Column widths as percentages (sum = 100%) */
const HEADER_GRID =
  "hidden md:grid w-full grid-cols-[5%_13%_10%_15%_15%_13%_13%_13%] items-center gap-x-2 px-5";

export function FullRankingTableHeader() {
  const t = useTranslations("analytics");

  return (
    <div
      role="row"
      className={cn(
        HEADER_GRID,
        "text-[16px] font-[400] leading-[19px] text-prophet-muted"
      )}
    >
      <span role="columnheader">{t("rank")}</span>
      <span role="columnheader">{t("team")}</span>
      <span role="columnheader">{t("group")}</span>
      <span role="columnheader">{t("titleProbability")}</span>
      <span role="columnheader">{t("roundOf16")}</span>
      <span role="columnheader">{t("pathDifficulty")}</span>
      <span role="columnheader">{t("recentTrend")}</span>
      <span role="columnheader">{t("signalStatus")}</span>
    </div>
  );
}

export { HEADER_GRID as fullRankingTableGridClass };
