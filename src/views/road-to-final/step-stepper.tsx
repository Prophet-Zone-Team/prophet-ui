"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export type RoadStep = 1 | 2 | 3;

export function StepStepper({
  activeStep,
  stepOneComplete,
  hasChampion,
  onStepChange
}: {
  activeStep: RoadStep;
  stepOneComplete: boolean;
  hasChampion: boolean;
  onStepChange: (step: RoadStep) => void;
}) {
  const t = useTranslations("roadToFinal");
  const steps: Array<{
    step: RoadStep;
    label: string;
    note: string;
  }> = [
    {
      step: 1,
      label: t("stepGroupStandings"),
      note: t("stepGroupStandingsNote")
    },
    {
      step: 2,
      label: t("stepKnockoutPicks"),
      note: t("stepKnockoutPicksNote")
    },
    {
      step: 3,
      label: t("stepShareResults"),
      note: t("stepShareResultsNote")
    }
  ];

  return (
    <nav
      className="mb-[22px] grid grid-cols-1 gap-[10px] md:grid-cols-3"
      aria-label={t("simulatorStepsAria")}
    >
      {steps.map(({ step, label, note }) => {
        const locked =
          (step === 2 && !stepOneComplete) ||
          (step === 3 && (!stepOneComplete || !hasChampion));

        return (
          <button
            key={step}
            type="button"
            disabled={locked}
            className={cn(
              "grid min-h-[58px] grid-cols-[34px_minmax(0,1fr)] items-center gap-[10px] rounded-[8px] border px-[10px] py-[10px] text-left transition",
              activeStep === step
                ? "border-[#18110F] bg-[#18110F] text-white"
                : "border-[#EBEBEB] bg-white text-black hover:border-[#18110F]",
              locked && "cursor-not-allowed opacity-55"
            )}
            onClick={() => onStepChange(step)}
          >
            <span
              className={cn(
                "inline-flex h-[34px] w-[34px] items-center justify-center rounded-full text-[13px] font-[700]",
                activeStep === step
                  ? "bg-white text-[#18110F]"
                  : "bg-[#F3F3F3] text-black"
              )}
            >
              {step}
            </span>
            <span>
              <span className="block text-[13px] font-[700]">{label}</span>
              <span
                className={cn(
                  "mt-[2px] block truncate text-[12px]",
                  activeStep === step ? "text-white/70" : "text-[#909090]"
                )}
              >
                {note}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
