"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { inviteShareCardOuterClass } from "@/components/share/share-modal-ui";
import { cn } from "@/lib/cn";
import {
  COMBO_CASHOUT_COUPON_IMAGE_PATH,
  COMBO_SHARE_CARD_EXPORT_PADDING,
  COMBO_SHARE_CARD_HEIGHT,
  COMBO_SHARE_CARD_WIDTH,
  COMBO_SHARE_COUPON_COLUMN_WIDTH_PX,
} from "@/lib/combo/share-card-config";
import type { PortfolioComboPositionCard, PortfolioComboPositionPick } from "@/lib/portfolio/combo-positions/types";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { formatComboPicksLabel } from "@/views/combo/combo-widget/formatters";
import { PositionPickTeamFlag } from "@/views/combo/position-card/position-pick-team-flag";
import { resolvePickTeamFromMarketTitle } from "@/views/combo/position-card/resolve-pick-team";

import { buildComboPicksSummary } from "./build-combo-pick-summary";
import { ComboShareReferralPanel } from "./combo-share-referral-panel";
import { formatCashoutReturnPercent } from "./format-cashout-return";
import { TeamFlag } from "@/components/teams/team-flag";

export type ComboPositionCashoutShareCardProps = {
  combo: PortfolioComboPositionCard | null;
  stakeAmount: number;
  cashoutAmount: number;
  fullLink: string;
  displayLink: string;
  funderAddress?: string;
  className?: string;
  onBackgroundReady?: () => void;
};

export const ComboPositionCashoutShareCard = forwardRef<
  HTMLDivElement,
  ComboPositionCashoutShareCardProps
>(function ComboPositionCashoutShareCard(
  {
    combo,
    stakeAmount,
    cashoutAmount,
    fullLink,
    displayLink,
    funderAddress,
    className,
    onBackgroundReady,
  },
  ref,
) {
  const picks = combo?.picks ?? [];
  console.log("picks: %o", picks);
  const t = useTranslations("portfolio");
  const [bgReady, setBgReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const previewWidth =
    COMBO_SHARE_CARD_WIDTH + COMBO_SHARE_CARD_EXPORT_PADDING * 2;
  const previewHeight =
    COMBO_SHARE_CARD_HEIGHT + COMBO_SHARE_CARD_EXPORT_PADDING * 2;
  const summary = buildComboPicksSummary(picks);
  const returnPercent = formatCashoutReturnPercent(stakeAmount, cashoutAmount);
  const displayFlags = picks.slice(0, 3);

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
      className={cn(inviteShareCardOuterClass, className, "rounded-[14px] w-full h-full")}
      data-share-card-ready={bgReady ? "true" : "false"}
    >
      <div className="box-border h-full w-full rounded-[12px] p-1 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
        <div
          ref={ref}
          className="grid grid-cols-2 h-full w-full overflow-hidden rounded-[10px] bg-gradient-to-b from-[#030538] to-[#00011b]"
          data-share-card-ready={bgReady ? "true" : "false"}
        >
          <ComboShareReferralPanel
            fullLink={fullLink}
            displayLink={displayLink}
            funderAddress={funderAddress}
            align="left"
          />

          <div className="h-full p-[20px]">
            <div className="relative flex shrink-0 flex-col px-3 pb-4 pt-2 w-full h-full">
              <img
                ref={imgRef}
                src={COMBO_CASHOUT_COUPON_IMAGE_PATH}
                alt=""
                className="pointer-events-none absolute inset-0 block h-full w-full object-fill"
                onLoad={handleBgLoad}
              />

              <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                <div className="flex justify-end pr-1 pt-1">
                  <span className="text-sm font-[500] leading-[18px] text-black">
                    {formatComboPicksLabel(picks.length)}
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-2 px-2 py-2 text-center">
                  <div className="flex justify-center -space-x-2">
                    {displayFlags.map((pick) => {
                      return (
                        <TeamFlag
                          key={pick.id}
                          name={pick.team.code}
                          className="!size-8 rounded-[6px] border border-white shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                        />
                      );
                    })}
                  </div>

                  <p className="m-0 text-base font-[500] leading-snug text-black">
                    {summary}
                  </p>
                </div>

                <div className="mt-auto flex flex-col items-center gap-2 px-2 pb-1 pt-2 text-center">
                  <span className="text-sm font-[400] leading-[18px] text-black">
                    {t("comboCashedOut")}
                  </span>
                  <span className="text-[32px] font-[600] leading-none text-[#69C800]">
                    {formatTeamDetailMoney(cashoutAmount)}
                  </span>
                  {returnPercent ? (
                    <span className="text-base font-[500] leading-none text-[#69C800]">
                      {returnPercent}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});
