import { cn } from "@/lib/cn";

import { ProgressBarRow } from "./progress-bar-row";
import type {
  GroupCompetitivenessEntry,
  GroupCompetitivenessVariant
} from "./types";

export type CompetitivenessListProps = {
  entries: GroupCompetitivenessEntry[];
  variant: GroupCompetitivenessVariant;
  className?: string;
};

export function CompetitivenessList({
  entries,
  variant,
  className
}: CompetitivenessListProps) {
  return (
    <ul className={cn("m-0 flex list-none flex-col gap-[14px] p-0", className)}>
      {entries.map((entry) => (
        <li key={entry.groupId}>
          <ProgressBarRow entry={entry} variant={variant} />
        </li>
      ))}
    </ul>
  );
}
