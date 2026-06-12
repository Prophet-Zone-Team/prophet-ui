"use client";

import { useCallback, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";

import { CopiedToast } from "@/components/feedback/copied-toast";
import { useCopyWithToast } from "@/hooks/use-copy-with-toast";
import {
  REFERRAL_TELEGRAM_SHARE_URL,
  REFERRAL_TWITTER_SHARE_URL,
} from "@/lib/referral/config";
import { downloadShareCardPng } from "@/lib/referral/download-share-card";
import { cn } from "@/lib/cn";

import { inviteActionButtonClass } from "./referral-ui";
import { DownloadIcon, LinkIcon, TelegramBrandIcon, XBrandIcon } from "./referral-icons";
import { shareToX } from "@/utils/x";

export type ReferralInviteActionsProps = {
  fullLink: string;
  shareCardRef: RefObject<HTMLDivElement | null>;
  shareCardReady: boolean;
  className?: string;
  downloadFilename?: string;
};

export function ReferralInviteActions({
  fullLink,
  shareCardRef,
  shareCardReady,
  className,
  downloadFilename,
}: ReferralInviteActionsProps) {
  const t = useTranslations("referral");
  const [downloading, setDownloading] = useState(false);
  const { copiedVisible, copy } = useCopyWithToast();

  const handleTwitter = useCallback(() => {
    shareToX(
      t("shareTweetIntro"),
      `${fullLink}\n\n`,
      { hashtags: "Prophet,PredictionMarkets,WorldCup2026,Polymarket" },
    );
  }, [fullLink, t]);

  const handleTelegram = useCallback(() => {
    if (!REFERRAL_TELEGRAM_SHARE_URL) {
      return;
    }
    window.open(REFERRAL_TELEGRAM_SHARE_URL, "_blank", "noopener,noreferrer");
  }, []);

  const handleDownload = useCallback(async () => {
    const element = shareCardRef.current;
    if (!element || !shareCardReady || downloading) {
      return;
    }

    setDownloading(true);
    try {
      await downloadShareCardPng(element, downloadFilename);
    } finally {
      setDownloading(false);
    }
  }, [downloadFilename, downloading, shareCardReady, shareCardRef]);

  const handleCopyLink = useCallback(async () => {
    await copy(fullLink);
  }, [copy, fullLink]);

  return (
    <div className={cn("relative grid grid-cols-4 gap-3", className)}>
      <button
        type="button"
        className={inviteActionButtonClass}
        aria-label={t("shareOnX")}
        title={REFERRAL_TWITTER_SHARE_URL ? undefined : t("comingSoon")}
        onClick={handleTwitter}
      >
        <XBrandIcon />
      </button>

      <button
        type="button"
        className={inviteActionButtonClass}
        aria-label={t("shareOnTelegram")}
        title={REFERRAL_TELEGRAM_SHARE_URL ? undefined : t("comingSoon")}
        onClick={handleTelegram}
      >
        <TelegramBrandIcon />
      </button>

      <button
        type="button"
        className={inviteActionButtonClass}
        aria-label={t("downloadShareCard")}
        aria-busy={downloading}
        disabled={!shareCardReady || downloading}
        onClick={() => void handleDownload()}
      >
        <DownloadIcon />
      </button>

      <button
        type="button"
        className={inviteActionButtonClass}
        aria-label={t("copyReferralLink")}
        onClick={() => void handleCopyLink()}
      >
        <LinkIcon />
      </button>

      <CopiedToast
        visible={copiedVisible}
        className="absolute right-0 top-0 z-10 -translate-y-[calc(100%+8px)]"
      />
    </div>
  );
}
