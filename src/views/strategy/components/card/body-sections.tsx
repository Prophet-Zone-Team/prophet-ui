"use client";

import { useState } from "react";

import { StrategyCardBodyTable } from "./body-table";
import { StrategyCardBodyTop, type StrategyCardBodyTopProps } from "./body";
import type { StrategyCardLegRow } from "./types";

export type StrategyCardBodySectionsProps = Omit<
  StrategyCardBodyTopProps,
  "expanded" | "onExpandToggle"
> & {
  legs: StrategyCardLegRow[];
  defaultExpanded?: boolean;
};

export function StrategyCardBodySections({
  legs,
  defaultExpanded = false,
  isLoading = false,
  ...topProps
}: StrategyCardBodySectionsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <>
      <StrategyCardBodyTop
        {...topProps}
        isLoading={isLoading}
        expanded={expanded}
        onExpandToggle={() => setExpanded((value) => !value)}
      />
      {expanded ? (
        <StrategyCardBodyTable
          legs={legs}
          variant={topProps.variant}
          isLoading={isLoading}
        />
      ) : null}
    </>
  );
}
