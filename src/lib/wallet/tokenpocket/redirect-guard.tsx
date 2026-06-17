"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { isInTokenPocket } from "@/context/rainbowkit/utils";
import {
  dispatchTpFundingSwitchComplete,
  getTpFundingSwitchFlag,
  getTpRedirectContext,
  clearTpRedirectContext,
} from "@/lib/wallet/tokenpocket/tp-funding-switch";

export function TokenPocketRedirectGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInTokenPocket()) {
      return;
    }

    const redirectContext = getTpRedirectContext();

    if (!redirectContext) {
      return;
    }

    clearTpRedirectContext();

    if (redirectContext.redirectPath !== pathname) {
      router.replace(redirectContext.redirectPath);
    }

    const switchFlag = getTpFundingSwitchFlag();

    dispatchTpFundingSwitchComplete({
      hostKind: redirectContext.hostKind,
      blockchain: switchFlag?.blockchain,
      redirectPath: redirectContext.redirectPath,
    });
  }, [pathname, router]);

  return null;
}
