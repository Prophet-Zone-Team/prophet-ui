interface EthereumProvider {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
}

export async function signTypedData(
  walletAddress: string,
  typedData: unknown
): Promise<string> {
  const provider = getEthereumProvider();

  if (!provider) {
    throw new Error(
      "No injected wallet provider found. Install or unlock an EVM wallet, then try again."
    );
  }

  const signature = await provider.request({
    method: "eth_signTypedData_v4",
    params: [walletAddress, JSON.stringify(typedData)]
  });

  if (typeof signature !== "string" || !/^0x[a-fA-F0-9]+$/.test(signature)) {
    throw new Error("Wallet did not return a valid signature.");
  }

  return signature;
}

function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const maybeWindow = window as typeof window & {
    ethereum?: EthereumProvider & { providers?: EthereumProvider[] };
    okxwallet?: EthereumProvider;
  };

  return (
    maybeWindow.ethereum?.providers?.[0] ??
    maybeWindow.ethereum ??
    maybeWindow.okxwallet
  );
}
