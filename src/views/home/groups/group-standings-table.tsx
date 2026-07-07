"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { GridTable } from "@/components/grid-table";
import type { GridTableColumn } from "@/components/grid-table";
import { TeamFlag } from "@/components/teams/team-flag";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { groupDetailHref } from "@/lib/routes/group";
import type { GroupStandingRow } from "@/types/group-standings";

import { AdvancingProbabilityPill } from "./advancing-probability-pill";
import {
  GROUP_STANDING_STAT_FIELDS,
  GROUP_STANDINGS_GRID_TEMPLATE_COLUMNS,
  GROUP_STANDINGS_TABLE_MIN_WIDTH,
} from "./config";
import { GroupBadge } from "./group-badge";
import {
  getGroupLabel,
  resolveGroupStandingRowTeamId,
} from "./utils";

const statCellClassName = "text-center";
const statHeaderClassName = "text-center";

type GroupStandingStatField = (typeof GROUP_STANDING_STAT_FIELDS)[number]["key"];

function getStatCellTextClassName(
  field: GroupStandingStatField,
  value: number,
): string {
  if (value === 0) {
    return "text-prophet-foreground/30";
  }

  if (field === "wins") {
    return "text-[#65AF14]";
  }

  if (field === "losses") {
    return "text-[#FF674B]";
  }

  return "text-prophet-foreground";
}

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
      renderCell: (row) => {
        const value = row[field.key];

        return (
          <span className={getStatCellTextClassName(field.key, value)}>
            {value}
          </span>
        );
      },
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
          <span className="truncate text-[16px] leading-normal text-prophet-foreground">
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
  const router = useRouter();
  const t = useTranslations("home");
  const columns = useMemo(() => buildColumns(group, t), [group, t]);
  const groupLabel = getGroupLabel(group, t);

  const handleRowClick = useCallback(
    (row: GroupStandingRow) => {
      router.push(
        groupDetailHref(group, {
          team: resolveGroupStandingRowTeamId(row),
          side: "yes",
        }),
      );
    },
    [group, router],
  );

  return (
    <GridTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.teamId}
      gridTemplateColumns={GROUP_STANDINGS_GRID_TEMPLATE_COLUMNS}
      minWidth={GROUP_STANDINGS_TABLE_MIN_WIDTH}
      ariaLabel={t("groupStandingsTableAria", { groupLabel })}
      headerRowClassName="items-center pt-[14px]"
      bodyRowClassName="items-center rounded-[12px] transition-colors hover:bg-prophet-hover"
      onRowClick={handleRowClick}
      getRowAriaLabel={(row) =>
        t("groupStandingRowNavigateAria", {
          teamName: row.teamName,
          groupLabel,
        })
      }
    />
  );
}
