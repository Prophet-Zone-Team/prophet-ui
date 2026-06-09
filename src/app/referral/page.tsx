import { Suspense } from "react";

import { ReferralPage } from "@/views/referral/referral-page";

export default function ReferralRoutePage() {
  return (
    <Suspense fallback={null}>
      <ReferralPage />
    </Suspense>
  );
}
