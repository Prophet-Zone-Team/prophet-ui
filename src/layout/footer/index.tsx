"use client";

import { SOCIALS_LIST } from "@/config/social";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { useDarkModeEnabled } from "@/store";

interface AppFooterProps {
  className?: string;
}

function AppFooter({ className }: AppFooterProps) {
  const darkModeEnabled = useDarkModeEnabled();
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "w-full border-t border-prophet-line py-4 px-10 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-2 font-[Sora] text-prophet-muted text-xs font-normal",
        className
      )}
    >
      <div className="flex justify-center md:justify-start items-center order-3 md:order-1">
        {t("copyright", { year: currentYear })}
      </div>
      <div className="flex justify-center items-center gap-2.5 order-1 md:order-2">
        {
          SOCIALS_LIST.map((social, index) => (
            <Link
              key={index}
              href={social.url}
              target="_blank"
              className="shrink-0 size-9 bg-prophet-panel dark:bg-black border border-prophet-line rounded-lg flex items-center justify-center hover:bg-prophet-line duration-150"
              aria-label={social.label}
            >
              <img
                src={darkModeEnabled ? social.iconLight : social.icon}
                alt={social.label}
                className="w-3 h-3 shrink-0 object-center object-contain"
              />
            </Link>
          ))
        }
      </div>
      <div className="flex justify-center md:justify-end items-center gap-10 order-2 md:order-3">
        <div className="shrink-0">{t("privacyPolicy")}</div>
        <div className="shrink-0">{t("termsOfService")}</div>
      </div>
    </footer>
  );
}

export default AppFooter;
