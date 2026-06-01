import type { ReferralMetric } from "@/types/referral";

import { MetricCard } from "./metric-card";
import { referralMetricGridClass } from "./referral-ui";

interface ReferralMetricsProps {
  metrics: ReferralMetric[];
}

export function ReferralMetrics({ metrics }: ReferralMetricsProps) {
  return (
    <section className={referralMetricGridClass} aria-label="Referral metrics">
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </section>
  );
}
