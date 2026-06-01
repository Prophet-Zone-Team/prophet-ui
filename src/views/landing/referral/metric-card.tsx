import type { ReferralMetric } from "@/types/landing";
import { CheckMetricIcon, UsersMetricIcon } from "@/views/landing/landing-icons";

interface MetricCardProps {
  metric: ReferralMetric;
}

function MetricIcon({ icon }: { icon: ReferralMetric["icon"] }) {
  const className = [
    "metric-icon",
    icon === "gold-dollar" || icon === "gold-claim" ? "gold" : "",
    icon === "percent" ? "pink" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
  const cardClass = ["referral-panel", "metric-card", metric.highlight ? "highlight" : ""]
    .filter(Boolean)
    .join(" ");

  const tierClass = metric.tierProgress ? " tier-progress" : "";

  return (
    <article className={`${cardClass}${tierClass}`}>
      <MetricIcon icon={metric.icon} />
      <div className="metric-copy">
        <span>{metric.label}</span>
        <strong>{metric.value}</strong>
        <small>{metric.helper}</small>
        {metric.tierProgress ? (
          <>
            <div className="progress-track" aria-hidden="true">
              <div
                className="progress-fill"
                style={{ width: `${metric.tierProgress.progressPercent}%` }}
              />
            </div>
            <div className="success-line">{metric.tierProgress.successLine}</div>
          </>
        ) : null}
      </div>
    </article>
  );
}
