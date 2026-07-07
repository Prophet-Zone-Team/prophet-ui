"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";

import Drawer, { DrawerDirection } from "@/components/drawer";
import { useDevice } from "@/hooks/common/use-device";
import { Modal } from "@/components/ui/modal";

type FundingOverlayLayout = "modal" | "drawer";

const FundingOverlayLayoutContext = createContext<FundingOverlayLayout>("modal");

export function useFundingOverlayLayout(): FundingOverlayLayout {
  return useContext(FundingOverlayLayoutContext);
}

export interface FundingResponsiveOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  overlayClassName?: string;
  hideCloseButton?: boolean;
  overlayCloseable?: boolean;
  closeButtonClassName?: string;
}

export function FundingResponsiveOverlay({
  open,
  onClose,
  children,
  ariaLabel,
  className,
  overlayClassName,
  hideCloseButton = false,
  overlayCloseable = true,
  closeButtonClassName,
}: FundingResponsiveOverlayProps) {
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
      <FundingOverlayLayoutContext.Provider value="modal">
        <Modal
          open={open}
          onClose={onClose}
          ariaLabel={ariaLabel}
          className={className}
          overlayClassName={overlayClassName}
          hideCloseButton={hideCloseButton}
          overlayCloseable={overlayCloseable}
          closeButtonClassName={closeButtonClassName}
        >
          {children}
        </Modal>
      </FundingOverlayLayoutContext.Provider>
    );
  }

  return (
    <FundingOverlayLayoutContext.Provider value="drawer">
      <Drawer
        open={open}
        onClose={onClose}
        direction={DrawerDirection.Bottom}
        title={null}
        hideHeader
        ariaLabel={ariaLabel}
        overlayCloseable={overlayCloseable}
        className="z-[61] h-auto max-h-[92svh] rounded-t-2xl rounded-b-none shadow-[0_-10px_30px_rgba(0,0,0,0.12)]"
      >
        {children}
      </Drawer>
    </FundingOverlayLayoutContext.Provider>
  );
}
