"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";

import {
  REFERRAL_SHARE_CARD_EXPORT_PADDING,
  REFERRAL_SHARE_CARD_HEIGHT,
  REFERRAL_SHARE_CARD_IMAGE_PATH,
  REFERRAL_SHARE_CARD_WIDTH,
} from "@/lib/referral/config";
import { formatReferralFunderDisplay } from "@/lib/referral/format-funder-display";
import { cn } from "@/lib/cn";

import {
  inviteShareCardClass,
  inviteShareCardFunderClass,
  inviteShareCardInviteClass,
  inviteShareCardOuterClass,
  inviteShareCardProfitClass,
  inviteShareCardQrWrapClass,
  inviteShareCardTitleClass,
} from "./referral-ui";

export type ReferralShareCardProps = {
  fullLink: string;
  funderAddress?: string;
  className?: string;
  onBackgroundReady?: () => void;
};

export const ReferralShareCard = forwardRef<HTMLDivElement, ReferralShareCardProps>(
  function ReferralShareCard(
    { fullLink, funderAddress, className, onBackgroundReady },
    ref,
  ) {
    const t = useTranslations("referral");
    const [bgReady, setBgReady] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const funderDisplay = formatReferralFunderDisplay(funderAddress);

    function handleBgLoad() {
      setBgReady(true);
      onBackgroundReady?.();
    }

    useEffect(() => {
      if (imgRef.current?.complete) {
        handleBgLoad();
      }
    }, []);

    return (
      <div
        ref={ref}
        className={cn(inviteShareCardOuterClass, className)}
        data-share-card-ready={bgReady ? "true" : "false"}
      >
        <div
          className={inviteShareCardClass}
          style={{
            width: REFERRAL_SHARE_CARD_WIDTH + REFERRAL_SHARE_CARD_EXPORT_PADDING * 2,
            height: REFERRAL_SHARE_CARD_HEIGHT + REFERRAL_SHARE_CARD_EXPORT_PADDING * 2,
            padding: REFERRAL_SHARE_CARD_EXPORT_PADDING,
          }}
        >
          <img
            ref={imgRef}
            src={REFERRAL_SHARE_CARD_IMAGE_PATH}
            alt=""
            width={REFERRAL_SHARE_CARD_WIDTH}
            height={REFERRAL_SHARE_CARD_HEIGHT}
            className="absolute inset-0 block h-full w-full object-contain object-center"
            style={{
              width: REFERRAL_SHARE_CARD_WIDTH,
              height: REFERRAL_SHARE_CARD_HEIGHT,
              left: REFERRAL_SHARE_CARD_EXPORT_PADDING,
              top: REFERRAL_SHARE_CARD_EXPORT_PADDING,
            }}
            onLoad={handleBgLoad}
          />

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col px-5 pt-7 font-body">
            <div className="text-center">
              <p className={inviteShareCardTitleClass}>
                {t("shareCardTitle")}
                <br />
                <span className={inviteShareCardProfitClass}>{t("shareCardProfit")}</span>
              </p>

              {funderDisplay ? (
                <div className="mt-4">
                  <p className={inviteShareCardFunderClass}>{funderDisplay}</p>
                  <p className={inviteShareCardInviteClass}>
                    {t("shareCardInvite")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className={inviteShareCardQrWrapClass} aria-hidden="true">
            <QRCodeSVG
              value={fullLink}
              size={36}
              level="M"
              marginSize={0}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        </div>
      </div>
    );
  },
);
