import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SyncWinnerTeamsStore } from "@/components/home/sync-winner-teams-store";
import { isPrivateModeHost } from "@/config/funding";
import { HomePageShell } from "@/views/home";

export default async function FifaLayout({ children }: { children: ReactNode }) {
  const hostHeader = (await headers()).get("host") ?? "";
  const hostname = hostHeader.split(":")[0] ?? "";

  if (isPrivateModeHost(hostname)) {
    redirect("/private");
  }

  return (
    <>
      <SyncWinnerTeamsStore />
      <HomePageShell>{children}</HomePageShell>
    </>
  );
}
