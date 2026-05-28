import { useDevice } from "@/hooks/common/use-device";
import clsx from "clsx";
import { AnimatePresence, motion, TargetAndTransition } from "framer-motion";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import DrawerTitle from "./title";

const Drawer = (props: DrawerProps) => {
  const { open, onClose } = props;

  const isMobile = useDevice();

  const [contentOpen, setContentOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setContentOpen(true);
      document.body.classList.add("drawer-open");
      return;
    }
    setContentOpen(false);
    document.body.classList.remove("drawer-open");
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
            className="fixed z-50 left-0 top-0 w-full h-full bg-black/50"
            onClick={(e) => {
              if (e.target !== e.currentTarget) {
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
            {...props}
          />
        )
      }
    </AnimatePresence>
  ), document.body);
};

export default Drawer;

const DrawerContent = (props: DrawerProps) => {
  const {
    className,
    open,
    children,
    isMobile,
    title,
    onClose,
    direction = DrawerDirection.Bottom,
  } = props;

  return (
    <motion.div
      initial={DirectionAnimationMap[direction].initial}
      animate={DirectionAnimationMap[direction].animate}
      exit={DirectionAnimationMap[direction].initial}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: isMobile ? 27 : 30,
        duration: 0.3,
        delay: open ? 0.05 : 0,
      }}
      className={clsx(
        "fixed z-[51] overflow-y-auto overflow-x-hidden bg-white shadow-[0_0_10px_0_rgba(0,0,0,0.10)]",
        direction === DrawerDirection.Bottom ? "rounded-b-0 rounded-t-2xl w-full h-[70dvh] left-0 bottom-0" : "",
        direction === DrawerDirection.Top ? "rounded-t-0 rounded-b-2xl w-full h-[70dvh] left-0 top-0" : "",
        direction === DrawerDirection.Left ? "rounded-l-0 rounded-r-2xl h-full w-[30dvh] left-0 top-0" : "",
        direction === DrawerDirection.Right ? "rounded-r-0 rounded-l-2xl h-full w-[30dvh] right-0 top-0" : "",
        className,
      )}
    >
      <DrawerTitle
        onClose={onClose}
        className=""
      >
        {title}
      </DrawerTitle>
      {children}
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
  open: boolean;
  children: React.ReactNode;
  isMobile?: boolean;
  title: any;
  onClose: () => void;
  direction?: DrawerDirection;
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
