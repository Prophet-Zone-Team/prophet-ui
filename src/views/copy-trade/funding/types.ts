export type CopyDepositStep = "asset" | "confirm" | "status";

export type CopyDepositStatusPhase = "pending" | "credited" | "error";

export type CopyWithdrawStep = "form" | "status";

export type CopyWithdrawStatusPhase =
  | "submitting"
  | "submitted"
  | "error";
