import type { ReactNode } from "react";

export function MobileDrawerOddsSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 px-3 py-3">
      <h3 className="m-0 text-sm font-[500] leading-[18px] text-black">{title}</h3>
      {children}
    </section>
  );
}
