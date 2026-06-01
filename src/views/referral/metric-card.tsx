import { cn } from "@/lib/cn";
import type { ReferralMetric } from "@/types/referral";
import { CheckMetricIcon, UsersMetricIcon } from "@/views/referral/referral-icons";

import {
  referralMetricCardClass,
  referralMetricCardHighlightClass,
  referralMetricHelperClass,
  referralMetricIconClass,
  referralMetricIconGoldClass,
  referralMetricLabelClass,
  referralMetricValueClass,
  referralProgressFillClass,
  referralProgressTrackClass,
  referralSuccessDotClass,
  referralSuccessLineClass,
} from "./referral-ui";

interface MetricCardProps {
  metric: ReferralMetric;
}

function MetricIcon({ icon }: { icon: ReferralMetric["icon"] }) {
  const className = cn(
    referralMetricIconClass,
    (icon === "gold-dollar" || icon === "gold-claim") && referralMetricIconGoldClass,
  );

  if (icon === "users") {
    return (
      <span className={className} aria-hidden="true">
        <UsersMetricIcon />
      </span>
    );
  }

  if (icon === "check") {
    return (
      <span className={className} aria-hidden="true">
        <CheckMetricIcon />
      </span>
    );
  }

  const label =
    icon === "dollar" || icon === "gold-dollar"
      ? "$"
      : icon === "us"
        ? "US"
        : icon === "gold-claim"
          ? "C"
          : icon === "tier"
            ? "T"
            : "%";

  return (
    <span className={className} aria-hidden="true">
      {label}
    </span>
  );
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <article
      className={cn(
        referralMetricCardClass,
        metric.highlight && referralMetricCardHighlightClass,
      )}
    >
      <MetricIcon icon={metric.icon} />
      <div>
        <span className={referralMetricLabelClass}>{metric.label}</span>
        <strong className={referralMetricValueClass}>{metric.value}</strong>
        <small className={referralMetricHelperClass}>{metric.helper}</small>
        {metric.tierProgress ? (
          <>
            <div className={referralProgressTrackClass} aria-hidden="true">
              <div
                className={referralProgressFillClass}
                style={{ width: `${metric.tierProgress.progressPercent}%` }}
              />
            </div>
            <div className={referralSuccessLineClass}>
              <span className={referralSuccessDotClass} aria-hidden="true" />
              {metric.tierProgress.successLine}
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}
