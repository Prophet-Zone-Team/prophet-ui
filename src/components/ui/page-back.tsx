import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons";

export function PageBack({
  className,
  historySteps = 1
}: {
  className?: string;
  historySteps?: number;
}) {
  const router = useRouter();
  const t = useTranslations("common");

  function handleBack() {
    if (historySteps <= 1) {
      router.back();
      return;
    }

    window.history.go(-historySteps);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "mb-3 inline-flex items-center gap-1.5 text-sm font-[500] leading-[17px] text-black hover:opacity-80",
        className
      )}
    >
      <BackChevronIcon />
      <span>{t("back")}</span>
    </button>
  );
}
