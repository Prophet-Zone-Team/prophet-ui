import {
  tradePageClass,
  tradeSectionClass
} from "@/views/trade/trade-widget/trade-ui";

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#ebebeb]/80 ${className ?? "h-4 w-full"}`}
      aria-hidden
    />
  );
}

export default function GroupPageLoading() {
  return (
    <div className={tradePageClass} aria-busy aria-label="Loading group">
      <div className="mb-4">
        <LoadingBlock className="h-5 w-12" />
      </div>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_345px]">
        <div className="order-2 flex flex-col gap-4 xl:order-1">
          <div className="flex gap-3 pb-2">
            <LoadingBlock className="size-[68px] shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <LoadingBlock className="h-9 w-48" />
              <LoadingBlock className="h-4 w-64" />
            </div>
          </div>
          <div className={`${tradeSectionClass} rounded-[12px] border border-[#EBEBEB] p-5`}>
            <LoadingBlock className="mb-4 h-6 w-40" />
            <LoadingBlock className="h-[220px] w-full" />
          </div>
          <div className="rounded-[12px] border border-[#EBEBEB] p-5">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <LoadingBlock key={index} className="h-[102px] w-full rounded-lg" />
              ))}
            </div>
            <LoadingBlock className="mt-5 h-[280px] w-full" />
          </div>
        </div>

        <aside className="order-1 flex flex-col gap-4 xl:order-2">
          <div className={`${tradeSectionClass} rounded-[12px] border border-[#EBEBEB] p-4`}>
            <LoadingBlock className="mb-4 h-6 w-24" />
            <LoadingBlock className="mb-3 h-20 w-full" />
            <LoadingBlock className="h-11 w-full rounded-lg" />
          </div>
          <div className={tradeSectionClass}>
            <div className="border-b border-prophet-line px-4 py-3">
              <LoadingBlock className="h-5 w-36" />
            </div>
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="m-3 rounded-xl border border-prophet-line p-3"
              >
                <LoadingBlock className="mb-2 h-4 w-20" />
                <LoadingBlock className="h-16 w-full" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
