export type BindTelegramStatus = "unbound" | "binding" | "success";

export interface BindTelegramDialogProps {
  open: boolean;
  onClose: () => void;
  status: BindTelegramStatus;
  botUsername?: string;
  botUrl?: string;
  connectedAt?: string;
  pollIntervalSeconds?: number;
  onOpenBot?: () => void;
  onCheckStatus?: () => void;
  onDisconnect?: () => void;
}
