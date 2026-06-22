"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import { FundingResponsiveOverlay } from "@/views/portfolio/shared/funding-responsive-overlay";

import { EntryStructurePanel } from "./entry-structure-panel";

export function CampaignRulesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("roadToFinal");
  const isMobile = useDevice();

  return (
    <FundingResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("campaignRulesTitle")}
      className="w-full max-w-[720px]"
      overlayClassName="z-[70]"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-white",
          "h-[85vh] rounded-[20px] border border-[#EBEBEB] px-2 py-3",
          "shadow-[0_0_10px_rgba(0,0,0,0.1)]",
          "max-md:h-auto max-md:rounded-none max-md:border-0 max-md:px-3 max-md:pb-8 max-md:pt-[45px] max-md:shadow-none"
        )}
      >
        {isMobile ? (
          <button
            type="button"
            className="absolute right-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-lg bg-white text-[#18110F] transition-colors hover:bg-[#fafbfc]"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}

        <h2 className="m-0 px-1 pr-[32px] text-[16px] font-medium text-black">
          {t("campaignRulesTitle")}
        </h2>

        <div className="mt-3 h-[calc(100%_-_28px)] overflow-y-auto px-1 pb-10 max-md:h-auto max-md:overflow-visible">

          <p className="m-0 mt-[12px] text-[14px] leading-[1.5] text-black">
            {t("campaignRulesIntro")}
          </p>

          <section className="pt-[20px]">
            <p className="m-0 text-[14px] font-medium text-black">
              {t("campaignRulesHowToPlayTitle")}
            </p>
            <ol className="m-0 mt-[8px] list-decimal space-y-[8px] pl-[21px] text-[14px] leading-[1.5] text-black">
              <li>{t("campaignRulesHowToPlayStep1")}</li>
              <li>{t("campaignRulesHowToPlayStep2")}</li>
              <li>{t("campaignRulesHowToPlayStep3")}</li>
              <li>{t("campaignRulesHowToPlayStep4")}</li>
            </ol>
          </section>

          <div className="mt-[20px]">
            <EntryStructurePanel variant="embedded" />
          </div>

          <section className="mt-[20px]">
            <p className="m-0 text-[14px] font-semibold text-black">
              {t("campaignRulesQualificationTitle")}
            </p>
            <ol className="m-0 mt-[8px] list-decimal space-y-[8px] pl-[21px] text-[14px] leading-[1.5] text-black">
              <li>{t("campaignRulesQualificationItem1")}</li>
              <li>{t("campaignRulesQualificationItem2")}</li>
              <li>{t("campaignRulesQualificationItem3")}</li>
              <li>{t("campaignRulesQualificationItem4")}</li>
              <li>{t("campaignRulesQualificationItem5")}</li>
            </ol>
          </section>

          <section className="mt-[20px]">
            <p className="m-0 text-[14px] font-semibold text-black">
              {t("campaignRulesPrizeTitle")}
            </p>
            <p className="m-0 mt-[8px] text-[14px] leading-[1.2] text-black">
              {t("campaignRulesPrizeBody")}
            </p>
            <p className="m-0 mt-[12px] text-[14px] leading-[1.2] text-black">
              {t("campaignRulesTiebreakersTitle")}
            </p>
            <ol className="m-0 mt-[8px] list-decimal space-y-[4px] pl-[21px] text-[14px] leading-[1.2] text-black">
              <li>{t("campaignRulesTiebreaker1")}</li>
              <li>{t("campaignRulesTiebreaker2")}</li>
              <li>{t("campaignRulesTiebreaker3")}</li>
              <li>{t("campaignRulesTiebreaker4")}</li>
              <li>{t("campaignRulesTiebreaker5")}</li>
            </ol>
          </section>

          <section className="mt-[20px]">
            <p className="m-0 text-[14px] leading-[1.2] text-black">
              {t("campaignRulesShortCopy")}
            </p>
          </section>

          <p className="m-0 mt-[20px] text-[14px] leading-[1.2] text-black">
            {t("campaignRulesFooter")}
          </p>
        </div>
      </div>
    </FundingResponsiveOverlay>
  );
}
