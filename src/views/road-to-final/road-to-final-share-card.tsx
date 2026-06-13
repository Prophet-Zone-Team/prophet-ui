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
    <div className={cn("shrink-0 flex items-center", teams.length < 4 ? "gap-[13px]" : "gap-[4px]")}>
      {teams.map((team) => (
        <TeamFlag
          key={team.id}
          code={team.code}
          name={team.name}
          className="shrink-0 !size-[16px] rounded-[4px]"
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
  const previewWidth =
    ROAD_TO_FINAL_SHARE_CARD_WIDTH + ROAD_TO_FINAL_SHARE_CARD_EXPORT_PADDING * 2;
  const previewHeight =
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

  return (
    <div
      className={cn(inviteShareCardOuterClass, className, "rounded-[14px]")}
      data-share-card-ready={bgReady ? "true" : "false"}
      style={{
        width: previewWidth,
        height: previewHeight,
        overflow: "hidden",
      }}
    >
      <div className="origin-top-left w-full h-full">
        <div
          className="w-full h-full p-1 relative overflow-hidden rounded-[12px] shadow-[0_0_20px_rgba(0,0,0,0.2)]"
        >
          <div ref={ref} className="w-full h-full relative">
            <img
              ref={imgRef}
              src={ROAD_TO_FINAL_SHARE_CARD_IMAGE_PATH}
              alt=""
              width="100%"
              height="100%"
              className="w-full h-full absolute block object-cover object-center pointer-events-none rounded-[10px]"
              onLoad={handleBgLoad}
            />

            <div
              className="absolute z-10 font-body text-white flex flex-row-reverse justify-end items-center w-full h-full"
            >
              <div className="relative shrink-0 mr-[10px] mx-auto w-[110px] h-[130px] rounded-[10px] border-[4px] border-[rgba(255,255,255,0.30)]">
                <div className="relative flex flex-col items-center justify-center gap-[10px] w-full h-full bg-[rgba(130,163,255,0.10)] border-[1px] border-[#FFFFFF] rounded-[6px] backdrop-blur-[10px]">
                  {funderDisplay ? (
                    <p className="text-center text-[12px] font-semibold leading-[1.5] text-white">
                      {funderDisplay}
                    </p>
                  ) : null}

                  <p className="text-center text-[10px] font-medium capitalize leading-normal text-white/60">
                    {t("worldCupSimulation")}
                  </p>

                  {champion ? (
                    <div className="flex items-center gap-3 justify-center">
                      <TeamFlag
                        code={champion.code}
                        name={champion.name}
                        className="h-[28px] w-[28px] shrink-0 min-w-[28px] rounded-[4px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
                      />
                      <p className="whitespace-nowrap text-[12px] font-medium leading-normal text-white">
                        <ChampionName champion={champion} />
                      </p>
                    </div>
                  ) : (
                    <p className="whitespace-nowrap text-center text-[12px] font-medium text-white/80">
                      {t("championPending")}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative flex-1 w-full flex flex-row-reverse justify-start items-center pr-[15px]">
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
                        paddingTop: index % 2 === 0 ? "0px" : "100px",
                        paddingBottom: index % 2 === 0 ? "100px" : "0px",
                        marginRight: index !== 0 ? "-37px" : "0px",
                      }}
                    >
                      <div
                        className="relative flex flex-col items-center justify-center bg-[rgba(130,163,255,0.10)] rounded-[10px] border border-[#FFFFFF] backdrop-blur-[10px] gap-1"
                        style={{
                          width: "90px",
                          height: "56px",
                        }}
                      >
                        <p className="m-0 whitespace-nowrap text-[10px] font-medium uppercase leading-normal text-white">
                          {translateShareStageLabel(stage.key, stage.label, t)}
                        </p>
                        <StageFlags stage={stage} />
                      </div>
                    </div>
                  );
                })}

                <div className="h-[1px] w-full absolute top-1/2 -translate-y-1/2 right-0 z-[1] bg-[#EBEBEB] flex flex-row-reverse items-center gap-x-[36px] pr-[50px]">
                  {
                    stages.map((stage, index) => {
                      return (
                        <div
                          key={index}
                          className="relative size-[17px] shrink-0 rounded-full border-[4px] border-[rgba(255,255,255,0.30)]"
                        >
                          <div className="w-full h-full bg-white rounded-full"></div>
                          <div
                            className="absolute left-1/2 -translate-x-1/2 w-[1px] h-[70px] bg-[#EBEBEB]"
                            style={{
                              top: index % 2 === 0 ? "unset" : "0px",
                              bottom: index % 2 === 0 ? "0px" : "unset",
                            }}
                          ></div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>

              <div
                className="absolute rounded-[4px] border border-black bg-white p-[2px] right-[10px] bottom-[10px]"
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

              <p className="absolute right-[60px] rounded-[4px] flex justify-center items-center bottom-[10px] m-0 truncate text-[9px] font-normal leading-normal text-white/80 border h-[24px] px-[6px] border-[rgba(255,255,255,0.30)] backdrop-blur-[3px] bg-[rgba(130,163,255,0.10)]">
                {t("inviteLink", { link: inviteLabel })}
              </p>
            </div>
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
