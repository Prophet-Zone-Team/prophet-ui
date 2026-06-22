import type { QueryClient } from "@tanstack/react-query";

import { roadToFinalQueryKeys } from "./query-keys";

export async function refreshWinnerActivityQueries(
  queryClient: QueryClient
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: roadToFinalQueryKeys.winnerRecords,
    }),
    queryClient.invalidateQueries({
      queryKey: roadToFinalQueryKeys.winnerStats,
    }),
  ]);

  await Promise.all([
    queryClient.refetchQueries({
      queryKey: roadToFinalQueryKeys.winnerRecords,
      type: "active",
    }),
    queryClient.refetchQueries({
      queryKey: roadToFinalQueryKeys.winnerStats,
      type: "active",
    }),
  ]);
}
