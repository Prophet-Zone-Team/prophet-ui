import type { ReactNode } from "react";

import { SyncWinnerTeamsStore } from "@/components/home/sync-winner-teams-store";
import { HomePageShell } from "@/views/home";

export default function FifaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SyncWinnerTeamsStore />
      <HomePageShell>{children}</HomePageShell>
    </>
  );
}
