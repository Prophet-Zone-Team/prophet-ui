import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isPrivateModeHost } from "@/config/funding";
import { PrivateTopupPage } from "@/views/portfolio/private-topup";

export default async function RootPage() {
  const hostHeader = (await headers()).get("host") ?? "";
  const hostname = hostHeader.split(":")[0] ?? "";

  if (isPrivateModeHost(hostname)) {
    return <PrivateTopupPage />;
  }

  redirect("/fifa");
}
