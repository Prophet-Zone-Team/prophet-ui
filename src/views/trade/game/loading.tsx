import { gameContentClass } from "@/views/trade/game/ui";
import { tradePanelClass } from "@/views/trade/trade-widget/trade-ui";

function LoadingBlock({
  className,
  onDark = false
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={`animate-pulse rounded-md ${
        onDark ? "bg-white/20" : "bg-[#ebebeb]/80"
      } ${className ?? "h-4 w-full"}`}
      aria-hidden
    />
  );
}

function HeaderTeamSkeleton({ align }: { align: "start" | "end" }) {
  return (
    <div
      className={`flex pt-10 sm:pt-[64px] ${
        align === "end" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex w-[108px] flex-col sm:w-[170px] ${
          align === "end" ? "items-end" : "items-start"
        }`}
      >
        <LoadingBlock
          onDark
          className="h-16 w-16 shrink-0 rounded-xl sm:h-[85px] sm:w-[85px]"
        />
        <LoadingBlock onDark className="mt-3 h-6 w-24 sm:mt-[21px]" />
      </div>
    </div>
  );
}

function MarketSectionSkeleton() {
  return (
    <section className="flex flex-col gap-5 py-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <LoadingBlock className="h-[72px] w-24" />
        <LoadingBlock className="h-6 w-12" />
        <LoadingBlock className="ml-auto h-[72px] w-24" />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <LoadingBlock className="h-6 w-28" />
        <LoadingBlock className="h-6 w-14" />
        <LoadingBlock className="ml-auto h-6 w-28" />
      </div>

      <LoadingBlock className="h-3 w-full rounded-full" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <LoadingBlock
            key={index}
            className="h-[52px] w-full rounded-[12px]"
          />
        ))}
      </div>
    </section>
  );
}

function ChartSectionSkeleton() {
  return (
    <section className="min-w-0 flex-1 rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LoadingBlock className="h-6 w-40" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <LoadingBlock key={index} className="h-8 w-10 rounded-md" />
          ))}
        </div>
      </div>
      <LoadingBlock className="mt-4 h-[280px] w-full rounded-lg" />
    </section>
  );
}

function TradeWidgetSkeleton() {
  return (
    <div className={`${tradePanelClass} overflow-hidden`}>
      <div className="border-b border-prophet-line px-4 py-4">
        <LoadingBlock className="h-6 w-32" />
      </div>
      <div className="flex items-end justify-between gap-3 border-b border-prophet-line px-4 pb-0 pt-3">
        <LoadingBlock className="h-8 w-28 rounded-md" />
        <LoadingBlock className="h-8 w-20 rounded-md" />
      </div>
      <div className="space-y-3 p-4">
        <LoadingBlock className="h-11 w-full rounded-lg" />
        <LoadingBlock className="h-20 w-full rounded-lg" />
        <LoadingBlock className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

function RelatedGamesSkeleton() {
  return (
    <section aria-hidden>
      <LoadingBlock className="mb-3 h-6 w-36 px-4" />
      <div className="flex flex-col gap-3 px-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-xl border border-[#EBEBEB] bg-white p-3"
          >
            <LoadingBlock className="mb-2 h-4 w-24" />
            <LoadingBlock className="h-14 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function TradeGameLoading() {
  return (
    <div
      className="relative left-1/2 min-h-[calc(100vh-2.75rem)] w-screen max-w-[100vw] -translate-x-1/2 bg-white pt-6"
      aria-busy
      aria-label="Loading trade"
    >
      <div className="absolute left-0 top-0 h-[258px] w-full bg-black" />

      <div className="absolute inset-x-0 top-2 z-20 flex items-center justify-between px-4 pt-2 sm:px-10">
        <LoadingBlock onDark className="h-5 w-14" />
        <LoadingBlock onDark className="h-5 w-12" />
      </div>

      <div className={`${gameContentClass} relative z-10 pb-10`}>
        <div className="w-[1000px] shrink-0 pt-2">
          <div className="relative flex w-full justify-center">
            <HeaderTeamSkeleton align="end" />
            <div className="relative flex h-[200px] w-[453px] flex-col items-center justify-center">
              <div className="relative z-10 mt-[50px] flex flex-col items-center">
                <LoadingBlock onDark className="h-12 w-32 sm:h-[72px] sm:w-40" />
                <LoadingBlock onDark className="mt-4 h-6 w-20 sm:mt-7" />
                <LoadingBlock onDark className="mt-4 h-4 w-28 sm:mt-7" />
              </div>
            </div>
            <HeaderTeamSkeleton align="start" />
          </div>

          <MarketSectionSkeleton />
          <ChartSectionSkeleton />
        </div>

        <div className="mt-6 flex w-[345px] flex-col gap-4">
          <TradeWidgetSkeleton />
          <RelatedGamesSkeleton />
        </div>
      </div>
    </div>
  );
}
