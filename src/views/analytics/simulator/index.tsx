import { cn } from "@/lib/cn";
import { RoadToFinal } from "./road-to-final";
import { Simulator as SimulatorComponent } from "./simulator";

export function Simulator() {
  return (
    <section
      aria-label="Simulator"
      className={cn(
        "box-border flex h-[346px] w-full max-w-[868px] flex-row items-start p-[20px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white"
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[12px] overflow-hidden">
        <h2 className="m-0 shrink-0 text-[18px] font-[300] leading-[21px] text-black">
          Road to Final
        </h2>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <RoadToFinal />
        </div>
      </div>
      <div
        className="h-[304px] w-px shrink-0 self-stretch bg-[#EBEBEB]"
        aria-hidden
      />
      <SimulatorComponent />
    </section>
  );
}
