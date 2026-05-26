"use client";

import { PRIVATE_MODE_STEPS } from "@/views/portfolio/private-topup/config";
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
          <article
            key={item.step}
            className={`${privateTopupCardClass} relative flex min-h-[231px] flex-col p-5`}
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-black text-base font-[556] text-white">
              {item.step}
            </div>
            <h3 className="m-0 mb-3 text-base font-[556] text-black">
              {item.title}
            </h3>
            <p className="m-0 text-sm font-[457] leading-normal text-[#909090]">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
