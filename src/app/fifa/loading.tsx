import { LoadingBlock } from "@/components/ui/loading-block";
import { homeCardClass, homeLoadingSurfaceClass } from "@/views/home/home-ui";

export default function FifaWinnerLoading() {
  return (
    <div role="tabpanel" className="min-w-0 px-3 pb-4 md:px-0" aria-label="Loading winner markets">
      <section className={`${homeCardClass} mb-4 hidden px-3 pb-5 pt-4 md:block`} aria-hidden>
        <LoadingBlock className="mb-3 h-6 w-56" />
        <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <LoadingBlock key={index} className="h-4 w-28" />
          ))}
        </div>
        <LoadingBlock className="h-[190px] w-full rounded-lg" />
      </section>

      <div className="flex flex-col gap-2 pb-10" aria-hidden>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className={`${homeLoadingSurfaceClass} min-h-[78px] w-full rounded-xl border border-prophet-line`}
          />
        ))}
      </div>
    </div>
  );
}
