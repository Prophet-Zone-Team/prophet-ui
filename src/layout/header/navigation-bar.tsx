import { usePathname } from "next/navigation";

import { trackNavClicked } from "@/lib/analytics/tracking";
import { useTranslations } from "next-intl";
import { isNavActive, PRIMARY_NAV } from "./nav";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import Link from "next/link";

function NavBar(props: any) {
  const { className, navClassName, activeClassName, onClick } = props;
  const t = useTranslations("nav");

  const pathname = usePathname();

  return (
    <nav
      className={cn("text-[13px] text-prophet-nav", className)}
      aria-label={t("primaryNavigation")}
    >
      {PRIMARY_NAV.map(({ href, labelKey }) => {
        const active = isNavActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative text-[16px] inline-flex h-[40px] items-center rounded-[40px] px-[20px] transition-colors duration-200",
              active ? "text-white" : "text-prophet-nav hover:text-[#14203a]",
              navClassName
            )}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              trackNavClicked({
                target: href,
                label: t(labelKey)
              });
              onClick?.(event);
            }}
          >
            {active ? (
              <motion.span
                layoutId="header-nav-pill"
                className={cn(
                  "absolute inset-0 rounded-[40px] bg-black",
                  activeClassName
                )}
                transition={NAV_PILL_TRANSITION}
                aria-hidden
              />
            ) : (
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-[40px] bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.07]",
                  activeClassName
                )}
                aria-hidden
              />
            )}
            <span className="relative z-10">{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default NavBar;

const NAV_PILL_TRANSITION = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.85
};
