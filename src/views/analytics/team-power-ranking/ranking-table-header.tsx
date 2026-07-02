import { useTranslations } from "next-intl";

import { rankingPreviewTableGridClass } from "./table-grid";

export function RankingTableHeader() {
  const t = useTranslations("analytics");

  return (
    <div
      role="row"
      className={`${rankingPreviewTableGridClass} px-[20px] text-[14px] font-[400] leading-[17px] text-prophet-muted`}
    >
      <span role="columnheader">{t("rank")}</span>
      <span role="columnheader">{t("team")}</span>
      <span role="columnheader">{t("titleProbability")}</span>
      <span role="columnheader">{t("roundOf16")}</span>
      <span role="columnheader" className="text-right">
        {t("trend")}
      </span>
    </div>
  );
}
