import dynamic from "next/dynamic";
import { Suspense } from "react";

import {
  defaultSimulatorTeamId,
  resolveSimulatorTeamId,
} from "@/views/road-to-final/lib/teams";

const RoadToFinalPage = dynamic(
  () =>
    import("@/views/road-to-final").then((mod) => mod.RoadToFinalPage),
  { loading: () => null },
);

interface PageProps {
  searchParams: Promise<{
    team?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const teamId = resolveSimulatorTeamId(
    params.team ?? defaultSimulatorTeamId,
  );

  return (
    <Suspense fallback={null}>
      <RoadToFinalPage initialTeamId={teamId} />
    </Suspense>
  );
}
