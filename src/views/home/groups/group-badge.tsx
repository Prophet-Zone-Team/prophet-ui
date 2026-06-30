"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";
import { groupDetailHref } from "@/lib/routes/group";

import { getGroupLabel } from "./utils";

export function GroupBadge({
  group,
  className,
}: {
  group: WorldCup2026Group;
  className?: string;
}) {
  const t = useTranslations("home");
  const label = getGroupLabel(group, t);

  return (
    <Link
      href={groupDetailHref(group)}
      className={cn(
        "group inline-flex h-[36px] items-center gap-1.5 rounded-[8px] border border-prophet-muted bg-prophet-panel px-3 text-[18px] font-medium leading-normal text-prophet-foreground transition-colors hover:border-prophet-foreground hover:bg-prophet-hover",
        className,
      )}
      aria-label={label}
    >
      <span>{label}</span>
      <ArrowUpRight
        className="size-[14px] shrink-0 stroke-[2] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden
      />
    </Link>
  );
}
