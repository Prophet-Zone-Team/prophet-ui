"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { privateTopupCardClass } from "@/views/portfolio/private-topup/private-topup-ui";

export interface PrivateModeStepCardProps {
  step: number;
  title: string;
  description: string;
  variant?: "page" | "modal";
  footer?: ReactNode;
  className?: string;
}

export function PrivateModeStepCard({
  step,
  title,
  description,
  variant = "page",
  footer,
  className,
}: PrivateModeStepCardProps) {
  const isModal = variant === "modal";

  return (
    <article
      className={cn(
        privateTopupCardClass,
        "relative flex flex-col p-5",
        isModal ? "min-h-[270px]" : "min-h-[231px]",
        isModal && "w-full min-w-0",
        className,
      )}
    >
      <div className="mb-4 flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-base font-[556] text-white">
        {step}
      </div>
      <h3 className="m-0 mb-3 text-base font-[556] text-black">{title}</h3>
      <p className="m-0 text-sm font-[457] leading-normal text-[#909090]">
        {description}
      </p>
      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </article>
  );
}
