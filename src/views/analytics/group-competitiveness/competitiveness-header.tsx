import { cn } from "@/lib/cn";

export type CompetitivenessHeaderProps = {
  className?: string;
};

export function CompetitivenessHeader({ className }: CompetitivenessHeaderProps) {
  return (
    <header className={cn("px-[25px] pt-[20px]", className)}>
      <h2 className="m-0 text-[18px] font-[300] leading-[21px] text-black">
        Group Competitiveness
      </h2>
    </header>
  );
}
