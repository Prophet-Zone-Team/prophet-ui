import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isPrivateModeHost } from "@/config/funding";
import { UefaPageShell } from "@/views/home";

export default async function UEFALayout({ children }: { children: ReactNode }) {
  const hostHeader = (await headers()).get("host") ?? "";
  const hostname = hostHeader.split(":")[0] ?? "";

  if (isPrivateModeHost(hostname)) {
    redirect("/private");
  }

  return <UefaPageShell>{children}</UefaPageShell>;
}
