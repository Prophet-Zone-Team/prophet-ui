"use client";

import { useTranslations } from "next-intl";

type StrategyLabelFallback = {
  name: string;
  description: string;
};

export function useLocalizedStrategyLabels(
  strategyId: string,
  fallback: StrategyLabelFallback
): StrategyLabelFallback {
  const t = useTranslations("strategy.templates");
  const nameKey = `${strategyId}.name`;
  const descriptionKey = `${strategyId}.description`;

  return {
    name: t.has(nameKey) ? t(nameKey) : fallback.name,
    description: t.has(descriptionKey) ? t(descriptionKey) : fallback.description
  };
}
