"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";

import Drawer, { DrawerDirection } from "@/components/drawer";
import { useDevice } from "@/hooks/common/use-device";
import { Modal } from "@/components/ui/modal";

type StrategyBidOverlayLayout = "modal" | "drawer";

const StrategyBidOverlayLayoutContext =
  createContext<StrategyBidOverlayLayout>("modal");

export function useStrategyBidOverlayLayout(): StrategyBidOverlayLayout {
  return useContext(StrategyBidOverlayLayoutContext);
}

export type StrategyBidResponsiveOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  overlayClassName?: string;
  hideCloseButton?: boolean;
  overlayCloseable?: boolean;
};

export function StrategyBidResponsiveOverlay({
  open,
  onClose,
  children,
  ariaLabel,
  className,
  overlayClassName,
  hideCloseButton = false,
  overlayCloseable = true
}: StrategyBidResponsiveOverlayProps) {
  const isMobile = useDevice();

  useEffect(() => {
    if (!isMobile || !open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile, onClose, open]);

  if (!isMobile) {
    return (
      <StrategyBidOverlayLayoutContext.Provider value="modal">
        <Modal
          open={open}
          onClose={onClose}
          ariaLabel={ariaLabel}
          className={className}
          overlayClassName={overlayClassName}
          hideCloseButton={hideCloseButton}
          overlayCloseable={overlayCloseable}
        >
          {children}
        </Modal>
      </StrategyBidOverlayLayoutContext.Provider>
    );
  }

  return (
    <StrategyBidOverlayLayoutContext.Provider value="drawer">
      <Drawer
        open={open}
        onClose={onClose}
        direction={DrawerDirection.Bottom}
        title={null}
        hideHeader
        ariaLabel={ariaLabel}
        overlayCloseable={overlayCloseable}
        className="z-[61] h-auto max-h-[92dvh] rounded-t-2xl rounded-b-none shadow-[0_-10px_30px_rgba(0,0,0,0.12)]"
      >
        {children}
      </Drawer>
    </StrategyBidOverlayLayoutContext.Provider>
  );
}
