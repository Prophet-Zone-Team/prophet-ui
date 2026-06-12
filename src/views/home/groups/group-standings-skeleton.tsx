const loadingSurface =
  "rounded-[7px] bg-[linear-gradient(90deg,rgba(225,237,249,0.72),rgba(255,255,255,0.94),rgba(225,237,249,0.72))] bg-prophet-shimmer animate-prophet-loading";

function DesktopGroupSkeleton() {
  return (
    <div className="hidden flex-col gap-4 md:flex" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-[298px] rounded-[12px] border border-[#EBEBEB] bg-white px-[30px] py-[14px]"
        >
          <div
            className={`${loadingSurface} mb-4 h-9 w-[123px] rounded-[8px]`}
          />
          <div className="mb-3 grid grid-cols-7 gap-4">
            <div className={`${loadingSurface} h-4 w-full`} />
            {Array.from({ length: 6 }, (_, headerIndex) => (
              <div
                key={headerIndex}
                className={`${loadingSurface} mx-auto h-4 w-12`}
              />
            ))}
          </div>
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="mb-2 grid grid-cols-7 items-center gap-4 py-3 last:mb-0"
            >
              <div className="flex items-center gap-2">
                <div className={`${loadingSurface} size-6 rounded-[2px]`} />
                <div className={`${loadingSurface} h-4 w-24`} />
              </div>
              {Array.from({ length: 5 }, (_, statIndex) => (
                <div
                  key={statIndex}
                  className={`${loadingSurface} mx-auto h-4 w-4`}
                />
              ))}
              <div
                className={`${loadingSurface} mx-auto h-9 w-[100px] rounded-[8px]`}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MobileTeamCardSkeleton() {
  return (
    <div
      className="rounded-[8px] border border-[#EBEBEB] px-3 py-3"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`${loadingSurface} size-6 rounded-[2px]`} />
          <div className={`${loadingSurface} h-4 w-24`} />
        </div>
        <div className={`${loadingSurface} h-8 w-[88px] rounded-[8px]`} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className={`${loadingSurface} h-3 w-10`} />
            <div className={`${loadingSurface} h-4 w-4`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileGroupSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:hidden" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="rounded-[12px] border border-[#EBEBEB] bg-white px-3 pb-3 pt-3"
        >
          <div className={`${loadingSurface} mb-3 h-9 w-24 rounded-[8px]`} />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, cardIndex) => (
              <MobileTeamCardSkeleton key={cardIndex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupStandingsSkeleton({
  ariaLabel = "Loading group standings",
}: {
  ariaLabel?: string;
}) {
  return (
    <div role="tabpanel" className="min-w-0 pb-4" aria-label={ariaLabel}>
      <DesktopGroupSkeleton />
      <MobileGroupSkeleton />
    </div>
  );
}
