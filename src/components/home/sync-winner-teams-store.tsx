"use client";

import { useTeams } from "@/views/home/hooks/use-teams";

export function SyncWinnerTeamsStore() {
  useTeams();
  return null;
}
