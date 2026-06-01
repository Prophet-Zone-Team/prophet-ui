import type { ReferralMetric } from "@/types/landing";

import { MetricCard } from "./metric-card";

interface ReferralMetricsProps {
  metrics: ReferralMetric[];
}

export function ReferralMetrics({ metrics }: ReferralMetricsProps) {
  return (
    <section className="metric-grid" aria-label="Referral metrics">
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </section>
  );
}
