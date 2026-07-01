import { useTranslations } from "next-intl";
import { RefObject, useState } from "react";
import { useCopyWithToast } from "../use-copy-with-toast";
import { isProphetAuthenticated, ProphetApiError, uploadProphetFile } from "@/service/prophet";
import { toast } from "sonner";
import { renderShareCardBlob } from "@/lib/referral/render-share-card";
import { writeReferralShareImageCache } from "@/lib/referral/referral-share-image-cache";
import { resolveOrigin } from "@/lib/referral/referral-link";
import { shareToX } from "@/utils/x";
import { REFERRAL_TELEGRAM_SHARE_URL } from "@/lib/referral/config";
import { trackCopyLinkClicked, trackShareClicked } from "@/lib/analytics/tracking";
import { downloadShareCardPng } from "@/lib/referral/download-share-card";

export type ShareImageCacheKey = {
  referralCode: string;
  funderAddress?: string;
};

export type UseShareProps = {
  shareCardReady: boolean;
  shareImageUploadMode: "cache" | "always";
  shareImageCacheKey?: ShareImageCacheKey;
  shareCardRef: RefObject<HTMLDivElement | null>;
  downloadFilename?: string;
  fullLink: string;
  tweetText?: string;
  hashtags?: string;
  onAfterTwitterOpen?: () => void;
};

export function useShare(props: UseShareProps) {
  const {
    shareCardReady,
    shareImageUploadMode,
    shareImageCacheKey,
    shareCardRef,
    downloadFilename,
    fullLink,
    tweetText,
    hashtags,
    onAfterTwitterOpen,
  } = props;

  const t = useTranslations("referral");
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { copiedVisible, copy } = useCopyWithToast();

  const handleTwitter = async () => {
    if (!shareCardReady || sharing) {
      return;
    }

    if (!isProphetAuthenticated()) {
      toast.error(t("shareUploadAuthRequired"));
      return;
    }

    setSharing(true);

    try {
      let imgUrl: string | null = null;

      if (
        shareImageUploadMode === "cache" &&
        shareImageCacheKey?.referralCode
      ) {
        // imgUrl = readReferralShareImageCache(shareImageCacheKey);
      }

      if (!imgUrl) {
        const element = shareCardRef.current;
        if (!element) {
          toast.error(t("shareCardNotReady"));
          return;
        }

        const blob = await renderShareCardBlob(element);
        if (!blob) {
          toast.error(t("shareCardNotReady"));
          return;
        }

        const uploadResult = await uploadProphetFile(blob);
        imgUrl = uploadResult.url;

        if (
          shareImageUploadMode === "cache" &&
          shareImageCacheKey?.referralCode
        ) {
          writeReferralShareImageCache({
            ...shareImageCacheKey,
            url: imgUrl
          });
        }
      }

      // imgUrl = "https://assets.dapdap.net/monad/upload/47a465d1-47cd-4d0c-8933-568ff1e6f862";

      const origin = resolveOrigin();
      const tweetUrl = `${origin}/api/twitter?img=${encodeURIComponent(imgUrl)}&link=${encodeURIComponent(fullLink)}`;
      shareToX(tweetText ?? t("shareTweetIntro"), `${tweetUrl}\n\n`, {
        hashtags: hashtags ?? "Prophet,PredictionMarkets,WorldCup2026,Polymarket"
      });
      onAfterTwitterOpen?.();
    } catch (error) {
      if (error instanceof ProphetApiError) {
        toast.error(error.message);
      } else {
        toast.error(t("shareUploadError"));
      }
    } finally {
      setSharing(false);
    }
  };

  const handleTelegram = () => {
    if (!REFERRAL_TELEGRAM_SHARE_URL) {
      return;
    }
    trackShareClicked({
      target: "telegram",
      label: "Share on Telegram",
      entrySource: "referral_invite_modal"
    });
    window.open(REFERRAL_TELEGRAM_SHARE_URL, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
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
  };

  const handleCopyLink = async () => {
    trackCopyLinkClicked({
      target: "referral_link",
      label: "Copy referral link",
      entrySource: "referral_invite_modal"
    });
    await copy(fullLink);
  };

  return {
    handleTwitter,
    handleTelegram,
    handleDownload,
    handleCopyLink,
    downloading,
    sharing,
    copiedVisible,
  };

}
