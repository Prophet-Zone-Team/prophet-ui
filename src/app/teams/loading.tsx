import {
  teamsFeaturedCardClass,
  teamsPageClass,
  teamsPanelClass
} from "@/views/teams/teams-ui";

export default function TeamsLoading() {
  return (
    <section className={teamsPageClass} aria-label="Loading team directory">
      <header className="pb-8">
        <div className="h-3 w-24 animate-pulse rounded bg-prophet-line" />
        <div className="mt-3 h-10 w-full max-w-lg animate-pulse rounded bg-prophet-line" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-prophet-line" />
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-[88px] animate-pulse rounded-lg border border-prophet-line/80 bg-[#fafbfc]"
            />
          ))}
        </div>
      </header>

      <section
        className="mb-6 grid gap-4 lg:grid-cols-3"
        aria-label="Loading featured football data"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`${teamsFeaturedCardClass} h-[280px] animate-pulse`}
          />
        ))}
      </section>

      <section className={`${teamsPanelClass} animate-pulse`} aria-hidden="true">
        <div className="mb-4 h-6 w-40 rounded bg-prophet-line" />
        <div className="grid gap-2">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-[120px] rounded-xl border border-[#EBEBEB] bg-prophet-line/50"
            />
          ))}
        </div>
      </section>
    </section>
  );
}
