"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";

import { inviteShareCardOuterClass } from "@/components/share/share-modal-ui";
import { cn } from "@/lib/cn";
import {
  formatShareCardInviteDisplay,
  formatSignedPortfolioPnl,
  getPortfolioPnlPeriodLabel,
} from "@/lib/portfolio/portfolio-format";
import {
  PORTFOLIO_PNL_SHARE_CARD_EXPORT_PADDING,
  PORTFOLIO_PNL_SHARE_CARD_HEIGHT,
  PORTFOLIO_PNL_SHARE_CARD_NEGATIVE_BG,
  PORTFOLIO_PNL_SHARE_CARD_POSITIVE_BG,
  PORTFOLIO_PNL_SHARE_CARD_QR_SIZE_PX,
  PORTFOLIO_PNL_SHARE_CARD_WIDTH,
  PORTFOLIO_PNL_CHART_NEGATIVE,
  PORTFOLIO_PNL_CHART_POSITIVE,
} from "@/lib/portfolio/share-card-config";
import { formatReferralFunderDisplay } from "@/lib/referral/format-funder-display";
import type { PortfolioSeriesPoint, PortfolioTimeRange } from "@/lib/portfolio/types";
import { WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";

import { PortfolioPnlAreaChart } from "./portfolio-pnl-area-chart";

export type PortfolioPnlShareCardProps = {
  series: PortfolioSeriesPoint[];
  range: PortfolioTimeRange;
  displayPnl: number;
  funderAddress?: string;
  fullLink: string;
  linkPrefix: string;
  referralCode: string;
  className?: string;
  onBackgroundReady?: () => void;
};

export const PortfolioPnlShareCard = forwardRef<
  HTMLDivElement,
  PortfolioPnlShareCardProps
>(function PortfolioPnlShareCard(
  {
    series,
    range,
    displayPnl,
    funderAddress,
    fullLink,
    linkPrefix,
    referralCode,
    className,
    onBackgroundReady,
  },
  ref,
) {
  const t = useTranslations("portfolio");
  const [bgReady, setBgReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const isPositive = displayPnl >= 0;
  const chartTone = isPositive
    ? PORTFOLIO_PNL_CHART_POSITIVE
    : PORTFOLIO_PNL_CHART_NEGATIVE;
  const backgroundPath = isPositive
    ? PORTFOLIO_PNL_SHARE_CARD_POSITIVE_BG
    : PORTFOLIO_PNL_SHARE_CARD_NEGATIVE_BG;
  const funderDisplay = formatReferralFunderDisplay(funderAddress);
  const inviteDisplay = formatShareCardInviteDisplay(
    linkPrefix,
    referralCode,
    fullLink,
  );

  function handleBgLoad() {
    setBgReady(true);
    onBackgroundReady?.();
  }

  useEffect(() => {
    setBgReady(false);
  }, [backgroundPath]);

  useEffect(() => {
    if (imgRef.current?.complete) {
      handleBgLoad();
    }
  }, [backgroundPath]);

  return (
    <div className={cn(inviteShareCardOuterClass, className)}>
      <div
        className="mx-auto box-border w-full max-w-full overflow-hidden rounded-[12px] bg-black"
        style={{
          width:
            PORTFOLIO_PNL_SHARE_CARD_WIDTH +
            PORTFOLIO_PNL_SHARE_CARD_EXPORT_PADDING * 2,
          maxWidth: "100%",
          padding: PORTFOLIO_PNL_SHARE_CARD_EXPORT_PADDING,
        }}
      >
        <div
          ref={ref}
          className="relative aspect-[773/419] w-full overflow-hidden rounded-[10px] bg-black"
          data-share-card-ready={bgReady ? "true" : "false"}
        >
          <img
            ref={imgRef}
            src={backgroundPath}
            alt=""
            className="pointer-events-none absolute inset-0 block h-full w-full object-cover object-center"
            onLoad={handleBgLoad}
          />

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col font-body text-white">
            <div className="flex items-center justify-between px-[3%] pt-[3%] relative">
              <div className="flex min-w-0 items-center gap-2">
                <WalletAvatarIcon
                  address={funderAddress}
                  className="size-6 shrink-0 rounded-full"
                />
                {funderDisplay ? (
                  <span className="truncate text-[16px] font-medium leading-normal text-white">
                    {funderDisplay}
                  </span>
                ) : null}
              </div>

              <img
                src="/logo-halo.svg"
                alt=""
                className="absolute right-0 top-0 -translate-y-1.5 w-auto shrink-0 object-contain object-right h-[60px]"
                aria-hidden="true"
              />
            </div>

            <div className="mt-[6%] flex flex-1 items-start gap-[4%] px-[5.5%]">
              <div className="flex min-w-0 shrink-0 flex-col">
                <p className="m-0 text-[16px] font-normal leading-normal text-white">
                  {getPortfolioPnlPeriodLabel(t, range)}
                </p>
                <p
                  className="m-0 mt-3 text-[30px] font-semibold leading-none"
                  style={{ color: chartTone.valueColor }}
                >
                  {formatSignedPortfolioPnl(displayPnl)}
                </p>
              </div>

              <div className="min-w-0 flex-1 self-stretch pt-[2%]">
                <PortfolioPnlAreaChart
                  series={series}
                  isPositive={isPositive}
                  interactive={false}
                  className="h-full min-h-[120px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-[3.7%] pb-[6%]">
              <div
                className="shrink-0 overflow-hidden rounded-[6px] border border-black bg-white p-[2px]"
                aria-hidden="true"
              >
                <QRCodeSVG
                  value={fullLink}
                  size={PORTFOLIO_PNL_SHARE_CARD_QR_SIZE_PX}
                  level="M"
                  marginSize={0}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <p className="m-0 truncate text-[14px] font-normal leading-normal text-white">
                {t("shareCardInviteLink", { link: inviteDisplay })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
