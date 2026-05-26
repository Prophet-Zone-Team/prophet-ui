"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  getCategoryTotal,
  SIGNAL_CATEGORY_COLORS
} from "./format";
import type { SignalCategorySegment } from "./types";

export type TopCategoriesDonutChartProps = {
  categories: SignalCategorySegment[];
  className?: string;
};

type ChartDatum = SignalCategorySegment & {
  color: string;
};

export function TopCategoriesDonutChart({
  categories,
  className
}: TopCategoriesDonutChartProps) {
  const total = getCategoryTotal(categories);
  const chartData: ChartDatum[] = categories.map((category) => ({
    ...category,
    color: SIGNAL_CATEGORY_COLORS[category.id]
  }));

  return (
    <div
      className={className}
      role="img"
      aria-label={`Category distribution total ${total}`}
    >
      <div className="relative size-[186px]">
        <PieChart width={186} height={186}>
          <Pie
            data={chartData}
            dataKey="count"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={93}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            {chartData.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[16px] font-[457] leading-[19px] text-[#909090]">
            Total
          </span>
          <span className="text-[20px] font-[457] leading-[24px] text-black tabular-nums">
            {total}
          </span>
        </div>
      </div>
    </div>
  );
}
