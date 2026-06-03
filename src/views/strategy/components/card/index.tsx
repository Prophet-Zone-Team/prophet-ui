import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { StrategyCardBody } from "./body";
import { StrategyCardHeader } from "./header";
import type { StrategyCardVariant } from "./types";

export type { StrategyCardVariant, StrategyTagBadgeVariant } from "./types";
export type { StrategyCardBodyProps, StrategyCardBodyTopProps } from "./body";
export type { StrategyCardBodySectionsProps } from "./body-sections";
export type { StrategyCardBodyTableProps } from "./body-table";
export type { StrategyCardLegRow, StrategyCardOutcomeSide } from "./types";
export type { StrategyCardHeaderProps } from "./header";
export type { StrategyTagBadgeProps } from "./tag-badge";
export type {
  StrategyCardTeamRef,
  StrategyTeamFlagsStackProps
} from "./team-flags-stack";

export { StrategyCardBody, StrategyCardBodyTop } from "./body";
export { StrategyCardBodySections } from "./body-sections";
export { StrategyCardBodyTable } from "./body-table";
export { StrategyCardHeader } from "./header";
export { StrategyTagBadge } from "./tag-badge";
export { StrategyTeamFlagsStack } from "./team-flags-stack";

export type StrategyCardProps = {
  variant: StrategyCardVariant;
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function StrategyCard({
  variant,
  title,
  children,
  className,
  bodyClassName
}: StrategyCardProps) {
  return (
    <article className={cn("flex w-full flex-col overflow-hidden", className)}>
      <StrategyCardHeader variant={variant} title={title} />
      <StrategyCardBody className={bodyClassName}>{children}</StrategyCardBody>
    </article>
  );
}
