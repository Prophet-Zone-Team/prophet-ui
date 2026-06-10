import type { Metadata } from "next";

import { PrivacyPolicyPage } from "@/views/legal/privacy-policy-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Prophet collects, uses, discloses, stores, and protects information when you use the Service.",
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
