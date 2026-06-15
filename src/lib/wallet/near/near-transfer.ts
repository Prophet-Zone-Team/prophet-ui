import { actionCreators } from "@near-wallet-selector/core";

import { getNearAccountSnapshot } from "@/lib/wallet/near/near-account-store";
import { viewFunction } from "@/lib/wallet/near/near-rpc";

const FT_TRANSFER_GAS = "30000000000000";
const STORAGE_DEPOSIT_GAS = "15000000000000";
const STORAGE_DEPOSIT_AMOUNT = "1250000000000000000000";

function createFunctionCallAction(
  methodName: string,
  args: Record<string, unknown>,
  gas: string,
  deposit: string,
) {
  return actionCreators.functionCall(methodName, args, BigInt(gas), BigInt(deposit));
}

export interface TransferNearFtTokenParams {
  contractId: string;
  depositAddress: string;
  amountBaseUnits: string;
}

export async function transferNearFtToken(
  params: TransferNearFtTokenParams,
): Promise<{ txHash: string }> {
  const { selector } = getNearAccountSnapshot();

  if (!selector) {
    throw new Error("NEAR wallet selector is not ready yet.");
  }

  const wallet = await selector.wallet();
  const transactions = [];
  const checkStorage = await viewFunction<{ available?: string }>({
    contractId: params.contractId,
    methodName: "storage_balance_of",
    args: {
      account_id: params.depositAddress,
    },
  }).catch(() => null);

  if (!checkStorage?.available) {
    transactions.push({
      receiverId: params.contractId,
      actions: [
        createFunctionCallAction(
          "storage_deposit",
          {
            account_id: params.depositAddress,
            registration_only: true,
          },
          STORAGE_DEPOSIT_GAS,
          STORAGE_DEPOSIT_AMOUNT,
        ),
      ],
    });
  }

  transactions.push({
    receiverId: params.contractId,
    actions: [
      createFunctionCallAction(
        "ft_transfer",
        {
          receiver_id: params.depositAddress,
          amount: params.amountBaseUnits,
          memo: null,
        },
        FT_TRANSFER_GAS,
        "1",
      ),
    ],
  });

  const result = await wallet.signAndSendTransactions({
    transactions,
  });

  if (!result || !Array.isArray(result) || result.length === 0) {
    throw new Error("NEAR transfer did not return a transaction hash.");
  }

  const lastResult = result[result.length - 1];
  const txHash = lastResult.transaction?.hash;

  if (!txHash) {
    throw new Error("NEAR transfer did not return a transaction hash.");
  }

  return {
    txHash,
  };
}
