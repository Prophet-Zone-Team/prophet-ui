"use client";

import type { ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement } from "react";

import Popover from "@/components/popover";
import { REGION_BLOCKED_LABEL } from "@/lib/trading/trading-eligibility-client";

export interface RegionRestrictedControlProps {
  restricted: boolean;
  label?: string;
  children: ReactNode;
}

export function RegionRestrictedControl({
  restricted,
  label = REGION_BLOCKED_LABEL,
  children
}: RegionRestrictedControlProps) {
  if (!restricted) {
    return children;
  }

  const disabledChild = disableChildElement(children);

  return (
    <Popover
      placement="Bottom"
      trigger="Hover"
      content={
        <div className="rounded-lg border border-[#EBEBEB] px-3 py-2 text-sm font-[457] bg-white text-black shadow-[0_0_10px_0_rgba(0,0,0,0.10)]">
          {label}
        </div>
      }
    >
      {disabledChild}
    </Popover>
  );
}

function disableChildElement(children: ReactNode) {
  if (!isValidElement(children)) {
    return children;
  }

  const element = children as ReactElement<{
    disabled?: boolean;
    className?: string;
    onClick?: (event: unknown) => void;
    "aria-disabled"?: boolean;
  }>;

  return cloneElement(element, {
    disabled: true,
    "aria-disabled": true,
    onClick: (event: unknown) => {
      if (
        typeof event === "object" &&
        event !== null &&
        "preventDefault" in event
      ) {
        (event as Event).preventDefault();
        (event as Event).stopPropagation();
      }
    },
    className: [element.props.className, "cursor-not-allowed opacity-60"]
      .filter(Boolean)
      .join(" ")
  });
}
