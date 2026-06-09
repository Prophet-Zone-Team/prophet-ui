import type { ReactNode } from "react";

import { StrategyShell } from "@/views/strategy";

export default function StrategyLayout({ children }: { children: ReactNode }) {
  return <StrategyShell>{children}</StrategyShell>;
}
