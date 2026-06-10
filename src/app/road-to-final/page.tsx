import { Suspense } from "react";

import { RoadToFinalPage } from "@/views/road-to-final";
import {
  defaultSimulatorTeamId,
  resolveSimulatorTeamId
} from "@/views/road-to-final/lib/teams";

interface PageProps {
  searchParams: Promise<{
    team?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const teamId = resolveSimulatorTeamId(
    params.team ?? defaultSimulatorTeamId
  );

  return (
    <Suspense fallback={null}>
      <RoadToFinalPage initialTeamId={teamId} />
    </Suspense>
  );
}
