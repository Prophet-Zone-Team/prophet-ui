"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatImpactScore } from "@/views/analytics/news/format";
import { SentimentColor, SentimentIcon } from "@/views/analytics/news/icons";
import type { NewsSentiment } from "@/views/analytics/news/types";

export type SignalNewsDetailMetadataRowProps = {
  sentiment: NewsSentiment;
  impactScore: number;
  relatedLabel: string;
  categoryLabel: string;
  className?: string;
};

export function SignalNewsDetailMetadataRow({
  sentiment,
  impactScore,
  relatedLabel,
  categoryLabel,
  className
}: SignalNewsDetailMetadataRowProps) {
  const t = useTranslations("signal");
 

  return (
    <dl
      className={cn(
        "m-0 flex flex-wrap items-center gap-x-[24px] gap-y-[8px]",
        className
      )}
    >
      <div className="flex items-center gap-[8px]">
        <dt className="m-0 text-[14px] font-[400] leading-[17px] text-[#909090]">
          {t("impact")}
        </dt>
        <dd className="m-0 flex items-center gap-[4px]">
          <span className="shrink-0 [&_svg]:size-[16px]">
            <SentimentIcon sentiment={sentiment} />
          </span>
          <span
            className={cn(
              "text-[14px] font-[500] leading-[17px]",
              SentimentColor({ sentiment })
            )}
          >
            {formatImpactScore(impactScore)}
          </span>
        </dd>
      </div>

      <div className="flex items-center gap-[8px]">
        <dt className="m-0 text-[14px] font-[400] leading-[17px] text-[#909090]">
          {t("related")}
        </dt>
        <dd className="m-0 text-[14px] font-[400] leading-[17px] text-black">
          {relatedLabel}
        </dd>
      </div>

      <div className="flex items-center gap-[8px]">
        <dt className="m-0 text-[14px] font-[400] leading-[17px] text-[#909090]">
          {t("categories")}
        </dt>
        <dd className="m-0 text-[14px] font-[400] leading-[17px] text-black">
          {categoryLabel}
        </dd>
      </div>
    </dl>
  );
}
