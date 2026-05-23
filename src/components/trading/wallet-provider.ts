"use client";

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  selectedAddress?: string;
  providers?: EthereumProvider[];
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
}

export type WalletProviderKind = "okx" | "metamask" | "injected";

export function getEthereumProvider(): EthereumProvider | undefined {
  const providers = getInjectedEthereumProviders();

  return providers.find((provider) => provider.selectedAddress) ?? providers[0];
}

export async function getEthereumProviderForWallet(
  walletAddress: string,
  preferredKind?: WalletProviderKind,
): Promise<EthereumProvider> {
  const providers = await getEthereumProvidersForWallet(walletAddress, preferredKind);

  if (providers[0]) {
    return providers[0];
  }

  throw getNoProviderForWalletError(walletAddress, []);
}

export async function getEthereumProvidersForWallet(
  walletAddress: string,
  preferredKind?: WalletProviderKind,
): Promise<EthereumProvider[]> {
  const expectedAddress = normalizeAddress(walletAddress);
  const providers = getInjectedEthereumProviders();
  const seenAccounts: string[] = [];
  const matches: Array<{
    provider: EthereumProvider;
    rank: number;
  }> = [];

  for (const provider of providers) {
    const accounts = await getProviderAccounts(provider);
    const selected = normalizeAddressOrUndefined(provider.selectedAddress);
    const firstAccount = accounts[0];

    seenAccounts.push(...accounts);

    if (accounts.some((account) => isSameAddress(account, expectedAddress))) {
      matches.push({
        provider,
        rank: getProviderMatchRank({
          provider,
          preferredKind,
          expectedAddress,
          selected,
          firstAccount,
        }),
      });
    }
  }

  if (matches.length > 0) {
    return matches.sort((left, right) => right.rank - left.rank).map((match) => match.provider);
  }

  throw getNoProviderForWalletError(walletAddress, seenAccounts);
}

function getNoProviderForWalletError(walletAddress: string, seenAccounts: string[]) {
  const expectedAddress = normalizeAddress(walletAddress);
  const uniqueAccounts = [...new Set(seenAccounts.map((account) => account.toLowerCase()))];
  const activeCopy =
    uniqueAccounts.length > 0
      ? ` Active wallet account${uniqueAccounts.length > 1 ? "s" : ""}: ${uniqueAccounts.join(", ")}.`
      : "";

  return new Error(
    `The connected trading session is ${expectedAddress}, but the active wallet provider does not expose that account.${activeCopy} Switch your wallet to ${expectedAddress} or reconnect this app with the intended wallet.`,
  );
}

export async function getProviderAccounts(provider: EthereumProvider): Promise<string[]> {
  const selected = normalizeAddressOrUndefined(provider.selectedAddress);
  const accounts = await provider
    .request({
      method: "eth_accounts",
    })
    .catch(() => undefined);

  return [
    selected,
    ...(Array.isArray(accounts) ? accounts.filter((account): account is string => typeof account === "string") : []),
  ].filter((account): account is string => Boolean(account && normalizeAddressOrUndefined(account)));
}

function getInjectedEthereumProviders(): EthereumProvider[] {
  if (typeof window === "undefined") {
    return [];
  }

  const maybeWindow = window as typeof window & {
    ethereum?: EthereumProvider;
    okxwallet?: EthereumProvider;
  };
  const providers = [
    maybeWindow.okxwallet,
    ...(maybeWindow.ethereum?.providers ?? []),
    maybeWindow.ethereum,
  ].filter((provider): provider is EthereumProvider => Boolean(provider));

  return [...new Set(providers)];
}

export { getInjectedEthereumProviders };

export async function getAuthorizedWalletAccounts(): Promise<string[]> {
  const providers = getInjectedEthereumProviders();
  const accounts = new Set<string>();

  for (const provider of providers) {
    for (const account of await getProviderAccounts(provider)) {
      accounts.add(account.toLowerCase());
    }
  }

  return [...accounts];
}

export function isWalletAddressAuthorized(
  walletAddress: string,
  authorizedAccounts: string[],
): boolean {
  const normalized = walletAddress.toLowerCase();
  return authorizedAccounts.some((account) => account === normalized);
}

export function getPrimaryAuthorizedWalletAccount(authorizedAccounts: string[]): string | undefined {
  return authorizedAccounts[0];
}

export function getProviderLabel(provider: EthereumProvider) {
  if (getProviderKind(provider) === "okx") {
    return "OKX Wallet";
  }

  if (provider.isMetaMask) {
    return "MetaMask";
  }

  return "injected wallet";
}

export function getProviderKind(provider: EthereumProvider): WalletProviderKind {
  if (provider.isOkxWallet || provider.isOKExWallet) {
    return "okx";
  }

  if (provider.isMetaMask) {
    return "metamask";
  }

  return "injected";
}

function getProviderMatchRank({
  provider,
  preferredKind,
  expectedAddress,
  selected,
  firstAccount,
}: {
  provider: EthereumProvider;
  preferredKind?: WalletProviderKind;
  expectedAddress: string;
  selected?: string;
  firstAccount?: string;
}) {
  let rank = 0;

  if (preferredKind && getProviderKind(provider) === preferredKind) {
    rank += 100;
  }

  if (!preferredKind && getProviderKind(provider) === "okx") {
    rank += 10;
  }

  if (selected && isSameAddress(selected, expectedAddress)) {
    rank += 50;
  }

  if (firstAccount && isSameAddress(firstAccount, expectedAddress)) {
    rank += 25;
  }

  return rank;
}

function normalizeAddress(address: string) {
  const value = address.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error("Invalid wallet address.");
  }

  return value;
}

function normalizeAddressOrUndefined(address: string | undefined) {
  return address && /^0x[a-fA-F0-9]{40}$/.test(address) ? address : undefined;
}

function isSameAddress(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}
