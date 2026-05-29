import { headers } from "next/headers";

import { PrivateFundingWalletProvider } from "@/context/private-funding-wallet/provider";
import { PrivateTopupPage } from "@/views/portfolio/private-topup";

export default async function Page() {
  const cookie = (await headers()).get("cookie");

  return (
    <PrivateFundingWalletProvider cookie={cookie}>
      <PrivateTopupPage />
    </PrivateFundingWalletProvider>
  );
}
