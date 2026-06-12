"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

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

export function DossierGroupContext({
  groupLabel,
  peers
}: DossierGroupContextProps) {
  const t = useTranslations("teamDetail");
  const router = useRouter();

  const formatGroupLabel = (label: string) =>
    label.startsWith("Group") ? label : t("groupLabel", { group: label });

  return (
    <section className={teamPanelClass} aria-label={t("groupContextAria")}>
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("groupContext")}</h2>
      </div>
      <div className="p-4">
        {groupLabel && peers.length > 0 ? (
          <div className="grid gap-1.5">
            <strong className="rounded-md border border-prophet-line bg-[#f5f9ff] px-2 py-1.5 text-xs font-[500] text-[#125afc]">
              {formatGroupLabel(groupLabel)}
            </strong>
            {peers.slice(0, 4).map((peer) => (
              <span
                key={peer.code}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-prophet-line px-2 py-1.5 text-xs capitalize text-black duration-150",
                  peer.link ? "cursor-pointer hover:bg-[#F0F2F5]" : "cursor-default"
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
