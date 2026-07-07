import type { CopyWallet } from "@/types/copy-trade-api";

// const copyTradeApiUpstream = (
//   process.env.NEXT_PUBLIC_ENV === "production"
//     ? "https://apicopy.prophet.zone"
//     : "https://api.zerostrategy.fun"
// ).replace(/\/$/, "");

const copyTradeApiUpstream = "https://apicopy.prophet.zone";

export async function fetchCopyTradeWalletForUser(
  userId: number,
  cookieHeader: string | null
): Promise<CopyWallet | null> {
  const response = await fetch(
    `${copyTradeApiUpstream}/users/${userId}/copy-wallet`,
    {
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {})
      },
      cache: "no-store"
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Unable to load copy wallet: HTTP ${response.status}`);
  }

  return (await response.json()) as CopyWallet;
}
