import type { StrengthMetric } from "@/lib/team/team-detail-model";

export type TeamStrengthData = {
  metrics: StrengthMetric[];
  score?: number;
};

export type TeamStrengthTeam = {
  name: string;
  code?: string;
  logoUrl?: string;
};
