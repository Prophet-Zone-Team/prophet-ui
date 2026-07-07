import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export type CompetitivenessHeaderProps = {
  className?: string;
};

export function CompetitivenessHeader({ className }: CompetitivenessHeaderProps) {
  const t = useTranslations("analytics");

  return (
    <header className={cn("px-3 pt-4 md:px-[25px] md:pt-[20px]", className)}>
      <h2 className="m-0 text-base font-[400] leading-[19px] text-prophet-foreground md:text-[18px] md:leading-[21px]">
        {t("groupCompetitiveness")}
      </h2>
    </header>
  );
}
