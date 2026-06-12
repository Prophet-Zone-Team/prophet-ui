import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export type ViewMoreLinkProps = {
  href?: string;
  className?: string;
};

export function ViewMoreLink({
  href = "/signal",
  className
}: ViewMoreLinkProps) {
  const t = useTranslations("analytics");

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-[7px] border-0 bg-transparent p-0",
        "cursor-pointer transition-opacity hover:opacity-80",
        "text-[14px] font-[400] text-[#3168FF]",
        className
      )}
    >
      <span>{t("viewMore")}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="6"
        height="11"
        viewBox="0 0 6 11"
        fill="none"
      >
        <path
          d="M0.799805 0.800781L4.7998 5.19301L0.799805 9.80078"
          stroke="#3168FF"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}
