import dynamic from "next/dynamic";

import { cn } from "@/lib/cn";
import { MarketWsProvider } from "@/context/market-ws";

import { homeLoadingSurfaceClass } from "@/views/home/home-ui";

const ComboPageView = dynamic(
  () => import("@/views/combo/combo-page-view").then((mod) => mod.ComboPageView),
  {
    loading: () => (
      <section className="mx-auto w-full max-w-[1200px] px-3 py-8 md:px-4">
        <div className={cn("h-8 w-40 rounded", homeLoadingSurfaceClass)} />
      </section>
    ),
  },
);

export default function ComboPage() {
  return (
    <MarketWsProvider enabled customFeatureEnabled>
      <ComboPageView />
    </MarketWsProvider>
  );
}
