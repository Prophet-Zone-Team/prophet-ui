import type { ReactNode } from "react";

export default function ReferralLayout({ children }: { children: ReactNode }) {
  return <div className="font-body text-prophet-navy">{children}</div>;
}
