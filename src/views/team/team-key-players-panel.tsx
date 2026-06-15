"use client";

import { useTranslations } from "next-intl";

import type { KeyPlayerView } from "@/lib/team/team-detail-model";
import { getInitials } from "@/lib/team/team-detail-model";
import { cn } from "@/lib/cn";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamKeyPlayersPanelProps {
  players: KeyPlayerView[];
}

const mobileTitleClassName =
  "font-[Sora] text-[14px] font-[500] leading-[18px] text-black";

const mobileNameClassName =
  "font-[Sora] text-[14px] font-[500] leading-[18px] text-black";

const mobileMetaClassName =
  "font-[Sora] text-[12px] font-[400] leading-[15px] text-[#979797]";

const mobileRankClassName =
  "font-[Sora] text-[14px] font-[500] leading-[18px] text-black";

const mobileAvatarClassName =
  "size-6 shrink-0 rounded-[2px] object-cover shadow-[0_0_2px_rgba(0,0,0,0.2)]";

function PlayerMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-prophet-muted">{label}</span>
      <strong
        className={cn(
          "font-[500]",
          tone === "down" && "text-prophet-red",
          tone === "up" && "text-prophet-green",
          !tone && "text-black"
        )}
      >
        {value}
      </strong>
    </div>
  );
}

function PlayerAvatar({ player }: { player: KeyPlayerView }) {
  if (player.logo) {
    return (
      <img
        src={player.logo}
        alt=""
        className={mobileAvatarClassName}
      />
    );
  }

  return (
    <span
      className={cn(
        mobileAvatarClassName,
        "flex items-center justify-center bg-[#f5f9ff] text-[9px] font-[500] text-[#125afc]"
      )}
    >
      {getInitials(player.name)}
    </span>
  );
}

function formatPlayerMeta(player: KeyPlayerView) {
  if (player.club) {
    return `${player.position} / ${player.club}`;
  }

  return player.position;
}

function formatPlayerRank(player: KeyPlayerView) {
  const rank = Math.round(player.formScore);

  if (rank > 0) {
    return `#${rank}`;
  }

  return null;
}

function MobileKeyPlayerRow({ player }: { player: KeyPlayerView }) {
  const rank = formatPlayerRank(player);

  return (
    <div className="flex items-center gap-3">
      <PlayerAvatar player={player} />
      <div className="min-w-0 flex-1">
        <p className={cn(mobileNameClassName, "m-0 truncate capitalize")}>
          {player.name}
        </p>
        <p className={cn(mobileMetaClassName, "m-0 mt-[2px] truncate")}>
          {formatPlayerMeta(player)}
        </p>
      </div>
      {rank ? (
        <span className={cn(mobileRankClassName, "shrink-0 text-right")}>
          {rank}
        </span>
      ) : null}
    </div>
  );
}

function MobileKeyPlayersPanel({ players }: TeamKeyPlayersPanelProps) {
  const t = useTranslations("teamDetail");

  return (
    <section
      className="overflow-hidden rounded-[12px] border border-[#EBEBEB] bg-white md:hidden"
      aria-label={t("keyPlayersAria")}
    >
      {players.length > 0 ? (
        <>
          <div className="px-4 pt-4 pb-3">
            <h2 className={cn(mobileTitleClassName, "m-0")}>{t("keyStars")}</h2>
          </div>
          <div className="flex flex-col gap-4 px-4 pb-4">
            {players.map((player) => (
              <MobileKeyPlayerRow key={player.name} player={player} />
            ))}
          </div>
        </>
      ) : (
        <div className="p-4">
          <TeamEmptyState
            title={t("noKeyPlayers")}
            body={t("noKeyPlayersBody")}
          />
        </div>
      )}
    </section>
  );
}

function DesktopKeyPlayersPanel({ players }: TeamKeyPlayersPanelProps) {
  const t = useTranslations("teamDetail");

  return (
    <section
      className={cn(teamPanelClass, "hidden md:block")}
      aria-label={t("keyPlayersAria")}
    >
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("keyPlayers")}</h2>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {players.length > 0 ? (
          players.map((player) => (
            <article
              key={player.name}
              className="rounded-lg border border-prophet-line bg-[#fafbfc] p-3"
            >
              <div className="flex items-center gap-2">
                {player.logo ? (
                  <img
                    src={player.logo}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f5f9ff] text-xs font-[500] text-[#125afc]">
                    {getInitials(player.name)}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="m-0 truncate text-sm font-[500] text-black">
                    {player.name}
                  </h3>
                  <p className="m-0 text-xs text-prophet-muted">
                    {player.position}
                    {player.number ? ` / #${player.number}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-1.5">
                <PlayerMetric
                  label={t("expectedMinutes")}
                  value={`${player.expectedMinutes}%`}
                />
                <PlayerMetric
                  label={t("squadProbability")}
                  value={`${player.squadProbability}%`}
                />
                <PlayerMetric
                  label={t("formScore")}
                  value={String(player.formScore)}
                />
                <PlayerMetric
                  label={t("injuryStatus")}
                  value={player.injuryStatus}
                  tone={player.injuryStatus === "Risk" ? "down" : "up"}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-prophet-line pt-2 text-xs">
                <span className="text-prophet-muted">
                  {player.club ? t("club") : t("profileNote")}
                </span>
                <strong className="truncate font-[500] text-black">
                  {player.club ?? player.note ?? player.topMarket}
                </strong>
              </div>
            </article>
          ))
        ) : (
          <div className="sm:col-span-2">
            <TeamEmptyState
              title={t("noKeyPlayers")}
              body={t("noKeyPlayersBody")}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export function TeamKeyPlayersPanel({ players }: TeamKeyPlayersPanelProps) {
  return (
    <>
      <MobileKeyPlayersPanel players={players} />
      <DesktopKeyPlayersPanel players={players} />
    </>
  );
}
