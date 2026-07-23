import { homeLoadingSurfaceClass } from "@/views/home/home-ui";

export default function UEFAMatchesLoading() {
  return (
    <div role="tabpanel" className="min-w-0 pb-4">
      <div
        className={`${homeLoadingSurfaceClass} mb-3.5 h-[120px] w-full rounded-xl`}
        aria-hidden="true"
      />

      <div
        className="mb-3 flex h-[34px] items-center justify-between gap-3 rounded-[20px] px-3 md:px-0"
        aria-hidden="true"
      >
        <div className={`${homeLoadingSurfaceClass} h-[34px] w-[230px] rounded-[18px]`} />
        <div className="flex items-center gap-2">
          <div className={`${homeLoadingSurfaceClass} h-[34px] w-[136px] rounded-[18px]`} />
          <div className={`${homeLoadingSurfaceClass} h-[34px] w-[113px] rounded-[18px]`} />
          <div className={`${homeLoadingSurfaceClass} h-4 w-24`} />
        </div>
      </div>

      <section aria-label="Loading match schedule">
        <div className={`${homeLoadingSurfaceClass} mb-2.5 h-[19px] w-32`} />
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <div
                className={`${homeLoadingSurfaceClass} min-h-[88px] w-full rounded-xl border border-prophet-line`}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
