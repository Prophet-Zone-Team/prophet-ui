"use client";

import { PRIVATE_MODE_STEPS } from "@/views/portfolio/private-topup/config";
import { PrivateModeStepCard } from "@/views/portfolio/private-topup/private-mode-step-card";
import { privateTopupCardClass } from "@/views/portfolio/private-topup/private-topup-ui";

export function HowToUseSection() {
  return (
    <section
      className={`${privateTopupCardClass} mx-auto w-full max-w-[966px] px-6 pb-8 pt-6`}
    >
      <h2 className="m-0 mb-6 text-center text-xl font-[556] text-black">
        How to use Private Mode
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PRIVATE_MODE_STEPS.map((item) => (
          <PrivateModeStepCard
            key={item.step}
            step={item.step}
            title={item.title}
            description={item.description}
            variant="page"
          />
        ))}
      </div>
    </section>
  );
}
