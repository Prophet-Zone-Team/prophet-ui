import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { confirmSolanaFundingTransaction } from "@/lib/wallet/solana/confirm-transaction";
import { createSolanaFundingConnection } from "@/lib/wallet/solana/connection";

const SOL_NATIVE_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isSolanaNativeToken(address: string, symbol?: string): boolean {
  return (
    symbol?.toUpperCase() === "SOL" ||
    address.toLowerCase() === SOL_NATIVE_SENTINEL
  );
}

export interface SolanaWalletSigner {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

export default class SolanaFundingWallet {
  private publicKey: PublicKey | null;
  private signTransaction: SolanaWalletSigner["signTransaction"];

  constructor(signer: SolanaWalletSigner) {
    this.publicKey = signer.publicKey;
    this.signTransaction = signer.signTransaction;
  }

  get address(): string | undefined {
    return this.publicKey?.toBase58();
  }

  getConnection() {
    return createSolanaFundingConnection();
  }

  async transferSOL(to: string, amount: string): Promise<TransactionSignature> {
    if (!this.publicKey) {
      throw new Error("Solana wallet is not connected.");
    }

    const fromPubkey = this.publicKey;
    const toPubkey = new PublicKey(to);
    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      }),
    );

    const connection = this.getConnection();
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signedTransaction = await this.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { preflightCommitment: "confirmed" },
    );
    await confirmSolanaFundingTransaction(connection, {
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return signature;
  }

  async transferToken(
    tokenMint: string,
    to: string,
    amountBaseUnits: string,
  ): Promise<TransactionSignature> {
    if (!this.publicKey) {
      throw new Error("Solana wallet is not connected.");
    }

    const connection = this.getConnection();
    const fromPubkey = this.publicKey;
    const toPubkey = new PublicKey(to);
    const mint = new PublicKey(tokenMint);
    const fromTokenAccount = getAssociatedTokenAddressSync(mint, fromPubkey);
    const toTokenAccount = getAssociatedTokenAddressSync(mint, toPubkey);
    const transaction = new Transaction();

    try {
      await getAccount(connection, toTokenAccount);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey,
          toTokenAccount,
          toPubkey,
          mint,
        ),
      );
    }

    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        BigInt(amountBaseUnits),
        [],
        TOKEN_PROGRAM_ID,
      ),
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signedTransaction = await this.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { preflightCommitment: "confirmed" },
    );
    await confirmSolanaFundingTransaction(connection, {
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return signature;
  }

  async getSOLBalance(account: string): Promise<string> {
    const connection = this.getConnection();

    try {
      const balance = await connection.getBalance(new PublicKey(account));
      return String(balance);
    } catch {
      return "0";
    }
  }

  async getTokenBalance(tokenMint: string, account: string): Promise<string> {
    const connection = this.getConnection();

    try {
      const mint = new PublicKey(tokenMint);
      const owner = new PublicKey(account);
      const tokenAccount = getAssociatedTokenAddressSync(mint, owner);
      const accountInfo = await getAccount(connection, tokenAccount);
      return accountInfo.amount.toString();
    } catch {
      return "0";
    }
  }

  async balanceOf(params: {
    address: string;
    symbol: string;
    tokenAddress: string;
  }): Promise<string> {
    if (isSolanaNativeToken(params.tokenAddress, params.symbol)) {
      return this.getSOLBalance(params.address);
    }

    return this.getTokenBalance(params.tokenAddress, params.address);
  }
}
