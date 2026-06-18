"use client";

import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/cn";
import { COMBO_SHARE_PROPHET_LOGO_PATH } from "@/lib/combo/share-card-config";
import { formatReferralFunderDisplay } from "@/lib/referral/format-funder-display";

import {
  inviteShareCardFunderClass,
  inviteShareCardInviteClass,
  inviteShareCardProfitClass,
  inviteShareCardTitleClass,
} from "@/views/referral/referral-ui";

export type ComboShareReferralPanelProps = {
  fullLink: string;
  displayLink: string;
  funderAddress?: string;
  align?: "left" | "right";
  className?: string;
};

export function ComboShareReferralPanel({
  fullLink,
  displayLink,
  funderAddress,
  align = "right",
  className,
}: ComboShareReferralPanelProps) {
  const t = useTranslations("referral");
  const tPortfolio = useTranslations("portfolio");
  const funderDisplay = formatReferralFunderDisplay(funderAddress);
  const inviteLabel = displayLink.replace(/^https?:\/\//, "");

  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-1 flex-col justify-between p-5 font-body text-white",
        align === "left" ? "items-start text-left" : "items-start text-left",
        className,
      )}
    >
      <div className="flex w-full flex-col gap-4">
        <p className={inviteShareCardTitleClass}>
          {t("shareCardTitle")}
          <br />
          <span className={inviteShareCardProfitClass}>{t("shareCardProfit")}</span>
        </p>

        {funderDisplay ? (
          <div>
            <p className={cn(inviteShareCardFunderClass, "text-[18px] leading-[1.5]")}>
              {funderDisplay}
            </p>
            <p className={cn(inviteShareCardInviteClass, "text-[14px] leading-[1.5]")}>
              {t("shareCardInvite")}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex w-full flex-col">
        <div className="flex items-center gap-2 -translate-x-[20px] translate-y-[40px]">
          <img
            src={COMBO_SHARE_PROPHET_LOGO_PATH}
            alt=""
            className="h-[66px] w-[200px] shrink-0 object-contain object-left"
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <span className="inline-flex h-[31px] items-center rounded-[6px] border border-white/50 bg-[rgba(130,163,255,0.1)] px-3 text-[12px] font-light tracking-[0.18em] text-white backdrop-blur-[3px]">
            prophet.zone
          </span>

          <div
            className="shrink-0 rounded-[6px] border border-black bg-white p-[2px]"
            aria-hidden="true"
          >
            <QRCodeSVG
              value={fullLink}
              size={60}
              level="M"
              marginSize={0}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
