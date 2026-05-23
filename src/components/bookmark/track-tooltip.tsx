import Link from "next/link";
import type { ReactNode } from "react";

import { TrackHintIcon } from "./bookmark-icons";

export function TrackTooltip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#EBEBEB] bg-white px-4 py-3 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
      <TrackHintIcon />
      <p className="m-0 text-base leading-[19px] text-black">{children}</p>
    </div>
  );
}

export function TrackLink() {
  return (
    <Link
      href="/tracks"
      className="pointer-events-auto font-[556] underline-offset-2 hover:underline"
    >
      Track
    </Link>
  );
}
