"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { GridTable } from "@/components/grid-table";
import type { GridTableColumn } from "@/components/grid-table";
import { TeamFlag } from "@/components/teams/team-flag";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import type { GroupStandingRow } from "@/types/group-standings";

import { AdvancingProbabilityPill } from "./advancing-probability-pill";
import {
  GROUP_STANDING_STAT_FIELDS,
  GROUP_STANDINGS_GRID_TEMPLATE_COLUMNS,
  GROUP_STANDINGS_TABLE_MIN_WIDTH,
} from "./config";
import { GroupBadge } from "./group-badge";
import { getGroupLabel } from "./utils";

const statCellClassName = "text-center opacity-30";
const statHeaderClassName = "text-center";

function buildColumns(
  group: WorldCup2026Group,
  t: ReturnType<typeof useTranslations<"home">>,
): GridTableColumn<GroupStandingRow>[] {
  const statColumns: GridTableColumn<GroupStandingRow>[] =
    GROUP_STANDING_STAT_FIELDS.map((field) => ({
      id: field.key,
      header: t(field.labelKey),
      headerClassName: statHeaderClassName,
      cellClassName: statCellClassName,
      renderCell: (row) => row[field.key],
    }));

  return [
    {
      id: "team",
      header: <GroupBadge group={group} />,
      renderCell: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <TeamFlag
            name={row.flagName}
            code={row.teamCode}
            logoUrl={row.logoUrl}
            className="h-6 w-6 shrink-0 rounded-[2px] text-2xl"
          />
          <span className="truncate text-[16px] leading-normal text-black">
            {row.teamName}
          </span>
        </div>
      ),
    },
    ...statColumns,
    {
      id: "advancing",
      header: t("advancing"),
      headerClassName: statHeaderClassName,
      cellClassName: "text-center",
      renderCell: (row) => (
        <div className="flex justify-center">
          <AdvancingProbabilityPill value={row.advancingProbability} />
        </div>
      ),
    },
  ];
}

export function GroupStandingsTable({
  group,
  rows,
}: {
  group: WorldCup2026Group;
  rows: GroupStandingRow[];
}) {
  const t = useTranslations("home");
  const columns = useMemo(() => buildColumns(group, t), [group, t]);
  const groupLabel = getGroupLabel(group, t);

  return (
    <GridTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.teamId}
      gridTemplateColumns={GROUP_STANDINGS_GRID_TEMPLATE_COLUMNS}
      minWidth={GROUP_STANDINGS_TABLE_MIN_WIDTH}
      ariaLabel={t("groupStandingsTableAria", { groupLabel })}
      headerRowClassName="items-center pt-[14px]"
      bodyRowClassName="items-center transition-colors hover:bg-[#F9FAFC] rounded-[12px]"
    />
  );
}
