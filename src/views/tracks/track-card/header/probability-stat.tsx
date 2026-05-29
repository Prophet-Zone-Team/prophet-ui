import { ProbabilityChangeTrend } from "@/components/market/probability-change-trend";
import { formatProbability } from "@/components/home/market-formatters";
import {
  trackCardLargeValueClassName,
  trackCardValueClassName
} from "../styles";
import { StatColumn } from "./stat-column";
import { cn } from "@/lib/cn";

export type ProbabilityStatProps = {
  probability: number;
  change24h: number;
  teamCode?: string;
  className?: string;
};

export function ProbabilityStat({
  probability,
  change24h,
  teamCode,
  className
}: ProbabilityStatProps) {
  const changePercent = change24h;

  return (
    <StatColumn label="Probability" className={className}>
      <span className={trackCardLargeValueClassName}>
        {formatProbability(probability)}
      </span>
      {teamCode ? (
        <span className="text-[14px] font-[500] leading-[18px] text-[#3168FF]">
          {teamCode}
        </span>
      ) : (
        <ProbabilityChangeTrend changePercent={changePercent} decimals={0} />
      )}
    </StatColumn>
  );
}

export function VolumeStat({
  volumeLabel,
  className
}: {
  volumeLabel: string;
  className?: string;
}) {
  return (
    <StatColumn label="Volume" className={cn(className)}>
      <span className={trackCardValueClassName}>{volumeLabel}</span>
    </StatColumn>
  );
}
