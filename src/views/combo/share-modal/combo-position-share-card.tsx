"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";

import { inviteShareCardOuterClass } from "@/components/share/share-modal-ui";
import { cn } from "@/lib/cn";
import {
  COMBO_SHARE_CARD_EXPORT_PADDING,
  COMBO_SHARE_CARD_HEIGHT,
  COMBO_SHARE_CARD_WIDTH,
  COMBO_SHARE_COUPON_IMAGE_PATH,
} from "@/lib/combo/share-card-config";
import { waitForElementImages } from "@/lib/referral/wait-for-element-images";
import { inlineExternalImagesForCapture } from "@/lib/referral/inline-external-images-for-capture";
import type { PortfolioComboPositionPick } from "@/lib/portfolio/combo-positions/types";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { PositionCardModalPickList } from "@/views/combo/position-card-modal/position-card-modal-pick-list";
import {
  formatComboMultiplierLabel,
} from "@/views/combo/combo-widget/formatters";

import { ComboShareReferralPanel } from "./combo-share-referral-panel";

export type ComboPositionShareCardProps = {
  picks: PortfolioComboPositionPick[];
  multiplier: number;
  stakeAmount: number;
  toWinAmount: number;
  fullLink: string;
  displayLink: string;
  funderAddress?: string;
  className?: string;
  onBackgroundReady?: () => void;
};

export const ComboPositionShareCard = forwardRef<
  HTMLDivElement,
  ComboPositionShareCardProps
>(function ComboPositionShareCard(
  {
    picks,
    multiplier,
    stakeAmount,
    toWinAmount,
    fullLink,
    displayLink,
    funderAddress,
    className,
    onBackgroundReady,
  },
  ref,
) {
  const t = useTranslations("portfolio");
  const [shareAssetsReady, setShareAssetsReady] = useState(false);
  const [couponReady, setCouponReady] = useState(false);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const onBackgroundReadyRef = useRef(onBackgroundReady);

  onBackgroundReadyRef.current = onBackgroundReady;

  const setCaptureRef = useCallback(
    (node: HTMLDivElement | null) => {
      captureRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  useEffect(() => {
    setShareAssetsReady(false);
    setCouponReady(imgRef.current?.complete ?? false);
  }, [picks]);

  useEffect(() => {
    if (!couponReady || !captureRef.current) {
      return undefined;
    }

    let cancelled = false;

    void (async () => {
      await inlineExternalImagesForCapture(captureRef.current!);
      await waitForElementImages(captureRef.current!);

      if (!cancelled) {
        setShareAssetsReady(true);
        onBackgroundReadyRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [couponReady, picks]);

  return (
    <div
      className={cn(inviteShareCardOuterClass, className, "rounded-[14px] w-full h-full")}
      data-share-card-ready={shareAssetsReady ? "true" : "false"}
    >
      <div className="box-border h-full w-full rounded-[12px] p-1 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
        <div
          ref={setCaptureRef}
          className="grid grid-cols-2 h-full w-full overflow-hidden rounded-[10px] bg-gradient-to-b from-[#030538] to-[#00011b]"
          data-share-card-ready={shareAssetsReady ? "true" : "false"}
        >
          <div className="h-full p-[20px]">
            <div className="relative flex shrink-0 flex-col px-3 pb-4 pt-2 w-full h-full">
              <img
                ref={imgRef}
                src={COMBO_SHARE_COUPON_IMAGE_PATH}
                alt=""
                className="pointer-events-none absolute inset-0 block h-full w-full object-fill"
                onLoad={() => setCouponReady(true)}
              />

              <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                <div className="flex justify-end pr-1 pt-1">
                  <span className="text-sm font-[500] leading-[18px] text-black">
                    {t("comboBuyPicks", { count: picks.length })}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden pt-1 pb-4">
                  <PositionCardModalPickList
                    picks={picks}
                    className="px-2 pb-0 pt-2"
                    connectorHeightPx={20}
                    tone="export"
                  />
                </div>

                <div className="mt-auto flex items-end justify-between gap-2 px-1 pb-1 pt-2">
                  <span className="inline-flex h-9 min-w-[68px] items-center justify-center rounded-[26px] bg-black px-3 text-lg font-[500] leading-none text-white">
                    {formatComboMultiplierLabel(multiplier)}
                  </span>

                  <div className="flex flex-col items-end text-right gap-1">
                    <span className="text-sm font-[400] leading-[18px] text-black">
                      {t("comboShareToWin", {
                        amount: formatTeamDetailMoney(stakeAmount),
                      })}
                    </span>
                    <span className="text-[24px] font-[500] leading-none text-[#69C800]">
                      {formatTeamDetailMoney(toWinAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ComboShareReferralPanel
            fullLink={fullLink}
            displayLink={displayLink}
            funderAddress={funderAddress}
            align="right"
          />
        </div>
      </div>
    </div>
  );
});
