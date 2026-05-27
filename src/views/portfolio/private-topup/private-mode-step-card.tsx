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
        "relative flex flex-col pl-4 pr-3 py-5",
        isModal ? "min-h-[270px]" : "min-h-[231px]",
        isModal && "w-full min-w-0",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-base font-[556] text-white">
          {
            step === 1
              ? (
                <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 6.5L6 11L15.5 1.5" stroke="#EBEBEB" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )
              : step
          }
        </div>
        <h3 className="m-0 text-base font-[400] text-black">{title}</h3>
      </div>
      <p className="m-0 mt-5 text-sm font-[400] leading-normal text-[#909090]">
        {description}
      </p>
      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </article>
  );
}
