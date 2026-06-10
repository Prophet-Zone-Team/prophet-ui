"use client";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type {
  ProphetNotificationToastContent,
  ProphetNotificationToastDescriptionPart,
  ProphetNotificationToastTitlePart
} from "@/lib/notification/format-prophet-notification-toast";

export type ProphetNotificationToastContentProps = {
  content: ProphetNotificationToastContent;
  className?: string;
};

const ACCENT_TEXT_CLASS = "text-[#65AF14]";
const OUTCOME_YES_CLASS = "text-[#65AF14]";
const OUTCOME_NO_CLASS = "text-[rgb(214,69,69)]";

function getOutcomeToneClassName(
  outcomeTone: ProphetNotificationToastTitlePart["outcomeTone"]
): string | undefined {
  if (outcomeTone === "yes") {
    return OUTCOME_YES_CLASS;
  }

  if (outcomeTone === "no") {
    return OUTCOME_NO_CLASS;
  }

  return undefined;
}

function renderTitleParts(parts: ProphetNotificationToastTitlePart[]) {
  return parts.map((part, index) => (
    <span
      key={`${part.text}-${index}`}
      className={getOutcomeToneClassName(part.outcomeTone)}
    >
      {part.text}
    </span>
  ));
}

function getChangeDirectionClassName(
  changeDirection: ProphetNotificationToastContent["changeDirection"]
): string | undefined {
  if (changeDirection === "up") {
    return "text-terminal-green";
  }

  if (changeDirection === "down") {
    return "text-terminal-red";
  }

  return undefined;
}

function renderDescriptionParts(
  parts: ProphetNotificationToastDescriptionPart[],
  changeDirectionClassName?: string
) {
  return parts.map((part, index) => (
    <span
      key={`${part.text}-${index}`}
      className={cn(
        part.accent ? ACCENT_TEXT_CLASS : undefined,
        part.changeHighlight ? changeDirectionClassName : undefined
      )}
    >
      {part.text}
    </span>
  ));
}

function MatchVsTitle({
  teamNames,
  title
}: {
  teamNames: string[];
  title: string;
}) {
  const [homeTeam, awayTeam] = teamNames;

  if (!homeTeam || !awayTeam) {
    return (
      <p className="m-0 text-sm font-medium leading-5 text-[#18110F]">
        {title}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium leading-5 text-[#18110F]">
      <TeamFlag
        name={homeTeam}
        className="size-[23px] rounded-sm shrink-0 text-[20px]"
      />
      <span>{homeTeam}</span>
      <span className="text-prophet-muted">VS</span>
      <TeamFlag
        name={awayTeam}
        className="size-[23px] rounded-sm shrink-0 text-[20px]"
      />
      <span>{awayTeam}</span>
    </div>
  );
}

export function ProphetNotificationToastContentView({
  content,
  className
}: ProphetNotificationToastContentProps) {
  const changeDirectionClassName = getChangeDirectionClassName(
    content.changeDirection
  );
  const descriptionParts = content.descriptionParts ?? [
    { text: content.description }
  ];

  return (
    <div
      className={cn(
        "flex w-full min-w-[280px] max-w-[360px] gap-3 p-4 font-body text-[#18110F]",
        className
      )}
    >
      {content.titleLayout !== "match_vs" && content.teamNames.length > 0 ? (
        <div className="flex shrink-0 items-start gap-1">
          {content.teamNames.map((teamName) => (
            <TeamFlag
              key={teamName}
              name={teamName}
              className="size-[23px] rounded-sm shrink-0 text-[24px]"
            />
          ))}
        </div>
      ) : null}

      <div className="min-w-0">
        {content.titleLayout === "match_vs" ? (
          <MatchVsTitle teamNames={content.teamNames} title={content.title} />
        ) : (
          <p className="m-0 text-sm font-medium leading-5 text-[#18110F]">
            {content.titleParts
              ? renderTitleParts(content.titleParts)
              : content.title}
          </p>
        )}
        <p
          className={cn(
            "m-0 mt-1 text-sm leading-5 text-prophet-muted",
            content.descriptionParts ? undefined : changeDirectionClassName
          )}
        >
          {renderDescriptionParts(descriptionParts, changeDirectionClassName)}
        </p>
      </div>
    </div>
  );
}
