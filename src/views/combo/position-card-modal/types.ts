import type { PortfolioComboPositionCard } from "@/lib/portfolio/combo-positions/types";

export type PositionCardModalProps = {
  open: boolean;
  combo: PortfolioComboPositionCard | null;
  onClose: () => void;
};
