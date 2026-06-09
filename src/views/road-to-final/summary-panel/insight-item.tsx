import type { ReactNode } from "react";

export function InsightItem({
  detail,
  icon,
  title
}: {
  detail: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <article className="flex gap-[10px] rounded-[8px] border border-[#EBEBEB] bg-[#F9FAFC] p-[12px]">
      <span className="shrink-0 text-[#909090]">{icon}</span>
      <div className="min-w-0">
        <strong className="block text-[13px] font-[400] text-black">
          {title}
        </strong>
        <p className="m-0 mt-[4px] text-[12px] font-[300] leading-[16px] text-[#909090]">
          {detail}
        </p>
      </div>
    </article>
  );
}
