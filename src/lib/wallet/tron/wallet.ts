import { parseUnits } from "viem";

import { TronWeb } from "tronweb";

import { createTronWeb } from "@/lib/wallet/tron/tron-web";

export interface TronWalletSigner {
  address: string;
  signAndSendTransaction: (transaction: unknown) => Promise<{ txid?: string; transaction?: { txID?: string } }>;
}

export default class TronFundingWallet {
  private address: string;
  private signAndSendTransaction: TronWalletSigner["signAndSendTransaction"];
  private tronWeb: TronWeb;

  constructor(signer: TronWalletSigner) {
    this.address = signer.address;
    this.signAndSendTransaction = signer.signAndSendTransaction;
    this.tronWeb = createTronWeb(signer.address);
  }

  get walletAddress(): string {
    return this.address;
  }

  async transferTRX(to: string, amount: string): Promise<string> {
    const transaction = await this.tronWeb.transactionBuilder.sendTrx(
      to,
      Number(this.tronWeb.toSun(Number(amount))),
    );

    return this.sendTransaction(transaction);
  }

  async transferToken(
    contractAddress: string,
    to: string,
    amountBaseUnits: string,
  ): Promise<string> {
    const functionSelector = "transfer(address,uint256)";
    const parameter = [
      { type: "address", value: to },
      { type: "uint256", value: amountBaseUnits },
    ];
    const tx = await this.tronWeb.transactionBuilder.triggerSmartContract(
      contractAddress,
      functionSelector,
      {},
      parameter,
    );

    return this.sendTransaction(tx.transaction);
  }

  private async sendTransaction(transaction: unknown): Promise<string> {
    const result = await this.signAndSendTransaction(transaction);
    const txHash = result?.txid || result?.transaction?.txID;

    if (!txHash) {
      throw new Error("Tron transaction did not return a hash.");
    }

    return txHash;
  }

  async getTRXBalance(account: string): Promise<string> {
    try {
      const balance = await this.tronWeb.trx.getBalance(account);
      return balance.toString();
    } catch {
      return "0";
    }
  }

  async getTokenBalance(contractAddress: string, account: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(contractAddress);
      const balance = await contract.balanceOf(account).call();
      return balance.toString();
    } catch {
      return "0";
    }
  }

  async balanceOf(params: {
    address: string;
    symbol: string;
    tokenAddress: string;
  }): Promise<string> {
    if (params.symbol.toUpperCase() === "TRX") {
      return this.getTRXBalance(params.address);
    }

    return this.getTokenBalance(params.tokenAddress, params.address);
  }
}
