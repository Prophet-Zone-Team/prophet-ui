import {
  type Commitment,
  type Connection,
  type TransactionSignature,
} from "@solana/web3.js";

export interface ConfirmSolanaFundingTransactionParams {
  signature: TransactionSignature;
  blockhash: string;
  lastValidBlockHeight: number;
  commitment?: Commitment;
}

export async function confirmSolanaFundingTransaction(
  connection: Connection,
  params: ConfirmSolanaFundingTransactionParams,
): Promise<void> {
  const commitment = params.commitment ?? "confirmed";

  await connection.confirmTransaction(
    {
      signature: params.signature,
      blockhash: params.blockhash,
      lastValidBlockHeight: params.lastValidBlockHeight,
    },
    commitment,
  );
}
