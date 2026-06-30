import { useDevice } from "@/hooks/common/use-device";
import clsx from "clsx";
import { AnimatePresence, motion, TargetAndTransition } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import DrawerTitle from "./title";

const BASE_OVERLAY_Z_INDEX = 50;
const BASE_CONTENT_Z_INDEX = 51;
const Z_INDEX_STACK_STEP = 2;

let drawerInstanceCounter = 0;
let nextStackIndex = 0;
const activeDrawerStackIndices = new Map<number, number>();

function acquireDrawerZIndexStack() {
  const instanceId = ++drawerInstanceCounter;
  const stackIndex = nextStackIndex++;
  activeDrawerStackIndices.set(instanceId, stackIndex);

  return {
    instanceId,
    overlayZIndex: BASE_OVERLAY_Z_INDEX + stackIndex * Z_INDEX_STACK_STEP,
    contentZIndex: BASE_CONTENT_Z_INDEX + stackIndex * Z_INDEX_STACK_STEP,
  };
}

function releaseDrawerZIndexStack(instanceId: number) {
  activeDrawerStackIndices.delete(instanceId);

  if (activeDrawerStackIndices.size === 0) {
    nextStackIndex = 0;
  }
}

const Drawer = (props: DrawerProps) => {
  const { open, onClose, overlayCloseable = true, overlayClassName } = props;

  const isMobile = useDevice();

  const [contentOpen, setContentOpen] = useState(false);
  const drawerInstanceIdRef = useRef<number | null>(null);
  const [zIndexes, setZIndexes] = useState({
    overlayZIndex: BASE_OVERLAY_Z_INDEX,
    contentZIndex: BASE_CONTENT_Z_INDEX,
  });

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const acquired = acquireDrawerZIndexStack();
    drawerInstanceIdRef.current = acquired.instanceId;
    setZIndexes({
      overlayZIndex: acquired.overlayZIndex,
      contentZIndex: acquired.contentZIndex,
    });

    return () => {
      if (drawerInstanceIdRef.current !== null) {
        releaseDrawerZIndexStack(drawerInstanceIdRef.current);
        drawerInstanceIdRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setContentOpen(false);
      document.body.classList.remove("drawer-open");
      return;
    }

    setContentOpen(true);
    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("drawer-open");
    document.body.style.overflow = "hidden";

    return () => {
      document.body.classList.remove("drawer-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (typeof window === "undefined") {
    return null;
  }

  return ReactDOM.createPortal((
    <AnimatePresence>
      {
        open && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: open ? 0 : 0.3,
            }}
            className={clsx("fixed left-0 top-0 h-full w-full bg-black/50", overlayClassName)}
            style={{ zIndex: zIndexes.overlayZIndex }}
            onClick={(e) => {
              if (e.target !== e.currentTarget) {
                return;
              }
              if (!overlayCloseable) {
                return;
              }
              onClose();
            }}
          />
        )
      }
      {
        contentOpen && (
          <DrawerContent
            key="drawer-content"
            isMobile={isMobile}
            contentZIndex={zIndexes.contentZIndex}
            {...props}
          />
        )
      }
    </AnimatePresence>
  ), document.body);
};

export default Drawer;

const DrawerContent = (props: DrawerContentProps) => {
  const {
    className,
    open,
    children,
    isMobile,
    title,
    hideHeader = false,
    ariaLabel,
    onClose,
    direction = DrawerDirection.Bottom,
    contentZIndex = BASE_CONTENT_Z_INDEX,
  } = props;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      initial={DirectionAnimationMap[direction].initial}
      animate={DirectionAnimationMap[direction].animate}
      exit={DirectionAnimationMap[direction].initial}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: isMobile ? 27 : 30,
        duration: 0.3,
        delay: open ? 0.05 : 0
      }}
      style={{ zIndex: contentZIndex }}
      className={clsx(
        "fixed flex flex-col bg-prophet-panel shadow-[0_0_10px_0_rgba(0,0,0,0.10)]",
        direction === DrawerDirection.Bottom
          ? "rounded-b-0 rounded-t-2xl w-full h-[70dvh] left-0 bottom-0"
          : "",
        direction === DrawerDirection.Top
          ? "rounded-t-0 rounded-b-2xl w-full h-[70dvh] left-0 top-0"
          : "",
        direction === DrawerDirection.Left
          ? "rounded-l-0 rounded-r-2xl h-full w-[30dvh] left-0 top-0"
          : "",
        direction === DrawerDirection.Right
          ? "rounded-r-0 rounded-l-2xl h-full w-[30dvh] right-0 top-0"
          : "",
        className
      )}
    >
      {!hideHeader ? (
        <DrawerTitle onClose={onClose} className="">
          {title}
        </DrawerTitle>
      ) : null}
      <div
        className={clsx(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
        )}
      >
        {children}
      </div>
    </motion.div>
  );
};

export const DrawerDirection = {
  Bottom: "bottom",
  Top: "top",
  Left: "left",
  Right: "right",
} as const;
export type DrawerDirection = (typeof DrawerDirection)[keyof typeof DrawerDirection];

interface DrawerProps {
  className?: string;
  overlayClassName?: string;
  open: boolean;
  children: React.ReactNode;
  isMobile?: boolean;
  title?: ReactNode;
  ariaLabel?: string;
  onClose: () => void;
  direction?: DrawerDirection;
  hideHeader?: boolean;
  overlayCloseable?: boolean;
}

interface DrawerContentProps extends DrawerProps {
  contentZIndex?: number;
}

const DirectionAnimationMap: Record<DrawerDirection, { initial: TargetAndTransition; animate: TargetAndTransition; }> = {
  [DrawerDirection.Bottom]: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
  },
  [DrawerDirection.Top]: {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
  },
  [DrawerDirection.Left]: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
  },
  [DrawerDirection.Right]: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
  },
};
