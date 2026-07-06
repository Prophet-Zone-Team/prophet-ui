"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";

import { inviteShareCardOuterClass } from "@/components/share/share-modal-ui";
import { cn } from "@/lib/cn";
import {
  formatShareCardInviteDisplay,
  formatSharePrice,
  getOutcomeToneClass,
} from "@/lib/portfolio/portfolio-format";
import {
  PORTFOLIO_POSITION_SHARE_BG,
  PORTFOLIO_POSITION_SHARE_CARD_EXPORT_PADDING,
  PORTFOLIO_POSITION_SHARE_CARD_QR_SIZE_PX,
  PORTFOLIO_POSITION_SHARE_CARD_QR_SIZE_PX_MOBILE,
  PORTFOLIO_POSITION_SHARE_CARD_WIDTH,
  PORTFOLIO_POSITION_SHARE_CASHED_OUT_BG,
} from "@/lib/portfolio/share-card-config";
import type { PortfolioMarketIcon } from "@/lib/portfolio/teams-condition";
import { formatReferralFunderDisplay } from "@/lib/referral/format-funder-display";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { UserPositionRecord } from "@/types/market";

import { PortfolioMarketIconView } from "./portfolio-market-icon";
import { useDevice } from "@/hooks/common/use-device";

export type PortfolioPositionShareVariant = "open" | "cashedOut";

export type PortfolioPositionShareCardProps = {
  position: UserPositionRecord;
  marketIcon: PortfolioMarketIcon;
  variant: PortfolioPositionShareVariant;
  cashedOutAmount?: number;
  funderAddress?: string;
  fullLink: string;
  linkPrefix: string;
  referralCode: string;
  className?: string;
  onBackgroundReady?: () => void;
};

export const PortfolioPositionShareCard = forwardRef<
  HTMLDivElement,
  PortfolioPositionShareCardProps
>(function PortfolioPositionShareCard(
  {
    position,
    marketIcon,
    variant,
    cashedOutAmount,
    funderAddress,
    fullLink,
    linkPrefix,
    referralCode,
    className,
    onBackgroundReady,
  },
  ref,
) {
  const isMobile = useDevice();
  const tPortfolio = useTranslations("portfolio");
  const tReferral = useTranslations("referral");
  const [bgReady, setBgReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const ticketBgPath =
    variant === "cashedOut"
      ? PORTFOLIO_POSITION_SHARE_CASHED_OUT_BG
      : PORTFOLIO_POSITION_SHARE_BG;
  const funderDisplay = formatReferralFunderDisplay(funderAddress);
  const inviteDisplay = formatShareCardInviteDisplay(
    linkPrefix,
    referralCode,
    fullLink,
  );
  const outcomePriceLabel = `${position.outcome} ${formatSharePrice(position.avgPrice)}`;
  const costAmount = formatTeamDetailMoney(position.initialValue);
  const toWinAmount =
    variant === "cashedOut" && cashedOutAmount != null
      ? formatTeamDetailMoney(cashedOutAmount)
      : formatTeamDetailMoney(position.size);

  function handleBgLoad() {
    setBgReady(true);
    onBackgroundReady?.();
  }

  useEffect(() => {
    setBgReady(false);
  }, [ticketBgPath]);

  useEffect(() => {
    if (imgRef.current?.complete) {
      handleBgLoad();
    }
  }, [ticketBgPath]);

  return (
    <div className={cn(inviteShareCardOuterClass, className)}>
      <div
        className="mx-auto box-border w-full max-w-full overflow-hidden rounded-[12px]"
        style={{
          width:
            PORTFOLIO_POSITION_SHARE_CARD_WIDTH +
            PORTFOLIO_POSITION_SHARE_CARD_EXPORT_PADDING * 2,
          maxWidth: "100%",
          padding: PORTFOLIO_POSITION_SHARE_CARD_EXPORT_PADDING,
        }}
      >
        <div
          ref={ref}
          className="relative aspect-[798/419] w-full overflow-hidden rounded-[10px] bg-gradient-to-b from-[#030538] to-[#00011b] shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          data-share-card-ready={bgReady ? "true" : "false"}
        >
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col font-body text-white md:flex-row">
            <div className="flex min-h-0 min-w-0 flex-col justify-between px-[3%] pb-[4%] pt-[3%] w-[57%] flex-none">
              <div>
                <p className="m-0 bg-gradient-to-b from-white from-[21.825%] to-[#bbd0fd] bg-clip-text text-[14px] md:text-[20px] font-semibold leading-normal text-transparent">
                  {tReferral("shareCardTitle")}
                  <br />
                  {tReferral("shareCardProfit")}
                </p>
              </div>

              <div className="mt-2 md:mt-0">
                {funderDisplay ? (
                  <p className="m-0 text-[12px] md:text-[16px] font-semibold leading-[1.5] text-[#7599ff]">
                    {funderDisplay}
                  </p>
                ) : null}
                <p className="m-0 text-[10px] md:text-[14px] leading-[1.5] text-white">
                  {tReferral("shareCardInvite")}
                </p>
              </div>

              <div className="mt-9 flex items-center gap-1.5 md:mt-0">
                <div
                  className="shrink-0 overflow-hidden rounded-[6px] border border-black bg-white p-[2px]"
                  aria-hidden="true"
                >
                  <QRCodeSVG
                    value={fullLink}
                    size={isMobile ? PORTFOLIO_POSITION_SHARE_CARD_QR_SIZE_PX_MOBILE : PORTFOLIO_POSITION_SHARE_CARD_QR_SIZE_PX}
                    level="M"
                    marginSize={0}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <p className="m-0 truncate text-[10px] font-normal leading-normal text-white">
                  {/* {tPortfolio("shareCardInviteLink", { link: inviteDisplay })} */}
                  {inviteDisplay}
                </p>
              </div>
            </div>

            <div className="w-[43%] shrink-0 absolute right-[2.5%] top-[8.8%] mx-0 h-[82%] aspect-auto">
              <img
                ref={imgRef}
                src={ticketBgPath}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 block h-full w-full object-contain object-center"
                onLoad={handleBgLoad}
              />

              <div className="absolute inset-0 flex flex-col px-[8%] pb-[6%] pt-[6%] text-black">
                <div className="flex items-start gap-2.5">
                  <PortfolioMarketIconView
                    icon={marketIcon}
                    fallbackOnError
                    className="!h-5 !w-5 md:!h-10 md:!w-10 shrink-0 rounded-[6px] border border-white shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                    flagClassName="!h-5 !w-5 md:!h-10 md:!w-10 shrink-0 rounded-[6px] object-cover"
                  />
                  <p className="m-0 line-clamp-3 text-[10px] md:text-[12px] font-medium leading-[1.1] text-black">
                    {position.title}
                  </p>
                </div>

                <p
                  className={cn(
                    "m-0 mt-0 md:mt-2 text-[10px] md:text-[12px] font-medium leading-normal",
                    getOutcomeToneClass(position.outcome),
                  )}
                >
                  {outcomePriceLabel}
                </p>

                <div className="mt-0 md:mt-1 flex items-center justify-between gap-3">
                  <span className="text-[10px] md:text-[12px] font-normal text-black">
                    {tPortfolio("sharePositionCost")}
                  </span>
                  <span className="border-t border-dotted border-black/30 flex-1" />
                  <span className="text-[10px] md:text-[12px] font-semibold text-black">
                    {costAmount}
                  </span>
                </div>

                <div className="mt-auto flex flex-col items-center pb-4">
                  <span className="text-[12px] font-normal text-black">
                    {tPortfolio("toWin")}
                  </span>
                  <span className="mt-1 text-[14px] md:text-[18px] font-semibold leading-none text-black">
                    {toWinAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
