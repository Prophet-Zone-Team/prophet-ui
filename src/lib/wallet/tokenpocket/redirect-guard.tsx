"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { isInTokenPocket } from "@/context/rainbowkit/utils";
import { TP_REDIRECT_STORAGE_KEY } from "@/lib/wallet/tokenpocket/constants";

export function TokenPocketRedirectGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInTokenPocket()) {
      return;
    }

    const redirectTo = localStorage.getItem(TP_REDIRECT_STORAGE_KEY);

    if (!redirectTo) {
      return;
    }

    localStorage.removeItem(TP_REDIRECT_STORAGE_KEY);

    if (redirectTo !== pathname) {
      router.replace(redirectTo);
    }
  }, [pathname, router]);

  return null;
}
