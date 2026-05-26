import type {
  SignalAllNewsItem,
  SignalAllSortState,
  SignalAllTeamFilter,
  SignalAllTeamOption
} from "./types";

export function getSignalAllTeamOptions(
  items: SignalAllNewsItem[]
): SignalAllTeamOption[] {
  const seen = new Set<string>();

  return items.reduce<SignalAllTeamOption[]>(
    (options, item) => {
      if (seen.has(item.teamCode)) {
        return options;
      }

      seen.add(item.teamCode);
      options.push({
        value: item.teamCode,
        label: item.teamName,
        teamCode: item.teamCode
      });
      return options;
    },
    []
  );
}

export function filterSignalAllItems(
  items: SignalAllNewsItem[],
  teamFilter: SignalAllTeamFilter
): SignalAllNewsItem[] {
  if (teamFilter === "all") {
    return items;
  }

  return items.filter((item) => item.teamCode === teamFilter);
}

export function sortSignalAllItems(
  items: SignalAllNewsItem[],
  sort: SignalAllSortState
): SignalAllNewsItem[] {
  const sorted = [...items];

  sorted.sort((left, right) => {
    if (sort.column === "impact") {
      return compareNumbers(left.impactScore, right.impactScore, sort.direction);
    }

    const timeCompare = compareNumbers(
      left.publishedAtOrder,
      right.publishedAtOrder,
      sort.direction
    );

    if (timeCompare !== 0) {
      return timeCompare;
    }

    return compareStrings(left.teamName, right.teamName, sort.direction);
  });

  return sorted;
}

export function getNextSortState(
  current: SignalAllSortState,
  column: SignalAllSortState["column"]
): SignalAllSortState {
  if (current.column === column) {
    return {
      column,
      direction: current.direction === "desc" ? "asc" : "desc"
    };
  }

  return { column, direction: "desc" };
}

function compareNumbers(
  left: number,
  right: number,
  direction: SignalAllSortState["direction"]
): number {
  return direction === "asc" ? left - right : right - left;
}

function compareStrings(
  left: string,
  right: string,
  direction: SignalAllSortState["direction"]
): number {
  const result = left.localeCompare(right);

  return direction === "asc" ? result : -result;
}
