import { teamMetricToneClass, teamMetricValueClass } from "./teamDetailUi";

export interface TeamPanelMetricProps {
  label: string;
  value: string;
  tone?: "up" | "down";
}

export function TeamPanelMetric({ label, value, tone }: TeamPanelMetricProps) {
  return (
    <div className={teamMetricToneClass(tone)}>
      <span className="text-[10px] font-[556] uppercase tracking-wide text-prophet-muted">
        {label}
      </span>
      <strong className={teamMetricValueClass(tone)}>{value}</strong>
    </div>
  );
}
