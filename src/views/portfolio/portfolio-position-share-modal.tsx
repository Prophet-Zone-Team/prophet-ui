"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import { useProphetReferral } from "@/hooks/referral/use-prophet-referral";
import { PORTFOLIO_POSITION_SHARE_CARD_DOWNLOAD_FILENAME } from "@/lib/portfolio/share-card-config";
import { resolveShareInviteLink } from "@/lib/referral/share-link";
import type { PortfolioMarketIcon } from "@/lib/portfolio/teams-condition";
import type { UserPositionRecord } from "@/types/market";

import {
  PortfolioPositionShareCard,
  type PortfolioPositionShareVariant,
} from "./portfolio-position-share-card";

export type PortfolioPositionShareModalProps = {
  open: boolean;
  onClose: () => void;
  position: UserPositionRecord;
  marketIcon: PortfolioMarketIcon;
  variant: PortfolioPositionShareVariant;
  cashedOutAmount?: number;
  funderAddress?: string;
};

export function PortfolioPositionShareModal({
  open,
  onClose,
  position,
  marketIcon,
  variant,
  cashedOutAmount,
  funderAddress,
}: PortfolioPositionShareModalProps) {
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
  }, [open, position.asset, variant, cashedOutAmount]);

  return (
    <ShareInviteModal
      open={open}
      onClose={onClose}
      ariaLabel={t("shareMyPositionAria")}
      header={
        <h2 className="m-0 text-left text-[18px] font-[500] text-prophet-foreground">
          {t("shareMyPosition")}
        </h2>
      }
      linkPrefix={inviteLink.linkPrefix}
      referralCode={inviteLink.referralCode}
      fullLink={inviteLink.fullLink}
      downloadFilename={PORTFOLIO_POSITION_SHARE_CARD_DOWNLOAD_FILENAME}
      shareCardReady={shareCardReady}
      cardRef={cardRef}
      shareImageUploadMode="always"
      showInviteLinkRow={false}
      modalShellClass="md:w-[550px] px-1 md:px-3"
      shareTweetText=""
      shareTweetHashtags="Prophet,WorldCup2026"
    >
      <PortfolioPositionShareCard
        ref={cardRef}
        position={position}
        marketIcon={marketIcon}
        variant={variant}
        cashedOutAmount={cashedOutAmount}
        funderAddress={funderAddress}
        fullLink={inviteLink.fullLink}
        linkPrefix={inviteLink.linkPrefix}
        referralCode={inviteLink.referralCode}
        onBackgroundReady={() => setShareCardReady(true)}
      />
    </ShareInviteModal>
  );
}
