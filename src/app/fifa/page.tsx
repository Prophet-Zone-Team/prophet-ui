import { isPrivateModeHost } from "@/config/funding";
import { HomeWinnerPanel } from "@/views/home";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function FifaWinnerPage() {
  const hostHeader = (await headers()).get("host") ?? "";
  const hostname = hostHeader.split(":")[0] ?? "";

  if (isPrivateModeHost(hostname)) {
    redirect("/private");
  }

  return <HomeWinnerPanel />;
}
