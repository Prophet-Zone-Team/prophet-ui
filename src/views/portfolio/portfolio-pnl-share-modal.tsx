"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";
import { PORTFOLIO_PNL_SHARE_CARD_DOWNLOAD_FILENAME } from "@/lib/portfolio/share-card-config";
import { resolveShareInviteLink } from "@/lib/referral/share-link";
import type { PortfolioSeriesPoint, PortfolioTimeRange } from "@/lib/portfolio/types";

import { PortfolioPnlShareCard } from "./portfolio-pnl-share-card";

export type PortfolioPnlShareModalProps = {
  open: boolean;
  onClose: () => void;
  series: PortfolioSeriesPoint[];
  range: PortfolioTimeRange;
  displayPnl: number;
  funderAddress?: string;
};

export function PortfolioPnlShareModal({
  open,
  onClose,
  series,
  range,
  displayPnl,
  funderAddress,
}: PortfolioPnlShareModalProps) {
  const t = useTranslations("portfolio");
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCardReady, setShareCardReady] = useState(false);
  const { content: referralContent } = useProphetReferral();

  const inviteLink = useMemo(
    () => resolveShareInviteLink(referralContent?.kickback),
    [referralContent?.kickback],
  );

  useEffect(() => {
    setShareCardReady(false);
  }, [open, series, range, displayPnl]);

  return (
    <ShareInviteModal
      open={open}
      onClose={onClose}
      ariaLabel={t("sharePnlAria")}
      linkPrefix={inviteLink.linkPrefix}
      referralCode={inviteLink.referralCode}
      fullLink={inviteLink.fullLink}
      downloadFilename={PORTFOLIO_PNL_SHARE_CARD_DOWNLOAD_FILENAME}
      shareCardReady={shareCardReady}
      cardRef={cardRef}
      shareImageUploadMode="always"
      showInviteLinkRow={false}
      modalShellClass="md:w-[550px] px-1 md:px-3"
      shareTweetText=""
      shareTweetHashtags="Prophet,WorldCup2026"
    >
      <PortfolioPnlShareCard
        ref={cardRef}
        series={series}
        range={range}
        displayPnl={displayPnl}
        funderAddress={funderAddress}
        fullLink={inviteLink.fullLink}
        linkPrefix={inviteLink.linkPrefix}
        referralCode={inviteLink.referralCode}
        onBackgroundReady={() => setShareCardReady(true)}
      />
    </ShareInviteModal>
  );
}
