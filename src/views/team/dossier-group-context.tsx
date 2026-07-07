"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { TeamFlag } from "@/components/teams/team-flag";
import type { TeamDetailGroupPeer } from "@/lib/team/map-team-detail";
import { cn } from "@/lib/cn";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface DossierGroupContextProps {
  groupLabel?: string;
  peers: TeamDetailGroupPeer[];
}

const mobileTextClassName =
  "font-[Sora] text-[14px] font-[500] leading-[18px] text-prophet-foreground";

const mobileFlagClassName =
  "size-6 shrink-0 rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)] object-cover";

function formatGroupLabel(label: string, t: ReturnType<typeof useTranslations>) {
  return label.startsWith("Group") ? label : t("groupLabel", { group: label });
}

function GroupPeerRow({
  peer,
  onNavigate
}: {
  peer: TeamDetailGroupPeer;
  onNavigate: (link?: string) => void;
}) {
  return (
    <div
      role={peer.link ? "button" : undefined}
      tabIndex={peer.link ? 0 : undefined}
      className={cn(
        "flex w-full items-center gap-3",
        peer.link ? "cursor-pointer" : "cursor-default"
      )}
      onClick={() => onNavigate(peer.link)}
      onKeyDown={(event) => {
        if (peer.link && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onNavigate(peer.link);
        }
      }}
    >
      <TeamFlag
        code={peer.code}
        name={peer.name}
        logoUrl={peer.logo}
        className={mobileFlagClassName}
      />
      <span className={cn(mobileTextClassName, "min-w-0 flex-1 truncate capitalize")}>
        {peer.name}
      </span>
      {peer.fifaRank ? (
        <span className={cn(mobileTextClassName, "shrink-0 text-right")}>
          #{peer.fifaRank}
        </span>
      ) : null}
    </div>
  );
}

function MobileGroupContext({
  groupLabel,
  peers,
  formatLabel
}: {
  groupLabel?: string;
  peers: TeamDetailGroupPeer[];
  formatLabel: (label: string) => string;
}) {
  const t = useTranslations("teamDetail");
  const router = useRouter();

  function handleNavigate(link?: string) {
    if (link) {
      router.push(link);
    }
  }

  return (
    <section
      className="overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel md:hidden"
      aria-label={t("groupContextAria")}
    >
      {groupLabel && peers.length > 0 ? (
        <>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h2 className={cn(mobileTextClassName, "m-0")}>{t("groupContext")}</h2>
            <span className={cn(mobileTextClassName, "text-right")}>
              {formatLabel(groupLabel)}
            </span>
          </div>
          <div className="flex flex-col gap-4 px-4 pb-4">
            {peers.slice(0, 4).map((peer) => (
              <GroupPeerRow
                key={peer.code}
                peer={peer}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="p-4">
          <TeamEmptyState
            title={t("groupPendingTitle")}
            body={t("groupPendingBody")}
          />
        </div>
      )}
    </section>
  );
}

function DesktopGroupContext({
  groupLabel,
  peers,
  formatLabel
}: {
  groupLabel?: string;
  peers: TeamDetailGroupPeer[];
  formatLabel: (label: string) => string;
}) {
  const t = useTranslations("teamDetail");
  const router = useRouter();

  return (
    <section
      className={cn(teamPanelClass, "hidden md:block")}
      aria-label={t("groupContextAria")}
    >
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("groupContext")}</h2>
      </div>
      <div className="p-4">
        {groupLabel && peers.length > 0 ? (
          <div className="grid gap-1.5">
            <strong className="rounded-md border border-prophet-line bg-prophet-panel px-2 py-1.5 text-xs font-[500] text-[#125afc]">
              {formatLabel(groupLabel)}
            </strong>
            {peers.slice(0, 4).map((peer) => (
              <span
                key={peer.code}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-prophet-line px-2 py-1.5 text-xs capitalize text-prophet-foreground duration-150",
                  peer.link ? "cursor-pointer hover:bg-prophet-hover" : "cursor-default"
                )}
                onClick={() => {
                  if (peer.link) {
                    router.push(peer.link);
                  }
                }}
              >
                {peer.logo ? (
                  <img
                    src={peer.logo}
                    alt=""
                    className="size-5 shrink-0 rounded-full object-contain"
                  />
                ) : null}
                <span className="min-w-0 truncate">
                  {peer.name}
                  {peer.fifaRank ? ` / #${peer.fifaRank}` : ""}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <TeamEmptyState
            title={t("groupPendingTitle")}
            body={t("groupPendingBody")}
          />
        )}
      </div>
    </section>
  );
}

export function DossierGroupContext({
  groupLabel,
  peers
}: DossierGroupContextProps) {
  const t = useTranslations("teamDetail");
  const formatLabel = (label: string) => formatGroupLabel(label, t);

  return (
    <>
      <MobileGroupContext
        groupLabel={groupLabel}
        peers={peers}
        formatLabel={formatLabel}
      />
      <DesktopGroupContext
        groupLabel={groupLabel}
        peers={peers}
        formatLabel={formatLabel}
      />
    </>
  );
}
