import { LoadingBlock } from "@/components/ui/loading-block";
import { cn } from "@/lib/cn";

const trackCardShellClass = cn(
  "flex w-full max-w-none flex-col overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel md:max-w-[1260px]"
);

function TrackCardSkeleton() {
  return (
    <article className={trackCardShellClass} aria-hidden>
      <div className="flex min-h-0 flex-col gap-3 px-3 py-3 md:min-h-[78px] md:flex-row md:flex-nowrap md:items-center md:gap-6 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <LoadingBlock className="size-[26px] shrink-0 rounded-[4px] md:size-[32px]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <LoadingBlock className="h-5 w-32" />
            <LoadingBlock className="h-3 w-20" />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 md:max-w-[50%]">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-1">
              <LoadingBlock className="h-3 w-12" />
              <LoadingBlock className="h-5 w-16" />
            </div>
          ))}
        </div>
        <div className="flex w-full gap-2 md:ml-auto md:w-[25%] md:shrink-0 md:justify-end">
          <LoadingBlock className="h-[34px] flex-1 rounded-[8px] md:h-[36px] md:flex-none md:w-[90px]" />
          <LoadingBlock className="h-[34px] flex-1 rounded-[8px] md:h-[36px] md:flex-none md:w-[72px]" />
          <LoadingBlock className="h-[34px] flex-1 rounded-[8px] md:h-[36px] md:flex-none md:w-[72px]" />
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-3 border-t border-prophet-line bg-prophet-panel px-3 py-3 md:min-h-[60px] md:flex-row md:flex-nowrap md:items-center md:gap-6 md:px-4">
        <LoadingBlock className="h-5 w-28 shrink-0" />
        <LoadingBlock className="h-5 flex-1" />
        <LoadingBlock className="h-5 w-24 shrink-0 md:ml-auto" />
      </div>
    </article>
  );
}

function TopAttentionCardSkeleton() {
  return (
    <div
      className="box-border flex h-auto min-h-[214px] w-full max-w-[345px] flex-col rounded-[12px] border border-prophet-line bg-prophet-panel px-3 py-3 md:px-4 md:py-4"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3">
        <LoadingBlock className="h-3 w-24" />
        <LoadingBlock className="size-5 rounded-sm" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <LoadingBlock className="size-[26px] shrink-0 rounded-[4px]" />
        <LoadingBlock className="h-5 flex-1" />
      </div>
      <div className="mt-6 grid flex-1 grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-1">
            <LoadingBlock className="h-3 w-10" />
            <LoadingBlock className="h-5 w-14" />
          </div>
        ))}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-4">
        <LoadingBlock className="h-10 rounded-[8px]" />
        <LoadingBlock className="h-10 rounded-[8px]" />
      </div>
    </div>
  );
}

export function TracksListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <TrackCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function TopAttentionSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-[4px]" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <TopAttentionCardSkeleton key={index} />
      ))}
    </div>
  );
}
