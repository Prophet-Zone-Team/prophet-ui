import type { ReactNode } from "react";

import { referralIconStrokeClass } from "./referral-ui";
import { cn } from "@/lib/cn";

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function LightningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 17v-5M12 8h.01" />
    </svg>
  );
}

export function UsersMetricIcon() {
  return (
    <svg
      className={referralIconStrokeClass}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function CheckMetricIcon() {
  return (
    <svg
      className={referralIconStrokeClass}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function TrendChartIcon() {
  return (
    <svg className="trend" viewBox="0 0 86 46" aria-label="Trending up">
      <path d="M5 36 20 29l10 4 13-16 13 7 22-20" />
      <path d="M67 4h11v11" />
    </svg>
  );
}

export function TargetStepIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="24" />
      <circle cx="32" cy="32" r="8" />
      <path d="M32 8v8M32 48v8M8 32h8M48 32h8M47 17l-6 6M17 47l6-6" />
    </svg>
  );
}

export function MessageStepIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 14h28a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H30l-12 8V18a4 4 0 0 1 4-4Z" />
      <path d="M26 26h18M26 34h12" />
    </svg>
  );
}

export function PlayStepIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="24" />
      <path d="m27 20 17 12-17 12Z" />
    </svg>
  );
}

const signalIcons: Record<string, ReactNode> = {
  odds: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M4 27 13 18l6 4L31 8" />
      <path d="M25 8h6v6" />
    </svg>
  ),
  volume: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M7 29V18M15 29V10M23 29V15M31 29V5" />
    </svg>
  ),
  squad: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M8 28v-3a8 8 0 0 1 8-8h4a8 8 0 0 1 8 8v3" />
      <circle cx="18" cy="10" r="5" />
      <path d="M4 18a7 7 0 0 1 4-6M32 18a7 7 0 0 0-4-6" />
    </svg>
  ),
  injury: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="11" />
      <path d="M18 12v12M12 18h12" />
    </svg>
  ),
  weather: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M9 29h17a6 6 0 0 0 1-12 9 9 0 0 0-17-3 7 7 0 0 0-1 15Z" />
      <path d="M8 9 5 6M18 6V2M28 9l3-3" />
    </svg>
  ),
  mispricing: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="12" />
      <circle cx="18" cy="18" r="5" />
      <path d="M18 2v6M18 28v6M2 18h6M28 18h6" />
    </svg>
  ),
};

export function SignalTaxonomyIcon({ id }: { id: string }) {
  return signalIcons[id] ?? null;
}

const whyIcons: Record<string, ReactNode> = {
  media: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M18 3 30 8v8c0 8-5 14-12 17C11 30 6 24 6 16V8l12-5Z" />
      <path d="M18 22V12M18 12l5 4M18 12l-5 4" />
    </svg>
  ),
  "world-cup": (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M18 3 30 8v8c0 8-5 14-12 17C11 30 6 24 6 16V8l12-5Z" />
      <path d="M18 12v9M14 17h8" />
    </svg>
  ),
  execution: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M18 4v20" />
      <circle cx="18" cy="25" r="6" />
      <path d="M18 25h.01" />
    </svg>
  ),
  intelligence: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M18 3 31 10v16l-13 7-13-7V10l13-7Z" />
      <circle cx="18" cy="18" r="5" />
      <path d="m18 14 2 4-2 4-2-4 2-4Z" />
    </svg>
  ),
};

export function WhyItemIcon({ id }: { id: string }) {
  return whyIcons[id] ?? null;
}

const categoryIcons: Record<string, ReactNode> = {
  sports: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M12 5h12v8a6 6 0 0 1-12 0V5Z" />
      <path d="M12 8H6v4a5 5 0 0 0 6 5M24 8h6v4a5 5 0 0 1-6 5M18 19v7M13 31h10M10 31h16" />
    </svg>
  ),
  politics: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M6 16h24M8 28h20M10 16v12M16 16v12M22 16v12M28 16v12M18 5 5 13h26L18 5Z" />
    </svg>
  ),
  crypto: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="12" />
      <path d="M18 10v16M14 12h6a4 4 0 0 1 0 8h-6M14 20h7a3 3 0 0 1 0 6h-7" />
    </svg>
  ),
  macro: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="13" />
      <path d="M5 18h26M18 5a20 20 0 0 1 0 26M18 5a20 20 0 0 0 0 26" />
    </svg>
  ),
  elections: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M8 15h20v16H8V15Z" />
      <path d="m18 5 11 10H7L18 5Z" />
      <path d="M14 23h8M14 27h5" />
    </svg>
  ),
  culture: (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M7 6h10v8c0 6-4 9-5 9s-5-3-5-9V6ZM19 6h10v8c0 6-4 9-5 9s-5-3-5-9V6Z" />
      <path d="M10 13h4M22 13h4M10 18c1 1 3 1 4 0M22 18c1 1 3 1 4 0" />
    </svg>
  ),
};

export function CategoryIcon({ id }: { id: string }) {
  return categoryIcons[id] ?? null;
}

export function XBrandIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn("size-3", className)}
      aria-hidden="true"
    >
      <path
        d="M7.1428 5.08177L11.6108 0H10.5524L6.6712 4.41152L3.5736 0H0L4.6852 6.67164L0 12H1.0584L5.1544 7.34028L8.4264 12H12M1.4404 0.780949H3.0664L10.5516 11.2574H8.9252"
        fill="black"
      />
    </svg>
  );
}

export function TelegramBrandIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="13"
      viewBox="0 0 15 13"
      fill="none"
      className={cn("w-4 h-3", className)}
      aria-hidden="true"
    >
      <path
        d="M14.8313 1.13557L12.5868 11.7207C12.4174 12.4678 11.9758 12.6537 11.3483 12.3018L7.92836 9.78166L6.27817 11.3688C6.09555 11.5514 5.94282 11.7041 5.59086 11.7041L5.83657 8.22112L12.175 2.49357C12.4506 2.24787 12.1153 2.11174 11.7467 2.35744L3.91079 7.29143L0.537348 6.23557C-0.196441 6.00647 -0.209722 5.50178 0.690083 5.14983L13.885 0.0664261C14.4959 -0.162675 15.0305 0.202559 14.8313 1.13557Z"
        fill="black"
      />
    </svg>
  )
}

export function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="16"
      viewBox="0 0 18 16"
      fill="none"
      className={cn("w-4.5 h-4", className)}
      aria-hidden="true"
    >
      <path
        d="M17.1143 10.8975C17.3061 10.902 17.4884 10.9805 17.624 11.1162C17.7597 11.2519 17.8382 11.4342 17.8428 11.626C17.8427 14.0555 16.0913 16 13.9531 16H3.88965C1.75158 15.9999 3.47942e-05 14.0555 0 11.626C0.00453158 11.4342 0.0831487 11.2519 0.21875 11.1162C0.354383 10.9806 0.53676 10.902 0.728516 10.8975C0.920322 10.902 1.10359 10.9805 1.23926 11.1162C1.37464 11.2518 1.4525 11.4344 1.45703 11.626C1.45706 13.2288 2.52774 14.531 3.88965 14.543H13.9531C15.3151 14.543 16.3857 13.2288 16.3857 11.626C16.3903 11.4342 16.4689 11.2519 16.6045 11.1162C16.7401 10.9806 16.9225 10.902 17.1143 10.8975ZM8.99512 0C9.18095 8.11803e-05 9.35958 0.0710947 9.49512 0.198242C9.63064 0.325383 9.71267 0.499141 9.72461 0.68457V8.95215L11.2324 7.44434C11.3703 7.32254 11.5495 7.258 11.7334 7.26367C11.9171 7.26935 12.0917 7.34477 12.2217 7.47461C12.3517 7.60468 12.4279 7.78001 12.4336 7.96387C12.4392 8.14763 12.3747 8.32707 12.2529 8.46484L9.48145 11.2363C9.33097 11.3611 9.14079 11.4287 8.94531 11.4287C8.74998 11.4286 8.56052 11.361 8.41016 11.2363L5.7373 8.46484C5.61556 8.32706 5.55103 8.14764 5.55664 7.96387C5.56231 7.78001 5.63751 7.60468 5.76758 7.47461C5.89754 7.34474 6.07223 7.26943 6.25586 7.26367C6.43966 7.258 6.61901 7.32261 6.75684 7.44434L8.26465 8.95215V0.68457C8.27658 0.499208 8.35872 0.325375 8.49414 0.198242C8.62975 0.0710137 8.80917 0 8.99512 0Z"
        fill="black"
      />
    </svg>
  )
}

export function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn("w-4 h-4", className)}
      aria-hidden="true"
    >
      <path
        d="M9.06225 5.61401C9.26962 5.61401 9.45789 5.69661 9.59643 5.82983C9.73093 5.93215 9.86166 6.04239 9.98413 6.16479L10.0476 6.22729C11.5164 7.6973 11.3915 10.0181 9.9226 11.489L6.51538 14.8972C5.04437 16.3672 2.63777 16.3672 1.16674 14.8972L1.10327 14.8337C-0.367755 13.3637 -0.367755 10.9562 1.10327 9.48413L2.66772 8.02026C2.71399 7.96395 2.76765 7.91345 2.8269 7.87084L2.8435 7.8562L2.84448 7.85815C2.97853 7.76694 3.14082 7.71362 3.31518 7.71362C3.77724 7.71374 4.15185 8.0885 4.15209 8.55053C4.15209 8.81633 4.02792 9.05343 3.83471 9.20678L2.32885 10.7126C1.53035 11.5095 1.53024 12.8085 2.32885 13.6072L2.3933 13.6716C3.19203 14.469 4.49013 14.469 5.28881 13.6716L8.69799 10.2634C9.49644 9.46458 9.73488 8.09037 8.93627 7.29272L8.8728 7.22924C8.8061 7.16255 8.73452 7.10361 8.66186 7.0437C8.58984 6.9998 8.52535 6.94394 8.47143 6.87963C8.3594 6.74588 8.29182 6.57357 8.29174 6.38549C8.29174 5.95994 8.63671 5.61416 9.06225 5.61401ZM9.48413 1.10327C10.9551 -0.367755 13.3618 -0.367755 14.8328 1.10327L14.8962 1.16674C16.3672 2.63775 16.3673 5.04439 14.8953 6.51538L13.3132 7.97436C13.2597 8.04171 13.1964 8.10117 13.1248 8.14916L13.1013 8.17065C13.1004 8.169 13.0993 8.16739 13.0984 8.16577C12.9718 8.24381 12.8224 8.28881 12.6628 8.28881C12.2045 8.28861 11.8328 7.91712 11.8328 7.45873C11.8328 7.18512 11.9655 6.94205 12.1697 6.79077L13.6706 5.28881C14.4691 4.49102 14.4693 3.19106 13.6706 2.39233L13.6072 2.32983C12.8085 1.53113 11.5094 1.53131 10.7126 2.32983L7.30248 5.73705C6.50373 6.53581 6.201 7.69709 6.99975 8.49584L7.06225 8.55737C7.18678 8.68182 7.36654 8.81328 7.46264 9.02905C7.50894 9.12474 7.5349 9.23205 7.53491 9.34545C7.53491 9.74726 7.20921 10.073 6.80737 10.073C6.67551 10.073 6.5517 10.0376 6.44506 9.97631L6.44311 9.97534C6.37645 9.93669 6.31647 9.88781 6.26538 9.8308C6.19461 9.77043 6.12513 9.70714 6.05834 9.64038L5.99584 9.57885C4.52482 8.10688 4.60588 5.98249 6.0769 4.51147L9.48413 1.10327Z"
        fill="black"
      />
    </svg>
  )
}
