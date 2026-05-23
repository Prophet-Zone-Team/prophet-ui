import Link from "next/link";

import type { NewsEvent, TeamMarketSnapshot } from "../../types/market";
import {
  formatImpact,
  formatShortDate,
  sortNewsByPublished
} from "../../lib/team/teamDetailModel";
import { TeamEmptyState } from "./TeamEmptyState";
import { cn } from "../../lib/cn";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "./teamDetailUi";

export interface TeamNewsSignalsPanelProps {
  news: NewsEvent[];
  snapshot: TeamMarketSnapshot;
}

function SignalMeta({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-prophet-muted">{label}</span>
      <strong
        className={cn(
          "font-[556]",
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

export function TeamNewsSignalsPanel({ news, snapshot }: TeamNewsSignalsPanelProps) {
  const signals = sortNewsByPublished(news).slice(0, 4);

  return (
    <section className={teamPanelClass} aria-label="News-to-market signals">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>News-to-Market Signals</h2>
        <Link
          href="/feed"
          className="text-xs font-[556] text-[#125afc] hover:opacity-80"
        >
          View all
        </Link>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {signals.length > 0 ? (
          signals.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-prophet-line bg-white p-3"
            >
              <span
                className={cn(
                  "mb-2 inline-block size-2 rounded-full",
                  item.impactScore < 0 ? "bg-prophet-red" : "bg-prophet-green"
                )}
                aria-hidden
              />
              <h3 className="m-0 text-sm font-[556] leading-snug text-black">
                {item.headline}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-prophet-muted">
                {item.summary}
              </p>
              <div className="mt-3 grid gap-1">
                <SignalMeta label="Source" value={item.source} />
                <SignalMeta
                  label="Impact"
                  value={formatImpact(item.impactScore)}
                  tone={item.impactScore < 0 ? "down" : "up"}
                />
                <SignalMeta
                  label="Published"
                  value={formatShortDate(item.publishedAt)}
                />
              </div>
            </article>
          ))
        ) : (
          <div className="sm:col-span-2">
            <TeamEmptyState
              title="No related news"
              body={`${snapshot.team.name} has no qualifying GDELT news signal attached right now.`}
            />
          </div>
        )}
      </div>
    </section>
  );
}
