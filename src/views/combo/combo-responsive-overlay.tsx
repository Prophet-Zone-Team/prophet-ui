"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import Drawer, { DrawerDirection } from "@/components/drawer";
import { Modal } from "@/components/ui/modal";
import { useDevice } from "@/hooks/common/use-device";

export type ComboResponsiveOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  overlayClassName?: string;
  hideCloseButton?: boolean;
  overlayCloseable?: boolean;
};

export function ComboResponsiveOverlay({
  open,
  onClose,
  children,
  ariaLabel,
  className,
  overlayClassName,
  hideCloseButton = false,
  overlayCloseable = true
}: ComboResponsiveOverlayProps) {
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
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      direction={DrawerDirection.Bottom}
      title={null}
      hideHeader
      ariaLabel={ariaLabel}
      overlayCloseable={overlayCloseable}
      className="z-[61] h-auto max-h-[92dvh] w-full rounded-b-none rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.12)]"
    >
      {children}
    </Drawer>
  );
}
