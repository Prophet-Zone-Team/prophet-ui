"use client";

import { BIND_TG_STEPS } from "@/components/bind-tg/constants";

export function BindTgStepList() {
  return (
    <ol className="m-0 flex list-none flex-col gap-5 p-0">
      {BIND_TG_STEPS.map((item) => (
        <li key={item.step} className="flex items-center gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-prophet-action-panel text-sm font-[500] text-prophet-foreground"
            aria-hidden="true"
          >
            {item.step}
          </span>
          <span className="text-sm font-[400] leading-normal text-prophet-foreground">
            {item.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
