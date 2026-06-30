"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";
import { useFeaturedScheduleMatch } from "@/store/match-live-store";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { RoadToFinalBannerSlide } from "@/views/home/matches/road-to-final-banner-slide";
import { SpecialMatchDataCard } from "@/views/home/matches/special-match-data-card";

const AUTO_PLAY_INTERVAL_MS = 5000;

const VIEWPORT_CLASS =
  "relative min-h-[160px] overflow-hidden rounded-[12px] border border-[#EBEBEB] sm:min-h-[280px] lg:min-h-[345px]";

interface CarouselSlide {
  id: string;
  node: ReactNode;
}

export interface HomeMatchesFeatureCarouselProps {
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
}

export function HomeMatchesFeatureCarousel({
  matches,
  snapshots,
}: HomeMatchesFeatureCarouselProps) {
  const t = useTranslations("home");
  const featuredMatch = useFeaturedScheduleMatch(matches);
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const slides = useMemo(() => {
    const items: CarouselSlide[] = [];

    if (featuredMatch) {
      items.push({
        id: "featured-match",
        node: (
          <SpecialMatchDataCard
            matches={matches}
            snapshots={snapshots}
            embedded
          />
        ),
      });
    }

    items.push({
      id: "road-to-final",
      node: <RoadToFinalBannerSlide />,
    });

    return items;
  }, [featuredMatch, matches, snapshots]);

  const slideCount = slides.length;
  const hasMultipleSlides = slideCount > 1;

  const clearAutoPlay = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (!hasMultipleSlides || isPaused) {
      return;
    }

    clearAutoPlay();
    intervalRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, AUTO_PLAY_INTERVAL_MS);
  }, [clearAutoPlay, hasMultipleSlides, isPaused, slideCount]);

  const goToSlide = useCallback(
    (index: number) => {
      setActiveIndex((index + slideCount) % slideCount);
      clearAutoPlay();
      startAutoPlay();
    },
    [clearAutoPlay, slideCount, startAutoPlay],
  );

  const goToPrevious = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    if (activeIndex >= slideCount) {
      setActiveIndex(0);
    }
  }, [activeIndex, slideCount]);

  useEffect(() => {
    startAutoPlay();
    return clearAutoPlay;
  }, [clearAutoPlay, startAutoPlay]);

  if (slideCount === 0) {
    return null;
  }

  if (!hasMultipleSlides) {
    return <div className={VIEWPORT_CLASS}>{slides[0]?.node}</div>;
  }

  const activeSlide = slides[activeIndex];

  const motionProps = prefersReducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        initial: { opacity: 0.3, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0.3, x: -24 },
      };

  return (
    <div
      className="w-full"
      onMouseEnter={() => {
        setIsPaused(true);
        clearAutoPlay();
      }}
      onMouseLeave={() => {
        setIsPaused(false);
      }}
    >
      <div className={VIEWPORT_CLASS}>
        <AnimatePresence mode="wait" initial={false}>
          {activeSlide ? (
            <motion.div
              key={activeSlide.id}
              {...motionProps}
              transition={{
                duration: 0.35,
                ease: "linear",
              }}
              className="h-full min-h-[inherit] w-full"
            >
              {activeSlide.node}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          aria-label={t("carouselPreviousSlide")}
          onClick={(event) => {
            event.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-3 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-opacity hover:bg-black/55"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label={t("carouselNextSlide")}
          onClick={(event) => {
            event.stopPropagation();
            goToNext();
          }}
          className="absolute right-3 top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-opacity hover:bg-black/55"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label={t("carouselPaginationAria")}
        className="mt-[11px] flex items-center justify-center gap-1.5"
      >
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={t("carouselGoToSlide", { index: index + 1 })}
              onClick={(event) => {
                event.stopPropagation();
                goToSlide(index);
              }}
              className={cn(
                "h-1 rounded-[2px] transition-all",
                isActive ? "w-[50px] bg-black" : "w-5 bg-black/30",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
