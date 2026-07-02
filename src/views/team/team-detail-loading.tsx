import type { ReactNode } from "react";

import {
  teamDossierStripClass,
  teamHeroCardClass,
  teamHeroMetricsClass,
  teamMainColumnClass,
  teamMainGridClass,
  teamPageClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamSidebarClass,
  teamTwoUpClass
} from "@/views/team/team-detail-ui";

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#ebebeb]/80 dark:bg-[#000000]/50 ${className ?? "h-4 w-full"}`}
      aria-hidden
    />
  );
}

function PanelSkeleton({
  titleWidth = "w-32",
  children
}: {
  titleWidth?: string;
  children: ReactNode;
}) {
  return (
    <section className={teamPanelClass} aria-hidden>
      <div className={teamPanelHeadClass}>
        <LoadingBlock className={`h-5 ${titleWidth}`} />
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DossierPanelSkeleton({ body }: { body: ReactNode }) {
  return (
    <PanelSkeleton>
      <div className="grid gap-3">{body}</div>
    </PanelSkeleton>
  );
}

function HeroSkeleton() {
  return (
    <header className="my-4" aria-hidden>
      <LoadingBlock className="mb-3 h-4 w-14" />

      <div className={teamHeroCardClass}>
        <div className="flex min-w-0 items-center gap-3">
          <LoadingBlock className="size-[68px] shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <LoadingBlock className="h-8 w-40 sm:w-52" />
              <LoadingBlock className="h-[26px] w-16 rounded-[14px]" />
            </div>
            <LoadingBlock className="h-4 w-56" />
            <div className="flex flex-wrap gap-1.5">
              <LoadingBlock className="h-5 w-24 rounded-full" />
              <LoadingBlock className="h-5 w-28 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className={teamHeroMetricsClass}>
            {Array.from({ length: 4 }, (_, index) => (
              <LoadingBlock key={index} className="h-[52px] w-full rounded-lg" />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
            <LoadingBlock className="h-9 w-28 rounded-lg" />
            <div className="flex gap-2">
              <LoadingBlock className="size-9 rounded-sm" />
              <LoadingBlock className="size-9 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function DossierStripSkeleton() {
  return (
    <section className={teamDossierStripClass} aria-hidden>
      <PanelSkeleton titleWidth="w-48">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <LoadingBlock key={index} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </PanelSkeleton>
      <DossierPanelSkeleton
        body={
          <>
            <LoadingBlock className="h-7 w-full rounded-md" />
            {Array.from({ length: 3 }, (_, index) => (
              <LoadingBlock key={index} className="h-7 w-full rounded-md" />
            ))}
          </>
        }
      />
      <DossierPanelSkeleton
        body={
          <>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-2">
                <LoadingBlock className="size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <LoadingBlock className="h-3 w-3/4" />
                  <LoadingBlock className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </>
        }
      />
    </section>
  );
}

function StrengthPanelSkeleton() {
  return (
    <PanelSkeleton titleWidth="w-36">
      <LoadingBlock className="mx-auto h-[220px] w-full max-w-[280px] rounded-full" />
      <div className="mt-3 flex items-center justify-center gap-2 border-t border-prophet-line pt-3">
        <LoadingBlock className="h-3 w-24" />
        <LoadingBlock className="h-8 w-12" />
        <LoadingBlock className="h-3 w-8" />
      </div>
    </PanelSkeleton>
  );
}

function ProbabilityPanelSkeleton() {
  return (
    <PanelSkeleton titleWidth="w-56">
      <div className="mb-3 flex justify-end gap-1">
        {Array.from({ length: 3 }, (_, index) => (
          <LoadingBlock key={index} className="h-6 w-8 rounded-full" />
        ))}
      </div>
      <LoadingBlock className="h-[180px] w-full rounded-lg" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <LoadingBlock key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </PanelSkeleton>
  );
}

function MainColumnSkeleton() {
  return (
    <div className={teamMainColumnClass}>
      <div className={teamTwoUpClass}>
        <StrengthPanelSkeleton />
        <ProbabilityPanelSkeleton />
      </div>

      <PanelSkeleton titleWidth="w-40">
        <div className="space-y-2">
          <div className="grid grid-cols-[80px_1fr_48px_72px_1fr] gap-2 pb-2">
            {Array.from({ length: 5 }, (_, index) => (
              <LoadingBlock key={index} className="h-3" />
            ))}
          </div>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-[80px_1fr_48px_72px_1fr] gap-2 py-2"
            >
              {Array.from({ length: 5 }, (_, cellIndex) => (
                <LoadingBlock key={cellIndex} className="h-4" />
              ))}
            </div>
          ))}
        </div>
      </PanelSkeleton>

      <PanelSkeleton titleWidth="w-44">
        <LoadingBlock className="h-[280px] w-full rounded-xl" />
      </PanelSkeleton>

      <PanelSkeleton titleWidth="w-28">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <LoadingBlock key={index} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      </PanelSkeleton>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className={teamSidebarClass}>
      <PanelSkeleton titleWidth="w-28">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center gap-1">
            <LoadingBlock className="size-9 rounded-full" />
            <LoadingBlock className="h-3 w-16" />
          </div>
          <LoadingBlock className="h-3 w-6" />
          <div className="flex flex-col items-center gap-1">
            <LoadingBlock className="size-9 rounded-full" />
            <LoadingBlock className="h-3 w-16" />
          </div>
        </div>
        <LoadingBlock className="mx-auto mt-3 h-3 w-32" />
        <LoadingBlock className="mt-4 h-9 w-full rounded-lg" />
      </PanelSkeleton>

      <LoadingBlock className="h-[420px] w-full rounded-[12px] border border-prophet-line bg-prophet-panel" />

      <PanelSkeleton titleWidth="w-40">
        <LoadingBlock className="h-24 w-full rounded-lg" />
      </PanelSkeleton>
    </aside>
  );
}

function FootnoteSkeleton() {
  return (
    <footer
      className="mt-6 flex flex-col gap-1 border-t border-prophet-line pt-4"
      aria-hidden
    >
      <LoadingBlock className="h-3 w-full max-w-xl" />
      <LoadingBlock className="h-3 w-full max-w-md" />
    </footer>
  );
}

export function TeamDetailBodySkeleton() {
  return (
    <>
      <DossierStripSkeleton />

      <div className={teamMainGridClass}>
        <MainColumnSkeleton />
        <SidebarSkeleton />
      </div>

      <FootnoteSkeleton />
    </>
  );
}

export function TeamDetailMobileBodySkeleton() {
  return (
    <div className="flex flex-col gap-4 md:hidden" aria-hidden>
      <LoadingBlock className="h-[38px] w-full rounded-md" />
      {Array.from({ length: 6 }, (_, index) => (
        <LoadingBlock
          key={index}
          className="h-[160px] w-full rounded-[12px] border border-prophet-line bg-prophet-panel"
        />
      ))}
    </div>
  );
}

export function TeamDetailPageSkeleton() {
  return (
    <div className={teamPageClass} aria-busy aria-label="Loading team page">
      <HeroSkeleton />
      <TeamDetailBodySkeleton />
    </div>
  );
}
