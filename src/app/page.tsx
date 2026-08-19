import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isPrivateModeHost } from "@/config/funding";
import { MarketsPage } from "@/views/markets";

export default async function RootPage() {
  const hostHeader = (await headers()).get("host") ?? "";
  const hostname = hostHeader.split(":")[0] ?? "";

  if (isPrivateModeHost(hostname)) {
    redirect("/private");
  }

  return <MarketsPage />;
}
