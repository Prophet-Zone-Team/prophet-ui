import type { ReactNode } from "react";

export function OddsSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 px-4 py-4">
      <h3 className="m-0 text-base font-[500] leading-5 text-black">{title}</h3>
      {children}
    </section>
  );
}
