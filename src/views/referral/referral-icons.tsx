import type { ReactNode } from "react";

import { referralIconStrokeClass } from "./referral-ui";

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
