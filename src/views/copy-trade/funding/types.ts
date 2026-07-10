export type CopyDepositStep = "qr" | "asset" | "confirm" | "status";

export type CopyDepositMethod = "connected" | "polymarket";

export type CopyDepositStatusPhase = "pending" | "credited" | "error";

export type CopyWithdrawStep = "form" | "status";

export type CopyWithdrawStatusPhase =
  | "submitting"
  | "submitted"
  | "error";
