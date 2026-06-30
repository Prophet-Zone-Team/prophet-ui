"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { RoadToFinal } from "./road-to-final";
import { Simulator as SimulatorComponent } from "./simulator";

export function Simulator() {
  const t = useTranslations("analytics");

  return (
    <section
      aria-label={t("simulatorAria")}
      className={cn(
        "box-border flex md:h-[346px] w-full md:max-w-[868px] flex-col md:flex-row gap-5 md:gap-0 items-start p-3 md:p-[20px]",
        "rounded-[12px] border border-prophet-line bg-prophet-panel"
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[12px] overflow-hidden w-full">
        <h2 className="m-0 shrink-0 text-[18px] font-[400] leading-[21px] text-prophet-foreground">
          {t("roadToFinal")}
        </h2>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <RoadToFinal />
        </div>
      </div>
      <div
        className="h-[1px] md:h-[304px] w-full md:w-px shrink-0 self-stretch bg-prophet-line"
        aria-hidden
      />
      <SimulatorComponent />
    </section>
  );
}
