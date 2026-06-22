"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ShareInviteModal } from "@/components/share/share-invite-modal";
import { useSubmitWinnerPrediction } from "@/hooks/road-to-final/use-submit-winner-prediction";
import { useShare } from "@/hooks/referral/use-share";
import { ROAD_TO_FINAL_SHARE_CARD_DOWNLOAD_FILENAME } from "@/lib/road-to-final/share-card-config";
import { resolveShareInviteLink } from "@/lib/referral/share-link";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { PathResult } from "@/types/market";
import type { ReferralKickback } from "@/types/referral";
import { Loader2 } from "lucide-react";

import {
  buildShareCardChampion,
  buildShareCardStages,
  resolveShareCardPathResult,
} from "./lib/build-share-card-stages";
import type { GroupPlacements, KnockoutWinners } from "./types";
import { RoadToFinalShareCard } from "./road-to-final-share-card";
import { TweetUrlSubmitModal } from "./tweet-url-submit-modal";

export type RoadToFinalShareModalProps = {
  open: boolean;
  onClose: () => void;
  teamId: string;
  championTeamId?: string;
  advancingThirdGroups: string[];
  result?: PathResult;
  placements: GroupPlacements;
  knockoutWinners: KnockoutWinners;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  funderAddress?: string;
  kickback?: ReferralKickback;
  availableChances: number;
};

export function RoadToFinalShareModal({
  open,
  onClose,
  teamId,
  championTeamId,
  advancingThirdGroups,
  result,
  placements,
  knockoutWinners,
  thirdPlaceOption,
  funderAddress,
  kickback,
  availableChances,
}: RoadToFinalShareModalProps) {
  const t = useTranslations("roadToFinal");
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareCardReady, setShareCardReady] = useState(false);
  const [tweetUrlOpen, setTweetUrlOpen] = useState(false);

  const inviteLink = useMemo(
    () => resolveShareInviteLink(kickback),
    [kickback],
  );

  const { submit, isSubmitting } = useSubmitWinnerPrediction({
    knockoutWinners,
    placements,
    thirdPlaceOption,
  });

  const {
    handleTwitter,
    handleDownload,
    downloading,
    sharing,
  } = useShare({
    shareCardReady,
    shareImageUploadMode: "always",
    shareCardRef: cardRef,
    downloadFilename: ROAD_TO_FINAL_SHARE_CARD_DOWNLOAD_FILENAME,
    fullLink: inviteLink.fullLink,
    tweetText: "Think you can call the World Cup? \n\nBuild your full bracket on Prophet — groups, knockouts, finalists, champion.\n\nBack your picks with $10+ in trades. \n\nThe most accurate bracket wins $10,000.\n\nUse the Prophet. Make Profit.\n\n",
    hashtags: "Prophet,WorldCup2026",
    onAfterTwitterOpen: () => setTweetUrlOpen(true),
  });

  const { simulationTeamId, simulationResult } = useMemo(
    () =>
      resolveShareCardPathResult({
        teamId,
        championTeamId,
        result,
        placements,
        advancingThirdGroups,
      }),
    [advancingThirdGroups, championTeamId, placements, result, teamId],
  );

  const stages = useMemo(() => {
    return buildShareCardStages({
      teamId: simulationTeamId,
      result: simulationResult,
      placements,
      knockoutWinners,
      thirdPlaceOption,
    });
  }, [
    knockoutWinners,
    placements,
    simulationResult,
    simulationTeamId,
    thirdPlaceOption,
  ]);

  const champion = useMemo(
    () => buildShareCardChampion(championTeamId),
    [championTeamId],
  );

  useEffect(() => {
    setShareCardReady(false);
  }, [champion, stages]);

  useEffect(() => {
    if (!open) {
      setTweetUrlOpen(false);
    }
  }, [open]);

  const handleTweetSubmit = async (twitterUrl: string) => {
    await submit(twitterUrl);
    setTweetUrlOpen(false);
    onClose();
  };

  return (
    <>
      <ShareInviteModal
        open={open}
        onClose={onClose}
        ariaLabel={t("shareSimulationResultAria")}
        linkPrefix={inviteLink.linkPrefix}
        referralCode={inviteLink.referralCode}
        fullLink={inviteLink.fullLink}
        downloadFilename={ROAD_TO_FINAL_SHARE_CARD_DOWNLOAD_FILENAME}
        shareCardReady={shareCardReady}
        cardRef={cardRef}
        shareImageUploadMode="always"
        modalShellClass="md:w-[550px] px-1 md:px-3"
        header={
          <h2 className="m-0 text-left text-[18px] font-[500] text-black">
            {t("shareModalTitle")}
          </h2>
        }
        content={(
          <div className="flex w-full flex-col items-stretch gap-3.5">
            <div className="flex items-center justify-between flex-col md:flex-row">
              <div className="text-sm font-normal text-black">
                {t("shareModalEntriesLabel", { count: availableChances })}
              </div>
              <div className="flex h-[32px] items-center justify-center gap-[6px] rounded-md bg-[rgba(253,211,87,0.2)] pl-[10px] pr-[14px] text-sm font-normal text-[#D1A00F]">
                <img
                  src="/icons/icon-info.svg"
                  alt=""
                  className="size-4 shrink-0 object-contain object-center"
                />
                <div>{t("shareModalXLinkRequired")}</div>
              </div>
            </div>
            <button
              type="button"
              className="flex h-[52px] items-center justify-center gap-3 rounded-xl bg-[linear-gradient(90deg,#F4B600_0%,#8E6A00_100%)] text-center text-sm font-normal text-white duration-150 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleTwitter}
              disabled={sharing}
            >
              {sharing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M7.1428 5.08177L11.6108 0H10.5524L6.6712 4.41152L3.5736 0H0L4.6852 6.67164L0 12H1.0584L5.1544 7.34028L8.4264 12H12M1.4404 0.780949H3.0664L10.5516 11.2574H8.9252"
                      fill="white"
                    />
                  </svg>
                  <div>{t("shareOnXAndJoinCampaign")}</div>
                </>
              )}
            </button>
            <button
              type="button"
              className="flex h-[52px] items-center justify-center gap-3 rounded-xl bg-[#EBEBEB] text-center text-sm font-normal text-black duration-150 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
                    <path
                      d="M17.1143 10.8975C17.3061 10.902 17.4884 10.9805 17.624 11.1162C17.7597 11.2519 17.8382 11.4342 17.8428 11.626C17.8427 14.0555 16.0913 16 13.9531 16H3.88965C1.75158 15.9999 3.47915e-05 14.0555 0 11.626C0.00453158 11.4342 0.0831487 11.2519 0.21875 11.1162C0.354383 10.9806 0.53676 10.902 0.728516 10.8975C0.920322 10.902 1.10359 10.9805 1.23926 11.1162C1.37464 11.2518 1.4525 11.4344 1.45703 11.626C1.45706 13.2288 2.52774 14.531 3.88965 14.543H13.9531C15.3151 14.543 16.3857 13.2288 16.3857 11.626C16.3903 11.4342 16.4689 11.2519 16.6045 11.1162C16.7401 10.9806 16.9225 10.902 17.1143 10.8975ZM8.99512 0C9.18095 8.11803e-05 9.35958 0.0710947 9.49512 0.198242C9.63064 0.325383 9.71267 0.499141 9.72461 0.68457V8.95215L11.2324 7.44434C11.3703 7.32254 11.5495 7.258 11.7334 7.26367C11.9171 7.26935 12.0917 7.34477 12.2217 7.47461C12.3517 7.60468 12.4279 7.78001 12.4336 7.96387C12.4392 8.14763 12.3747 8.32707 12.2529 8.46484L9.48145 11.2363C9.33097 11.3611 9.14079 11.4287 8.94531 11.4287C8.74998 11.4286 8.56052 11.361 8.41016 11.2363L5.7373 8.46484C5.61556 8.32706 5.55103 8.14764 5.55664 7.96387C5.56231 7.78001 5.63751 7.60468 5.76758 7.47461C5.89754 7.34474 6.07223 7.26943 6.25586 7.26367C6.43966 7.258 6.61901 7.32261 6.75684 7.44434L8.26465 8.95215V0.68457C8.27658 0.499208 8.35872 0.325375 8.49414 0.198242C8.62975 0.0710137 8.80917 0 8.99512 0Z"
                      fill="black"
                    />
                  </svg>
                  <div>{t("saveImage")}</div>
                </>
              )}
            </button>
          </div>
        )}
      >
        <RoadToFinalShareCard
          ref={cardRef}
          stages={stages}
          champion={champion}
          fullLink={inviteLink.fullLink}
          displayLink={inviteLink.displayLink}
          funderAddress={funderAddress}
          onBackgroundReady={() => setShareCardReady(true)}
        />
      </ShareInviteModal>

      <TweetUrlSubmitModal
        open={tweetUrlOpen}
        onClose={() => setTweetUrlOpen(false)}
        onSubmit={handleTweetSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
