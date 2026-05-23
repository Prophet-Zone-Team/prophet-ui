import type { UserTradingReadiness } from "@/types/market";

export interface TradingSetupSteps {
  walletDeployed: boolean;
  clobSigned: boolean;
  tokensAuthorized: boolean;
}

function isTokensAuthorizedForSetup(readiness: UserTradingReadiness | undefined): boolean {
  const allowanceCheck = readiness?.checks.find((check) => check.id === "allowance");

  if (allowanceCheck?.status === "pass") {
    return true;
  }

  return false;
}

export function getTradingSetupSteps(
  readiness: UserTradingReadiness | undefined,
): TradingSetupSteps {
  return {
    walletDeployed: readiness?.session?.depositWalletStatus === "deployed",
    clobSigned: readiness?.credentials?.hasClobCredentials === true,
    tokensAuthorized: isTokensAuthorizedForSetup(readiness),
  };
}

export type TradingSetupStepId = "wallet" | "clob" | "tokens";

export function isSetupStepComplete(
  readiness: UserTradingReadiness | undefined,
  step: TradingSetupStepId,
): boolean {
  const steps = getTradingSetupSteps(readiness);

  switch (step) {
    case "wallet":
      return steps.walletDeployed;
    case "clob":
      return steps.clobSigned;
    case "tokens":
      return steps.tokensAuthorized;
  }
}

export function isTradingSetupComplete(
  readiness: UserTradingReadiness | undefined,
): boolean {
  return (
    isSetupStepComplete(readiness, "wallet") &&
    isSetupStepComplete(readiness, "clob") &&
    isSetupStepComplete(readiness, "tokens")
  );
}

export function shouldAutoOpenTradingSetupModal(options: {
  session: unknown;
  readiness: UserTradingReadiness | undefined;
}): boolean {
  if (!options.session) {
    return true;
  }

  return !isTradingSetupComplete(options.readiness);
}
