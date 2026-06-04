import type { Metadata } from "next";

import { TermsAndConditionsPage } from "@/views/legal/terms-and-conditions-page";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Terms governing your access to and use of Prophet, including eligibility, risks, and limitations of liability.",
};

export default function Page() {
  return <TermsAndConditionsPage />;
}
