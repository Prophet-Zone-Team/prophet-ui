import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons";

export function PageBack({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("common");
  return (
    <button
      type="button"
      onClick={() => router.back()}
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
