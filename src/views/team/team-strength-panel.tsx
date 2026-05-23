"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer
} from "recharts";

import type { StrengthMetric } from "@/lib/team/team-detail-model";
import { getStrengthScore } from "@/lib/team/team-detail-model";
import {
  teamPanelBadgeClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamStrengthPanelProps {
  metrics: StrengthMetric[];
}

export function TeamStrengthPanel({ metrics }: TeamStrengthPanelProps) {
  const score = getStrengthScore(metrics);

  return (
    <section className={teamPanelClass} aria-label="Team strength">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Team Strength</h2>
        <span className={teamPanelBadgeClass}>Model view</span>
      </div>
      <div className="p-4">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={metrics} outerRadius="74%">
              <PolarGrid stroke="#ebebeb" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: "#909090", fontSize: 10 }}
              />
              <Radar
                dataKey="value"
                stroke="#125afc"
                fill="#125afc"
                fillOpacity={0.22}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-baseline justify-center gap-1 border-t border-prophet-line pt-3">
          <span className="text-xs text-prophet-muted">Strength Score</span>
          <strong className="text-2xl font-[556] text-black">{score}</strong>
          <small className="text-xs text-prophet-muted">/100</small>
        </div>
      </div>
    </section>
  );
}
