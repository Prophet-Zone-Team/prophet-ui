import { cn } from "@/lib/cn";

export type CompetitivenessHeaderProps = {
  className?: string;
};

export function CompetitivenessHeader({ className }: CompetitivenessHeaderProps) {
  return (
    <header className={cn("px-3 pt-4 md:px-[25px] md:pt-[20px]", className)}>
      <h2 className="m-0 text-base font-[400] leading-[19px] text-black md:text-[18px] md:leading-[21px]">
        Group Competitiveness
      </h2>
    </header>
  );
}
