"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { inviteShareCardOuterClass } from "@/components/share/share-modal-ui";
import { cn } from "@/lib/cn";
import { formatReferralFunderDisplay } from "@/lib/referral/format-funder-display";
import {
  ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING,
  ROAD_TO_FINAL_SHARE_CARD_HEIGHT,
  ROAD_TO_FINAL_SHARE_CARD_IMAGE_PATH,
  ROAD_TO_FINAL_SHARE_CARD_PREVIEW_WIDTH,
  ROAD_TO_FINAL_SHARE_CARD_WIDTH,
} from "@/lib/road-to-final/share-card-config";

import type { ShareCardStage, ShareCardTeam } from "./lib/build-share-card-stages";
import { translateShareStageLabel } from "./lib/i18n-labels";
import {
  ROAD_SHARE_CARD_FOOTER,
} from "./road-to-final-share-card-layout";

export type RoadToFinalShareCardProps = {
  stages: ShareCardStage[];
  champion: ShareCardTeam | null;
  fullLink: string;
  displayLink: string;
  funderAddress?: string;
  className?: string;
  onBackgroundReady?: () => void;
};

function StageFlags({ stage }: { stage: ShareCardStage }) {
  const teams =
    stage.key === "GROUP"
      ? stage.opponents
      : [stage.focusTeam, ...stage.opponents];

  return (
    <div className={cn("shrink-0 flex items-center", teams.length < 4 ? "gap-[50px]" : "gap-[12px]")}>
      {teams.map((team) => (
        <TeamFlag
          key={team.id}
          code={team.code}
          name={team.name}
          className="shrink-0 !size-[52px] rounded-xl"
        />
      ))}
    </div>
  );
}

export const RoadToFinalShareCard = forwardRef<
  HTMLDivElement,
  RoadToFinalShareCardProps
>(function RoadToFinalShareCard(
  {
    stages,
    champion,
    fullLink,
    displayLink,
    funderAddress,
    className,
    onBackgroundReady,
  },
  ref,
) {
  const t = useTranslations("roadToFinal");
  const [bgReady, setBgReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const funderDisplay = formatReferralFunderDisplay(funderAddress);
  const previewScale = ROAD_TO_FINAL_SHARE_CARD_PREVIEW_WIDTH / ROAD_TO_FINAL_SHARE_CARD_WIDTH;
  const designWidth =
    ROAD_TO_FINAL_SHARE_CARD_WIDTH + ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING * 2;
  const designHeight =
    ROAD_TO_FINAL_SHARE_CARD_HEIGHT + ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING * 2;

  function handleBgLoad() {
    setBgReady(true);
    onBackgroundReady?.();
  }

  useEffect(() => {
    if (imgRef.current?.complete) {
      handleBgLoad();
    }
  }, []);

  const inviteLabel = displayLink.replace(/^https?:\/\//, "");

  const previewWidth = designWidth * previewScale;
  const previewHeight = designHeight * previewScale;

  return (
    <div
      className={cn(inviteShareCardOuterClass, className)}
      data-share-card-ready={bgReady ? "true" : "false"}
      style={{
        width: previewWidth,
        height: previewHeight,
        overflow: "hidden",
      }}
    >
      <div
        className="origin-top-left"
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${previewScale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          ref={ref}
          className="relative overflow-hidden rounded-[30px] shadow-[0_0_20px_rgba(0,0,0,0.2)]"
          style={{
            width: designWidth,
            height: designHeight,
            padding: ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING,
          }}
        >
        <img
          ref={imgRef}
          src={ROAD_TO_FINAL_SHARE_CARD_IMAGE_PATH}
          alt=""
          width={ROAD_TO_FINAL_SHARE_CARD_WIDTH}
          height={ROAD_TO_FINAL_SHARE_CARD_HEIGHT}
          className="absolute block object-cover object-center pointer-events-none"
          style={{
            width: ROAD_TO_FINAL_SHARE_CARD_WIDTH,
            height: ROAD_TO_FINAL_SHARE_CARD_HEIGHT,
            left: ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING,
            top: ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING,
          }}
          onLoad={handleBgLoad}
        />

        <div
          className="absolute z-10 font-body text-white flex flex-col items-center"
          style={{
            width: ROAD_TO_FINAL_SHARE_CARD_WIDTH,
            height: ROAD_TO_FINAL_SHARE_CARD_HEIGHT,
            left: ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING,
            top: ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING,
          }}
        >
          <div className="relative shrink-0 mt-[190px] mx-auto w-[590px] h-[354px] rounded-[30px] border-[16px] border-[rgba(255,255,255,0.30)]">
            <div className="relative pt-[31px] w-full h-full bg-[rgba(130,163,255,0.10)] border-[4px] border-[#FFFFFF] rounded-[18px] backdrop-blur-[10px]">
              {funderDisplay ? (
                <p className="text-center text-[36px] font-semibold leading-[1.5] text-white">
                  {funderDisplay}
                </p>
              ) : null}

              <p className="text-center text-[28px] font-medium capitalize leading-normal text-white/60">
                {t("worldCupSimulation")}
              </p>

              {champion ? (
                <div className="flex items-center gap-7 justify-center mt-[37px]">
                  <TeamFlag
                    code={champion.code}
                    name={champion.name}
                    className="h-[105px] w-[105px] shrink-0 min-w-[105px] rounded-[20px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                  />
                  <p className="whitespace-nowrap text-[52px] font-medium leading-normal text-white">
                    <ChampionName champion={champion} />
                  </p>
                </div>
              ) : (
                <p className="mt-[37px] whitespace-nowrap text-center text-[40px] font-medium text-white/80">
                  {t("championPending")}
                </p>
              )}
            </div>
          </div>

          <div className="relative flex-1 w-full pt-[50px] flex flex-col items-center">
            {stages.map((stage, index) => {
              const teams =
                stage.key === "GROUP"
                  ? stage.opponents
                  : [stage.focusTeam, ...stage.opponents];

              return (
                <div
                  className="relative z-[3] flex"
                  key={stage.key}
                  style={{
                    paddingLeft: index % 2 === 0 ? "0px" : "480px",
                    paddingRight: index % 2 === 0 ? "480px" : "0px",
                    marginTop: index !== 0 ? "-40px" : "0px",
                  }}
                >
                  <div
                    className="relative bg-[rgba(130,163,255,0.10)] rounded-[30px] border border-[#FFFFFF] backdrop-blur-[10px] py-[25px] flex flex-col items-center gap-5"
                    style={{
                      width: teams.length < 4 ? "274px" : "316px",
                    }}
                  >
                    <p className="m-0 whitespace-nowrap text-[28px] font-medium uppercase leading-normal text-white">
                      {translateShareStageLabel(stage.key, stage.label, t)}
                    </p>
                    <StageFlags stage={stage} />
                  </div>
                </div>
              );
            })}

            <div className="w-[1px] h-full absolute left-1/2 -translate-x-1/2 top-0 z-[1] bg-[#EBEBEB] flex flex-col items-center gap-y-[70px] pt-[110px]">
              {
                stages.map((stage, index) => {
                  return (
                    <div
                      key={index}
                      className="relative size-[56px] shrink-0 rounded-full border-[10px] border-[rgba(255,255,255,0.30)]"
                    >
                      <div className="w-full h-full bg-white rounded-full"></div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-[1px] w-[140px] bg-[#EBEBEB]"
                        style={{
                          left: index % 2 === 0 ? "unset" : "0px",
                          right: index % 2 === 0 ? "0px" : "unset",
                        }}
                      ></div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          <div
            className="absolute rounded-[12px] border border-black bg-white p-[2px] left-[48px] bottom-[57px]"
            aria-hidden="true"
          >
            <QRCodeSVG
              value={fullLink}
              size={ROAD_SHARE_CARD_FOOTER.qrSizePx}
              level="M"
              marginSize={0}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <p className="absolute left-[188px] rounded-xl flex justify-center items-center bottom-[57px] m-0 truncate text-[16px] font-normal leading-normal text-white/80 border h-[55px] px-[20px] border-[rgba(255,255,255,0.30)] backdrop-blur-[10px] bg-[rgba(130,163,255,0.10)]">
            {t("inviteLink", { link: inviteLabel })}
          </p>
        </div>
        </div>
      </div>
    </div>
  );
});

function ChampionName({ champion }: { champion: ShareCardTeam }) {
  const displayName = useLocalizedTeamName(champion.code, champion.name);

  return <>{displayName}</>;
}
